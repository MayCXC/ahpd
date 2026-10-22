import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { pluginHost } from '../../sdk/src/plugins/plugins.js';
import { memoryRecords } from '../../sdk/src/resources/records.js';
import { apply } from '../src/plugin.js';
import type { Connector } from '../../sdk/src/types/connectors.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';

/*
 * The `webhook` connector kind, over the route the plugin answers.
 *
 * A connector is opened the way the host opens one, and the route is called as
 * the daemon's listener calls it: what is checked is which URL answers, what a
 * removed connector answers, and that an old `webhooks` record answers nothing.
 */

const PREFIX = 'http://127.0.0.1:1/plugins/webhook';

let loose: string[] = [];
afterEach(() => {
  for (const dir of loose) rmSync(dir, { recursive: true, force: true });
  loose = [];
});

/** A plugin context over one directory. */
const context = (dir: string): LoaderContext => ({
  path: dir,
  paths: [dir],
  version: '0.0.0',
  hostName: 'host',
  configDir: dir,
  log: () => {},
  say: () => {},
});

/** A connector of the `webhook` kind, whose config is the form a person filled in. */
const made = (id: string, config: Record<string, unknown>): Connector => ({ id, kind: 'webhook', owner: 'host', config });

/** One call to the route, with a bearer. */
const call = (path: string, bearer: string): Request => new Request(`${PREFIX}${path}`, {
  method: 'POST',
  headers: { authorization: `Bearer ${bearer}` },
  body: '{}',
});

/** The plugin applied, with the kind it registered and the route it serves. */
async function started() {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-webhook-kind-'));
  loose.push(dir);
  const records = memoryRecords();
  const collections = new Map<string, string>();
  const { host, contribution } = pluginHost('webhook', context(dir), {
    contracts: {
      routes: ['post /plugins/webhook/:endpoint'],
      triggerTypes: ['webhook'],
      connectors: ['webhook'],
    },
    records: () => records,
    collections,
  });
  apply(host, {});
  const kind = contribution.connectors['webhook'];
  const route = contribution.routes;
  if (kind === undefined || route === undefined) throw new Error('the plugin registered no kind or no route');
  return { kind, route, records, collections };
}

it('marks the secret writeOnly, so the host keeps it in the vault and not in the record', async () => {
  const { kind } = await started();
  const properties = kind.schema['properties'] as Record<string, Record<string, unknown>>;
  expect(properties['secret']?.['writeOnly']).toBe(true);
  expect(kind.capabilities.map((one) => [one.type, one.title])).toEqual([['receive', 'Receives calls']]);
});

it('answers two connectors at their own URLs, and answers 404 once one is removed', async () => {
  const { kind, route } = await started();
  const stopCi = kind.open(made('ci', { automation: true, secret: 'ci-token' }));
  kind.open(made('deploys', { automation: true, secret: 'deploys-token' }));

  const ci = await route(call('/ci', 'ci-token'));
  expect(ci.status).toBe(202);
  expect(await ci.json()).toEqual({ endpoint: 'ci' });
  const deploys = await route(call('/deploys', 'deploys-token'));
  expect(deploys.status).toBe(202);
  expect(await deploys.json()).toEqual({ endpoint: 'deploys' });

  if (typeof stopCi !== 'function') throw new Error('open answered no close');
  await stopCi();
  expect((await route(call('/ci', 'ci-token'))).status).toBe(404);
  expect((await route(call('/deploys', 'deploys-token'))).status).toBe(202);
});

it('refuses a call with the wrong bearer, and keeps the endpoint open', async () => {
  const { kind, route } = await started();
  kind.open(made('ci', { bot: 'bot://motion', secret: 'ci-token' }));
  expect((await route(call('/ci', 'not-ci-token'))).status).toBe(401);
  expect((await route(call('/ci', 'ci-token-and-more'))).status).toBe(401);
});

it('makes no endpoint of a webhooks record left behind', async () => {
  const { kind, route, records, collections } = await started();
  // What a hand-written `webhooks/ci.md` used to be read as: the host opens no
  // collection of that name any more, so the record reaches no route.
  const webhooks = await records.collection('webhooks');
  await webhooks.put({ id: 'ci', automation: true, secret: 'ci-token' });
  kind.open(made('live', { automation: true, secret: 'live-token' }));

  expect((await route(call('/ci', 'ci-token'))).status).toBe(404);
  expect((await route(call('/live', 'live-token'))).status).toBe(202);
  expect([...collections.keys()]).toEqual(['webhook-threads']);
});

it('refuses a config that names both a bot and an automation', async () => {
  const { kind } = await started();
  expect(() => kind.open(made('both', { bot: 'bot://motion', automation: true, secret: 'x' }))).toThrow('both');
});
