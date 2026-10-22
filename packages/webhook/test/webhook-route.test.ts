import { expect, it } from 'vitest';
import { webhookRoute } from '../src/route.js';
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
  ci: { id: 'ci', bot: 'bot://motion', secret: 'right-token', reply: 'callback' },
  deploys: { id: 'deploys', automation: true, secret: 'right-token', reply: 'callback' },
};

/** A route over those endpoints, with the endpoints each target was given. */
function made(targets: Partial<Pick<WebhookSeams, 'bot' | 'automation'>> = {}) {
  const reached: Endpoint[] = [];
  const route = webhookRoute({
    endpoint: (id) => ENDPOINTS[id],
    bot: async (endpoint) => {
      reached.push(endpoint);
      return new Response('reached', { status: 200 });
    },
    ...targets,
  });
  return { route, reached };
}

/** One call to the route, with a bearer when one is given. */
const call = (path: string, bearer?: string, method = 'POST'): Request => new Request(`${PREFIX}${path}`, {
  method,
  headers: bearer === undefined ? {} : { authorization: `Bearer ${bearer}` },
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

it('passes a call with the right bearer to the target with the endpoint', async () => {
  const { route, reached } = await made();
  const answer = await route(call('/ci', 'right-token'));
  expect(answer.status).toBe(200);
  expect(await answer.text()).toBe('reached');
  expect(reached).toEqual([{ id: 'ci', bot: 'bot://motion', secret: 'right-token', reply: 'callback' }]);
});

it('answers 501 for a target with no handler', async () => {
  const { route } = await made();
  expect((await route(call('/deploys', 'right-token'))).status).toBe(501);
});
