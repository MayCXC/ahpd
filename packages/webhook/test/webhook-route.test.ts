import { expect, it } from 'vitest';
import { webhookRoute } from '../src/route.js';
import type { Call } from '../src/call.js';
import type { Endpoint } from '../src/record.js';
import type { WebhookSeams } from '../src/route.js';

/*
 * The route, over the endpoints the open connectors made.
 *
 * The handler is called with a `Request` as the daemon's listener builds one,
 * so what is checked is the whole answer: the status, and which target was
 * reached with which endpoint.
 */

const PREFIX = 'http://127.0.0.1:1/plugins/webhook';

/** The endpoints the connectors opened: one of each target. */
const ENDPOINTS: Record<string, Endpoint> = {
  ci: { id: 'ci', bot: 'bot://motion', secret: 'right-token', reply: 'none', owner: 'user:alice' },
  deploys: { id: 'deploys', automation: 'ahpd-automation:/deploys', secret: 'right-token', owner: 'user:alice' },
  hooks: { id: 'hooks', secret: 'right-token', owner: 'user:alice' },
};

/** A route over those endpoints, with what each target was given. */
function made(targets: Partial<Pick<WebhookSeams, 'bot' | 'run' | 'fire'>> = {}) {
  const reached: Endpoint[] = [];
  const calls: Call[] = [];
  const route = webhookRoute({
    endpoint: (id) => ENDPOINTS[id],
    bot: async (endpoint, call) => {
      reached.push(endpoint);
      calls.push(call);
      return new Response('reached', { status: 200 });
    },
    ...targets,
  });
  return { route, reached, calls };
}

/** One call to the route, with a bearer when one is given. */
const call = (path: string, bearer?: string, method = 'POST'): Request => new Request(`${PREFIX}${path}`, {
  method,
  headers: {
    ...(bearer === undefined ? {} : { authorization: `Bearer ${bearer}` }),
    ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
  },
  ...(method === 'POST' ? { body: '{}' } : {}),
});

it('answers 405 to a GET', async () => {
  const { route } = made();
  expect((await route(call('/ci', 'right-token', 'GET'))).status).toBe(405);
});

it('answers 404 to an endpoint no connector opened', async () => {
  const { route } = made();
  expect((await route(call('/nobody', 'right-token'))).status).toBe(404);
});

it('answers 404 to a path with more than one segment after the prefix', async () => {
  const { route, reached } = made();
  expect((await route(call('/ci/more', 'right-token'))).status).toBe(404);
  expect((await route(call('', 'right-token'))).status).toBe(404);
  expect((await route(call('/', 'right-token'))).status).toBe(404);
  expect(reached).toEqual([]);
});

it('answers 401 to a call with no Authorization header', async () => {
  const { route, reached } = made();
  expect((await route(call('/ci'))).status).toBe(401);
  expect(reached).toEqual([]);
});

it('answers 401 to a wrong bearer', async () => {
  const { route, reached } = made();
  expect((await route(call('/ci', 'wrong-token'))).status).toBe(401);
  expect((await route(call('/ci', 'right-token-and-more'))).status).toBe(401);
  expect(reached).toEqual([]);
});

it('passes a call with the right bearer to the bot with the endpoint and the call', async () => {
  const { route, reached, calls } = made();
  const answer = await route(call('/ci', 'right-token'));
  expect(answer.status).toBe(200);
  expect(await answer.text()).toBe('reached');
  expect(reached).toEqual([ENDPOINTS['ci']]);
  expect(calls[0]?.body).toEqual({});
});

it('starts the automation a connector names, with the call data and its owner', async () => {
  const ran: { automation: string; data: Record<string, unknown>; owner?: string }[] = [];
  const fired: Record<string, unknown>[] = [];
  const { route } = made({
    run: (automation, data, owner) => { ran.push({ automation, data, ...(owner === undefined ? {} : { owner }) }); },
    fire: (data) => { fired.push(data); },
  });

  const answer = await route(call('/deploys', 'right-token'));
  expect(answer.status).toBe(202);
  expect(await answer.json()).toEqual({ endpoint: 'deploys', automation: 'ahpd-automation:/deploys' });
  expect(ran).toEqual([{
    automation: 'ahpd-automation:/deploys',
    data: { connector: 'deploys', method: 'POST', body: {}, headers: { 'content-type': 'application/json' }, query: {} },
    owner: 'user:alice',
  }]);
  // A connector with an automation starts it and fires no trigger.
  expect(fired).toEqual([]);
});

it('fires the trigger for a connector with neither a bot nor an automation', async () => {
  const fired: { data: Record<string, unknown>; owner?: string }[] = [];
  const { route } = made({ fire: (data, owner) => { fired.push({ data, ...(owner === undefined ? {} : { owner }) }); } });

  const answer = await route(call('/hooks', 'right-token'));
  expect(answer.status).toBe(202);
  expect(fired).toEqual([{
    data: { connector: 'hooks', method: 'POST', body: {}, headers: { 'content-type': 'application/json' }, query: {} },
    owner: 'user:alice',
  }]);
});

it('answers 501 for a target with no handler', async () => {
  const { route } = made();
  expect((await route(call('/deploys', 'right-token'))).status).toBe(501);
  expect((await route(call('/hooks', 'right-token'))).status).toBe(501);
});
