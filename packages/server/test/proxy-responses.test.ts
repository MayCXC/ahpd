/*
 * The Responses endpoints: the id the proxy sends, the follow-up it sends to
 * the connector named in that id, and the usage a create records.
 *
 * The provider's ids must never reach a caller, so every answer is read back to
 * check that its id is the proxy's. The streamed case is here too, because the
 * common Responses call is streamed and its usage arrives in `response.completed`.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ModelDialect, ModelUse, Usage } from '@ahpd/sdk';
import { decodeResponseId, encodeResponseId } from '../src/proxy/responseids.js';
import {
  answerJson, fakeProvider, memoryUsage, pause, people, ROOT_TOKEN, send, serveProxy, type FakeProvider, type People, type Served,
} from './fixtures/proxy-harness.js';

let folder: string;
let who: People;
const open: Served[] = [];
const fakes: FakeProvider[] = [];

beforeEach(async () => {
  folder = mkdtempSync(join(tmpdir(), 'ahpd-proxy-responses-'));
  who = await people(folder);
});

afterEach(async () => {
  for (const one of open.splice(0)) await one.close();
  for (const one of fakes.splice(0)) await one.close();
  rmSync(folder, { recursive: true, force: true });
});

const asRoot = { authorization: `Bearer ${ROOT_TOKEN}` };
const CREATE = { model: 'fake/model', input: 'hello' };

/** The proxy with a usage store of its own. */
const proxy = async (options: Parameters<typeof serveProxy>[0]): Promise<{ served: Served; usage: Usage & { entries: ModelUse[] } }> => {
  const usage = memoryUsage();
  const served = await serveProxy({ users: who.users, usage: () => usage, ...options });
  open.push(served);
  return { served, usage: usage as Usage & { entries: ModelUse[] } };
};

/** One connector of the host's, called in the Responses dialect. */
const connector = (id: string, endpoint: string): { id: string; adapter: string; endpoint: string; accepts: ModelDialect[] } => ({
  id,
  adapter: 'fake',
  endpoint,
  accepts: ['openai-responses'],
});

/** A table whose one name routes to the connector above. */
const table = (id = 'fake') => ({
  proxy: { models: { 'fake/model': [{ provider: 'fake', id: 'fake-model', price: { input: 1, output: 2 } }] } },
  providers: [connector(id, 'http://127.0.0.1:1/v1')],
});

describe('a Responses create and its follow-up', () => {
  it('rewrites the create id and sends GET, DELETE, cancel and input_items back to the connector', async () => {
    const fake = await fakeProvider((request, response) => {
      if (request.method === 'POST' && request.url === '/v1/responses') {
        answerJson(200, {
          id: 'resp_provider',
          object: 'response',
          previous_response_id: 'resp_before',
          output: [],
          usage: { input_tokens: 10, output_tokens: 5, input_tokens_details: { cached_tokens: 2 } },
        })(request, response);
        return;
      }
      if (request.method === 'GET' && request.url === '/v1/responses/resp_provider') {
        answerJson(200, { id: 'resp_provider', object: 'response', previous_response_id: 'resp_before', output: [] })(request, response);
        return;
      }
      if (request.method === 'DELETE' && request.url === '/v1/responses/resp_provider') {
        answerJson(200, { id: 'resp_provider', object: 'response.deleted', deleted: true })(request, response);
        return;
      }
      if (request.method === 'POST' && request.url === '/v1/responses/resp_provider/cancel') {
        answerJson(200, { id: 'resp_provider', object: 'response', status: 'cancelled' })(request, response);
        return;
      }
      if (request.method === 'GET' && request.url === '/v1/responses/resp_provider/input_items') {
        answerJson(200, { object: 'list', data: [], first_id: null, last_id: null, has_more: false })(request, response);
        return;
      }
      answerJson(404, { error: { message: 'nothing here' } })(request, response);
    });
    fakes.push(fake);
    const { served, usage } = await proxy({ ...table(), providers: [connector('fake', fake.endpoint)] });

    const created = await send(served.port, '/v1/responses', { headers: asRoot, body: CREATE });
    expect(created.status).toBe(200);
    const id = (created.json as { id: string }).id;
    expect(id.startsWith('resp_')).toBe(true);
    expect(decodeResponseId(id)).toEqual({ connector: 'fake', id: 'resp_provider' });
    expect((created.json as { previous_response_id: string }).previous_response_id).toBe(encodeResponseId('fake', 'resp_before'));

    const got = await send(served.port, `/responses/${id}`, { headers: asRoot });
    expect(got.status).toBe(200);
    expect((got.json as { id: string }).id).toBe(id);
    expect((got.json as { previous_response_id: string }).previous_response_id).toBe(encodeResponseId('fake', 'resp_before'));

    const deleted = await send(served.port, `/responses/${id}`, { headers: asRoot, method: 'DELETE' });
    expect(deleted.status).toBe(200);
    expect((deleted.json as { id: string }).id).toBe(id);

    const cancelled = await send(served.port, `/responses/${id}/cancel`, { headers: asRoot, method: 'POST' });
    expect(cancelled.status).toBe(200);
    expect((cancelled.json as { id: string }).id).toBe(id);

    const items = await send(served.port, `/responses/${id}/input_items`, { headers: asRoot });
    expect(items.status).toBe(200);

    expect(fake.received.map((one) => `${one.method} ${one.url}`)).toEqual([
      'POST /v1/responses',
      'GET /v1/responses/resp_provider',
      'DELETE /v1/responses/resp_provider',
      'POST /v1/responses/resp_provider/cancel',
      'GET /v1/responses/resp_provider/input_items',
    ]);
    // Only the create is a model call; a follow-up reads what is already there.
    await pause(20);
    expect(usage.entries).toHaveLength(1);
    expect(usage.entries[0]?.model).toEqual({
      name: 'fake/model', provider: 'fake', connector: 'fake', input: 8, output: 5, cache: { read: 2 },
    });
    expect(usage.entries[0]?.cost?.amount).toBeCloseTo((10 * 1 + 5 * 2) / 1_000_000, 12);
  });

  it('answers a compact call at the root and under /v1', async () => {
    const fake = await fakeProvider(answerJson(200, { id: 'resp_compact', object: 'response', output: [] }));
    fakes.push(fake);
    const { served } = await proxy({ ...table(), providers: [connector('fake', fake.endpoint)] });
    for (const path of ['/responses/compact', '/v1/responses/compact']) {
      const got = await send(served.port, path, { headers: asRoot, body: CREATE });
      expect(got.status, path).toBe(200);
      expect((got.json as { id: string }).id).toBe(encodeResponseId('fake', 'resp_compact'));
    }
    expect(fake.received.map((one) => one.url)).toEqual(['/v1/responses/compact', '/v1/responses/compact']);
  });
});

describe('a Responses id that is not the caller\'s', () => {
  it('answers the same 404 for a forged id and another person\'s connector', async () => {
    const fake = await fakeProvider(answerJson(200, { id: 'resp_x', object: 'response' }));
    fakes.push(fake);
    const owned = {
      id: 'ana-only',
      adapter: 'fake',
      owner: 'user:ana' as const,
      endpoint: fake.endpoint,
      accepts: ['openai-responses'] as ModelDialect[],
    };
    const { served } = await proxy({ ...table(), providers: [owned] });
    const asDee = { 'x-api-key': who.dee };

    const somebodys = await send(served.port, `/responses/${encodeResponseId('ana-only', 'resp_x')}`, { headers: asDee });
    const forged = await send(served.port, `/responses/${encodeResponseId('ghost', 'resp_x')}`, { headers: asDee });
    const nonsense = await send(served.port, '/responses/not-an-id', { headers: asDee });

    expect(somebodys.status).toBe(404);
    expect(forged.status).toBe(404);
    expect(nonsense.status).toBe(404);
    expect(somebodys.json).toEqual(forged.json);
    expect(forged.json).toEqual(nonsense.json);
    // The provider never saw a call for an id the caller may not use.
    expect(fake.received).toEqual([]);
  });
});

describe('a create that continues a response', () => {
  it('goes only to the connector in previous_response_id, with the provider\'s own id', async () => {
    const first = await fakeProvider(answerJson(200, { id: 'resp_first', object: 'response' }));
    const second = await fakeProvider(answerJson(200, { id: 'resp_second', object: 'response' }));
    fakes.push(first, second);
    const { served, usage } = await proxy({
      ...table(),
      providers: [connector('fake-a', first.endpoint), connector('fake-z', second.endpoint)],
    });

    const previous = encodeResponseId('fake-z', 'resp_second');
    const got = await send(served.port, '/v1/responses', {
      headers: asRoot,
      body: { model: 'fake/model', previous_response_id: previous },
    });
    expect(got.status).toBe(200);
    // `fake-a` sorts first, so without the pin it would take the call.
    expect(first.received).toEqual([]);
    expect(second.received).toHaveLength(1);
    expect(JSON.parse(second.received[0]?.body ?? '{}')).toMatchObject({
      model: 'fake-model', previous_response_id: 'resp_second',
    });
    expect((got.json as { id: string }).id).toBe(previous);
    await pause(20);
    expect(usage.entries).toHaveLength(1);
  });

  it('answers a 404 when previous_response_id is not this proxy\'s id', async () => {
    const fake = await fakeProvider(answerJson(200, { id: 'resp_second', object: 'response' }));
    fakes.push(fake);
    const { served } = await proxy({ ...table(), providers: [connector('fake', fake.endpoint)] });
    const got = await send(served.port, '/v1/responses', {
      headers: asRoot,
      body: { model: 'fake/model', previous_response_id: 'resp_not-made-here' },
    });
    expect(got.status).toBe(404);
    expect(fake.received).toEqual([]);
  });
});

describe('a streamed Responses create', () => {
  it('rewrites each event\'s id and records the usage in response.completed', async () => {
    const fake = await fakeProvider((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.write('event: response.created\n');
      response.write('data: {"type":"response.created","response":{"id":"resp_stream","object":"response","output":[]}}\n\n');
      response.write('event: response.output_item.added\n');
      response.write('data: {"type":"response.output_item.added","item":{"id":"msg_not_a_response","type":"message"}}\n\n');
      response.write('event: response.completed\n');
      response.write('data: {"type":"response.completed","response":{"id":"resp_stream","object":"response","usage":{"input_tokens":12,"output_tokens":4}}}\n\n');
      response.end('data: [DONE]\n\n');
    });
    fakes.push(fake);
    const { served, usage } = await proxy({ ...table(), providers: [connector('fake', fake.endpoint)] });

    const got = await send(served.port, '/v1/responses', { headers: asRoot, body: CREATE });
    expect(got.status).toBe(200);
    const proxyId = encodeResponseId('fake', 'resp_stream');
    expect(got.text).toContain(proxyId);
    expect(got.text).not.toContain('"id":"resp_stream"');
    // An output item's own id is not a response id and is left as it came.
    expect(got.text).toContain('"id":"msg_not_a_response"');

    await pause(20);
    const [entry] = usage.entries;
    expect(entry?.model).toEqual({ name: 'fake/model', provider: 'fake', connector: 'fake', input: 12, output: 4 });
  });
});
