import { createHmac } from 'node:crypto';
import { beforeEach, expect, it } from 'vitest';
import { webhookAdapter } from '../src/adapter.js';
import { webhookRoute } from '../src/route.js';
import type { Adapter } from '../../sdk/src/types/connectors.js';
import type { Endpoint } from '../src/record.js';

/*
 * The URL checks Slack, Meta and Microsoft Graph make before they send a call.
 *
 * Each is answered by the route of the connector that named its scheme, and
 * none of them fires anything: a handshake is not a notification.
 */

const PREFIX = 'http://127.0.0.1:1/plugins/webhook';
const SECRET = 'endpoint-secret';
const NOW = 1_700_000_000_000;
const TS = String(Math.floor(NOW / 1000));

const hex = (key: string, data: string): string => createHmac('sha256', key).update(data).digest('hex');

let endpoints: Map<string, Endpoint>;
let adapter: Adapter;
let fired: Record<string, unknown>[];

beforeEach(() => {
  endpoints = new Map();
  adapter = webhookAdapter(endpoints);
  fired = [];
});

/** A connector opened as the host opens it. */
const opens = (id: string, config: Record<string, unknown> = {}): void => {
  adapter.open({ id, adapter: 'webhook', owner: 'user:alice', config: { secret: SECRET, ...config } });
};

/** The route over the connectors opened above. */
const makes = () => webhookRoute({
  endpoint: (id) => endpoints.get(id),
  fire: (data) => { fired.push(data); },
  now: () => NOW,
});

/** A request, with a body and its content type when it has one. */
const request = (path: string, method: string, body?: string, headers: Record<string, string> = {}): Request => new Request(`${PREFIX}/${path}`, {
  method,
  headers: { ...headers, ...(body === undefined ? {} : { 'content-type': headers['content-type'] ?? 'application/json' }) },
  ...(body === undefined ? {} : { body }),
});

it('answers a signed Slack url_verification with its challenge, and fires nothing', async () => {
  opens('slack', { auth: 'slack' });
  const body = JSON.stringify({ type: 'url_verification', challenge: 'challenge-123' });
  const answer = await makes()(request('slack', 'POST', body, {
    'x-slack-request-timestamp': TS,
    'x-slack-signature': `v0=${hex(SECRET, `v0:${TS}:${body}`)}`,
  }));
  expect(answer.status).toBe(200);
  expect(answer.headers.get('content-type')).toContain('text/plain');
  expect(await answer.text()).toBe('challenge-123');
  expect(fired).toEqual([]);
});

it('answers a Meta GET with the right verify token, and 403 with a wrong one', async () => {
  opens('meta', { auth: 'meta', verifyToken: 'verify-me' });
  const route = makes();
  const hub = (token: string): string => `meta?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=ch-1`;

  const good = await route(request(hub('verify-me'), 'GET'));
  expect(good.status).toBe(200);
  expect(await good.text()).toBe('ch-1');
  expect(good.headers.get('content-type')).toContain('text/plain');

  expect((await route(request(hub('wrong'), 'GET'))).status).toBe(403);
  expect(fired).toEqual([]);
});

it('answers a Graph validationToken as plain text within the call', async () => {
  opens('graph', { auth: 'graph' });
  const answer = await makes()(request('graph?validationToken=token-abc', 'POST'));
  expect(answer.status).toBe(200);
  expect(answer.headers.get('content-type')).toContain('text/plain');
  expect(await answer.text()).toBe('token-abc');
  expect(fired).toEqual([]);
});

it('answers 401 to a Graph notification with a wrong clientState, and takes the right one', async () => {
  opens('graph', { auth: 'graph' });
  const route = makes();
  const notification = (clientState: string): string => JSON.stringify({ value: [{ clientState, changeType: 'updated' }] });

  expect((await route(request('graph', 'POST', notification('nope')))).status).toBe(401);
  expect(fired).toEqual([]);

  expect((await route(request('graph', 'POST', notification(SECRET)))).status).toBe(202);
  expect(fired).toHaveLength(1);
  // The clientState is the connector's secret, so a run is shown each item without it.
  expect(fired[0]?.['body']).toEqual({ value: [{ changeType: 'updated' }] });
});

it('checks X-Hub-Signature-256 on a Meta POST', async () => {
  opens('meta', { auth: 'meta', verifyToken: 'verify-me' });
  const route = makes();
  const body = '{"object":"page"}';
  const signed = (signature: string) => request('meta', 'POST', body, { 'x-hub-signature-256': signature });

  expect((await route(signed(`sha256=${hex(SECRET, 'other')}`))).status).toBe(401);
  expect(fired).toEqual([]);
  expect((await route(signed(`sha256=${hex(SECRET, body)}`))).status).toBe(202);
  expect(fired).toHaveLength(1);
});

it('answers 405 to a GET on a connector of another scheme', async () => {
  opens('plain');
  expect((await makes()(request('plain', 'GET'))).status).toBe(405);
});
