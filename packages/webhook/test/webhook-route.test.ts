import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/resources/records.js';
import { webhookRoute } from '../src/route.js';
import type { Endpoint } from '../src/record.js';
import type { WebhookSeams } from '../src/route.js';
import type { RecordCollection } from '../../sdk/src/types/records.js';

/*
 * The route, over a collection in memory and a vault stub.
 *
 * The handler is called with a `Request` as the daemon's listener builds one,
 * so what is checked is the whole answer: the status, and which target was
 * reached with which endpoint.
 */

const PREFIX = 'http://127.0.0.1:1/plugins/webhook';

/** The vault this case reads from: one name, one value. */
const VAULT: Record<string, string> = { 'host:ci-hook': 'right-token' };

/** A route over one collection, with the calls each seam was given. */
async function made(targets: Partial<Pick<WebhookSeams, 'bot' | 'automation'>> = {}) {
  const webhooks: RecordCollection = await memoryRecords().collection('webhooks');
  await webhooks.put({ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook' });
  await webhooks.put({ id: 'deploys', automation: true, secret: 'host:ci-hook' });
  await webhooks.put({ id: 'lost', bot: 'bot://motion', secret: 'host:missing' });
  const problems: string[] = [];
  const reached: Endpoint[] = [];
  const route = webhookRoute({
    endpoint: (id) => webhooks.get(id),
    secret: async (name) => {
      const value = VAULT[name];
      if (value === undefined) throw new Error(`the vault has no secret ${name}`);
      return value;
    },
    problem: (line) => { problems.push(line); },
    bot: async (endpoint) => {
      reached.push(endpoint);
      return new Response('reached', { status: 200 });
    },
    ...targets,
  });
  return { route, problems, reached };
}

/** One call to the route, with a bearer when one is given. */
const call = (path: string, bearer?: string, method = 'POST'): Request => new Request(`${PREFIX}${path}`, {
  method,
  headers: bearer === undefined ? {} : { authorization: `Bearer ${bearer}` },
  ...(method === 'POST' ? { body: '{}' } : {}),
});

it('answers 405 to a GET', async () => {
  const { route } = await made();
  expect((await route(call('/ci', 'right-token', 'GET'))).status).toBe(405);
});

it('answers 404 to an endpoint the collection does not hold', async () => {
  const { route } = await made();
  expect((await route(call('/nobody', 'right-token'))).status).toBe(404);
});

it('answers 404 to a path with more than one segment after the prefix', async () => {
  const { route, reached } = await made();
  expect((await route(call('/ci/more', 'right-token'))).status).toBe(404);
  expect((await route(call('', 'right-token'))).status).toBe(404);
  expect((await route(call('/', 'right-token'))).status).toBe(404);
  expect(reached).toEqual([]);
});

it('answers 401 to a call with no Authorization header', async () => {
  const { route, reached } = await made();
  expect((await route(call('/ci'))).status).toBe(401);
  expect(reached).toEqual([]);
});

it('answers 401 to a wrong bearer', async () => {
  const { route, reached } = await made();
  expect((await route(call('/ci', 'wrong-token'))).status).toBe(401);
  expect((await route(call('/ci', 'right-token-and-more'))).status).toBe(401);
  expect(reached).toEqual([]);
});

it('answers 401 and reports the problem when the vault refuses the secret name', async () => {
  const { route, problems, reached } = await made();
  expect((await route(call('/lost', 'anything'))).status).toBe(401);
  expect(reached).toEqual([]);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('lost');
  expect(problems[0]).toContain('host:missing');
});

it('passes a call with the right bearer to the target with the endpoint record', async () => {
  const { route, reached } = await made();
  const answer = await route(call('/ci', 'right-token'));
  expect(answer.status).toBe(200);
  expect(await answer.text()).toBe('reached');
  expect(reached).toEqual([{ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'callback' }]);
});

it('answers 501 for a target with no handler', async () => {
  const { route } = await made();
  expect((await route(call('/deploys', 'right-token'))).status).toBe(501);
});

it('answers 404 and reports the problem for a record that is not an endpoint', async () => {
  const webhooks = await memoryRecords().collection('webhooks');
  await webhooks.put({ id: 'broken', secret: 'host:ci-hook' });
  const problems: string[] = [];
  const route = webhookRoute({
    endpoint: (id) => webhooks.get(id),
    secret: async () => 'right-token',
    problem: (line) => { problems.push(line); },
  });
  expect((await route(call('/broken', 'right-token'))).status).toBe(404);
  expect(problems[0]).toContain('webhooks/broken');
});
