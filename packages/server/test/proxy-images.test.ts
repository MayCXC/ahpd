/*
 * The image endpoints: a JSON generation, a multipart edit whose file and
 * fields pass through, OpenRouter's one image path, and the usage a generation
 * reports.
 *
 * A multipart body is read, its `model` field is rewritten, and it is sent
 * again as a form, so the file's bytes and its filename must be the ones the
 * caller sent while the model is the provider's own id.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ModelUse, ProviderConnector, Usage } from '@ahpd/sdk';
import {
  answerJson, fakeProvider, memoryUsage, pause, people, ROOT_TOKEN, send, serveProxy, type FakeProvider, type People, type Served,
} from './fixtures/proxy-harness.js';

let folder: string;
let who: People;
const open: Served[] = [];
const fakes: FakeProvider[] = [];

beforeEach(async () => {
  folder = mkdtempSync(join(tmpdir(), 'ahpd-proxy-images-'));
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

/** A connector that accepts images, with the provider's own model id. */
const images = (endpoint: string, id = 'fake'): ProviderConnector => ({
  id,
  adapter: id === 'openrouter' ? 'openrouter' : 'fake',
  owner: 'host',
  provider: {
    endpoint,
    accepts: ['openai-images'],
    ...(id === 'openrouter' ? { paths: { 'openai-images': '/images' } } : {}),
  },
});

/** A table whose one name is an image model, with a price, on the adapter that serves it. */
const table = (provider = 'fake') => ({ proxy: { models: { 'fake/model': [{ provider, id: 'fake-model', price: { input: 1, output: 2 } }] } } });

/** A multipart body with a model, a prompt and one file. */
const multipart = (): { body: string; contentType: string } => {
  const boundary = '----ahpd-proxy-images-boundary';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="model"',
    '',
    'fake/model',
    `--${boundary}`,
    'Content-Disposition: form-data; name="prompt"',
    '',
    'make it blue',
    `--${boundary}`,
    'Content-Disposition: form-data; name="image"; filename="a.png"',
    'Content-Type: image/png',
    '',
    'PNGDATA',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
};

describe('an image generation', () => {
  it('answers at the root and under /v1, and records input and output tokens', async () => {
    const fake = await fakeProvider(answerJson(200, {
      created: 1,
      data: [{ url: 'https://images.test/one.png' }],
      usage: { input_tokens: 3, output_tokens: 7 },
    }));
    fakes.push(fake);
    const { served, usage } = await proxy({ ...table(), providers: [images(fake.endpoint)] });

    for (const path of ['/images/generations', '/v1/images/generations']) {
      const got = await send(served.port, path, { headers: asRoot, body: { model: 'fake/model', prompt: 'a cat' } });
      expect(got.status, path).toBe(200);
      expect(got.json).toMatchObject({ data: [{ url: 'https://images.test/one.png' }] });
    }
    expect(fake.received.map((one) => one.url)).toEqual(['/v1/images/generations', '/v1/images/generations']);
    expect(fake.received.every((one) => (JSON.parse(one.body) as { model: string }).model === 'fake-model')).toBe(true);

    await pause(20);
    expect(usage.entries).toHaveLength(2);
    expect(usage.entries[0]?.model).toEqual({ name: 'fake/model', provider: 'fake', connector: 'fake', input: 3, output: 7 });
    expect(usage.entries[0]?.cost?.amount).toBeCloseTo((3 * 1 + 7 * 2) / 1_000_000, 12);
  });

  it('reads OpenRouter\'s chat-shaped usage as input and output tokens', async () => {
    const fake = await fakeProvider(answerJson(200, {
      created: 1,
      data: [{ url: 'https://images.test/two.png' }],
      usage: { prompt_tokens: 5, completion_tokens: 9, prompt_tokens_details: { cached_tokens: 1 } },
    }));
    fakes.push(fake);
    const { served, usage } = await proxy({
      ...table('openrouter'),
      providers: [images(fake.endpoint, 'openrouter')],
    });
    const got = await send(served.port, '/images/generations', { headers: asRoot, body: { model: 'fake/model', prompt: 'a cat' } });
    expect(got.status).toBe(200);

    await pause(20);
    expect(usage.entries[0]?.model).toEqual({
      name: 'fake/model', provider: 'openrouter', connector: 'openrouter', input: 4, output: 9, cache: { read: 1 },
    });
  });
});

describe('a multipart image edit', () => {
  it('arrives with the provider\'s model id, its prompt and its file unchanged', async () => {
    const fake = await fakeProvider(answerJson(200, { created: 1, data: [{ url: 'https://images.test/edit.png' }] }));
    fakes.push(fake);
    const { served } = await proxy({ ...table(), providers: [images(fake.endpoint)] });
    const form = multipart();
    const got = await send(served.port, '/v1/images/edits', {
      headers: { ...asRoot, 'content-type': form.contentType },
      body: form.body,
    });
    expect(got.status).toBe(200);

    expect(fake.received).toHaveLength(1);
    const sent = fake.received[0];
    expect(sent?.url).toBe('/v1/images/edits');
    expect(sent?.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/u);
    expect(sent?.body).toContain('name="model"');
    expect(sent?.body).toContain('fake-model');
    expect(sent?.body).toContain('name="prompt"');
    expect(sent?.body).toContain('make it blue');
    expect(sent?.body).toContain('filename="a.png"');
    expect(sent?.body).toContain('PNGDATA');
  });

  it('refuses a form with no model, as a JSON body is refused', async () => {
    const fake = await fakeProvider(answerJson(200, { created: 1, data: [] }));
    fakes.push(fake);
    const { served } = await proxy({ ...table(), providers: [images(fake.endpoint)] });
    const form = multipart().body.replace('fake/model', '');
    const got = await send(served.port, '/v1/images/edits', {
      headers: { ...asRoot, 'content-type': 'multipart/form-data; boundary=----ahpd-proxy-images-boundary' },
      body: form,
    });
    expect(got.status).toBe(400);
    expect(fake.received).toEqual([]);
  });
});

describe('OpenRouter\'s one image path', () => {
  it('sends every image call to /images', async () => {
    const fake = await fakeProvider(answerJson(200, { created: 1, data: [] }));
    fakes.push(fake);
    const { served } = await proxy({ ...table('openrouter'), providers: [images(fake.endpoint, 'openrouter')] });
    const got = await send(served.port, '/v1/images/generations', { headers: asRoot, body: { model: 'fake/model', prompt: 'a cat' } });
    expect(got.status).toBe(200);
    expect(fake.received.map((one) => one.url)).toEqual(['/v1/images']);
  });
});
