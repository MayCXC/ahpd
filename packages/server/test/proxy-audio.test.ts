/*
 * The audio endpoints: speech bytes and their character charge, a transcription
 * charged by tokens, and one charged by seconds.
 *
 * Speech is the one answer that is not JSON or SSE, so it also checks that the
 * bytes reach the caller unchanged while the call still writes a record. A
 * transcription's usage is either tokens or a duration, which are two prices in
 * the table.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ModelDialect, ModelUse, ProviderConnector, Usage } from '@ahpd/sdk';
import { proxyProblems } from '../src/proxy/providers.js';
import {
  answerJson, fakeProvider, memoryUsage, pause, people, ROOT_TOKEN, send, serveProxy, type FakeProvider, type People, type Served,
} from './fixtures/proxy-harness.js';

let folder: string;
let who: People;
const open: Served[] = [];
const fakes: FakeProvider[] = [];

beforeEach(async () => {
  folder = mkdtempSync(join(tmpdir(), 'ahpd-proxy-audio-'));
  who = await people(folder);
});

afterEach(async () => {
  for (const one of open.splice(0)) await one.close();
  for (const one of fakes.splice(0)) await one.close();
  rmSync(folder, { recursive: true, force: true });
});

const asRoot = { authorization: `Bearer ${ROOT_TOKEN}` };

/** The proxy with a usage store of its own. */
const proxy = async (options: Parameters<typeof serveProxy>[0]): Promise<{ served: Served; usage: Usage & { entries: ModelUse[] } }> => {
  const usage = memoryUsage();
  const served = await serveProxy({ users: who.users, usage: () => usage, ...options });
  open.push(served);
  return { served, usage: usage as Usage & { entries: ModelUse[] } };
};

/** One connector that accepts one audio dialect. */
const audio = (endpoint: string, accepts: ModelDialect[]): ProviderConnector => ({
  id: 'fake',
  adapter: 'fake',
  owner: 'host',
  provider: { endpoint, accepts },
});

/** A table entry with the price the audio call is charged by. */
const table = (price: Record<string, number>) => ({
  proxy: { models: { 'fake/model': [{ provider: 'fake', id: 'fake-model', price }] } },
});

/** A multipart body with a model and one audio file. */
const multipart = (): { body: string; contentType: string } => {
  const boundary = '----ahpd-proxy-audio-boundary';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="model"',
    '',
    'fake/model',
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="a.mp3"',
    'Content-Type: audio/mpeg',
    '',
    'AUDIO',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
};

describe('speech', () => {
  it('passes the bytes through and charges the characters of its input', async () => {
    const fake = await fakeProvider((_request, response) => {
      response.writeHead(200, { 'content-type': 'audio/mpeg' });
      response.end('AUDIO');
    });
    fakes.push(fake);
    const { served, usage } = await proxy({
      ...table({ characters: 15 }),
      providers: [audio(fake.endpoint, ['openai-speech'])],
    });

    const got = await send(served.port, '/v1/audio/speech', {
      headers: asRoot,
      body: { model: 'fake/model', input: 'hello', voice: 'alloy' },
    });
    expect(got.status).toBe(200);
    expect(got.text).toBe('AUDIO');
    expect(got.headers['content-type']).toBe('audio/mpeg');
    expect(JSON.parse(fake.received[0]?.body ?? '{}')).toMatchObject({ model: 'fake-model', input: 'hello' });

    await pause(20);
    expect(usage.entries).toHaveLength(1);
    expect(usage.entries[0]?.model).toEqual({ name: 'fake/model', provider: 'fake', connector: 'fake' });
    // Five characters at fifteen dollars per million.
    expect(usage.entries[0]?.cost?.amount).toBeCloseTo((5 * 15) / 1_000_000, 12);
  });

  it('records no cost when the table has no character price', async () => {
    const fake = await fakeProvider((_request, response) => {
      response.writeHead(200, { 'content-type': 'audio/mpeg' });
      response.end('AUDIO');
    });
    fakes.push(fake);
    const { served, usage } = await proxy({
      ...table({}),
      providers: [audio(fake.endpoint, ['openai-speech'])],
    });
    const got = await send(served.port, '/audio/speech', { headers: asRoot, body: { model: 'fake/model', input: 'hello' } });
    expect(got.status).toBe(200);
    await pause(20);
    expect(usage.entries[0]?.cost).toBeUndefined();
  });
});

describe('a transcription', () => {
  it('is charged its token usage, and translations share the dialect', async () => {
    const fake = await fakeProvider(answerJson(200, {
      text: 'hi',
      usage: { type: 'tokens', input_tokens: 10, output_tokens: 2, total_tokens: 12 },
    }));
    fakes.push(fake);
    const { served, usage } = await proxy({
      ...table({ input: 1, output: 2 }),
      providers: [audio(fake.endpoint, ['openai-transcriptions'])],
    });
    for (const path of ['/v1/audio/transcriptions', '/v1/audio/translations']) {
      const form = multipart();
      const got = await send(served.port, path, {
        headers: { ...asRoot, 'content-type': form.contentType },
        body: form.body,
      });
      expect(got.status, path).toBe(200);
      expect(got.json).toMatchObject({ text: 'hi' });
    }
    expect(fake.received.map((one) => one.url)).toEqual(['/v1/audio/transcriptions', '/v1/audio/translations']);

    await pause(20);
    expect(usage.entries).toHaveLength(2);
    expect(usage.entries[0]?.model).toEqual({ name: 'fake/model', provider: 'fake', connector: 'fake', input: 10, output: 2 });
    expect(usage.entries[0]?.cost?.amount).toBeCloseTo((10 * 1 + 2 * 2) / 1_000_000, 12);
  });

  it('is charged its seconds at the per-minute price', async () => {
    const fake = await fakeProvider(answerJson(200, {
      text: 'hi',
      usage: { type: 'duration', seconds: 30 },
    }));
    fakes.push(fake);
    const { served, usage } = await proxy({
      ...table({ minutes: 0.006 }),
      providers: [audio(fake.endpoint, ['openai-transcriptions'])],
    });
    const form = multipart();
    const got = await send(served.port, '/v1/audio/transcriptions', {
      headers: { ...asRoot, 'content-type': form.contentType },
      body: form.body,
    });
    expect(got.status).toBe(200);

    await pause(20);
    expect(usage.entries[0]?.model).toEqual({ name: 'fake/model', provider: 'fake', connector: 'fake' });
    // Thirty seconds is half a minute.
    expect(usage.entries[0]?.cost?.amount).toBeCloseTo(0.5 * 0.006, 12);
  });
});

describe('the price schema', () => {
  it('accepts a file with characters and minutes, and one without them', () => {
    expect(proxyProblems({
      models: { 'm/x': [{ provider: 'openai', id: 'gpt', price: { characters: 15, minutes: 0.006 } }] },
    })).toEqual([]);
    expect(proxyProblems({
      models: { 'm/x': [{ provider: 'openai', id: 'gpt', price: { input: 1, output: 2 } }] },
    })).toEqual([]);
  });
});
