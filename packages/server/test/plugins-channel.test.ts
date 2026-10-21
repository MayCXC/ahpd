/*
 * The plugins channel: what a client lists, and what a client changes.
 *
 * The plugins are the real fixtures loaded by the real loader, so a row's
 * manifest and its masked options are the ones a daemon would serve. The host
 * is in this process, over a real users file, and every change is read back
 * from the file on disk: the point of the channel is that it writes what
 * `ahpd plugin` writes.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, fileResources, fileUsers, servedRecords, type Users } from '@ahpd/sdk';
import { echo } from '../../../examples/echo/agent.js';
import { SET } from '../src/commands/config.js';
import { loadPlugins } from '../src/plugins.js';
import { pluginsChannel } from '../src/pluginschannel.js';

const URI = 'x-ahpd-plugins://';
const ROOT = 'ahp-root://';
const here = import.meta.dirname;
const fixtures = join(here, 'fixtures');

/** The package whose manifest is its package.json. */
const DECLARED = './fixtures/plugin-declared';
/** The file plugin whose `apiKey` is write-only. */
const SECRET = './fixtures/plugin-secret/index.ts';

type Bag = Record<string, any>;

let home: string;
let config: string;
let usersFile: string;
let had: string | undefined;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-plugins-channel-'));
  // The daemon's own config directory, so `running()` and `configDir()` read
  // this test's home and nothing of whoever runs the suite.
  had = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = home;
  mkdirSync(join(home, 'ahpd'), { recursive: true });
  config = join(home, 'ahpd', 'config.json');
  writeFileSync(config, JSON.stringify({
    plugins: [DECLARED, { name: SECRET, options: { apiKey: 'sk-live-1', region: 'eu' } }],
  }));
  usersFile = join(home, 'users.json');
  writeFileSync(usersFile, JSON.stringify({
    roles: { reader: ['config:read'], writer: ['config:read', 'config:write'] },
    users: [{ id: 'ana', roles: ['reader'] }, { id: 'bo', roles: [] }, { id: 'cy', roles: ['writer'] }],
  }));
});
afterEach(() => {
  if (had === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = had;
  rmSync(home, { recursive: true, force: true });
});

const wait = async (ms: number): Promise<void> => { await new Promise((done) => { setTimeout(done, ms); }); };

/** The configuration file as it stands. */
const held = (): { plugins: unknown[] } => JSON.parse(readFileSync(config, 'utf8')) as { plugins: unknown[] };

/** A host serving the plugins channel, over plugins loaded from the file. */
const served = async () => {
  const specs = held().plugins as Parameters<typeof loadPlugins>[0];
  const { loaded } = await loadPlugins(specs, {
    base: { path: home, agents: [echo({ path: home })] },
    configDir: fixtures,
    cwd: here,
    log: () => {},
  });
  const lists = pluginsChannel({ configFile: config, where: { configDir: fixtures, cwd: here }, loaded: () => loaded });
  const wire = servedRecords('ahpd', [lists.channel], lists.methods);
  const users = fileUsers({ path: usersFile });
  const host = createHost({
    path: home,
    agents: [{ ...echo({ path: home, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    channels: wire.channels,
    methods: wire.methods,
    users,
  });
  return { host, users, close: async () => { await host.close(); } };
};

type Host = Awaited<ReturnType<typeof served>>['host'];

/** A client signed in as `id`, whose channel actions are kept. */
const as = async (host: Host, users: Users, id: string) => {
  const token = await users.mint(id);
  const seen: { method: string; params: Bag }[] = [];
  const client = host.accept({
    send: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
    notify: (method, params) => { seen.push({ method, params: params as Bag }); },
  });
  await client.handle({ method: 'initialize', params: { clientId: id, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] } });
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: users.resource.resource, token } });
  const call = async (method: string, params: Bag) => client.handle({ method, params }).then(
    (result) => ({ result: result as Bag }),
    (error: { code: number; message: string }) => error as Bag,
  );
  /** Each action on `channel`, as `type id`. */
  const heard = (channel: string) => seen
    .filter((one) => one.method === 'action' && one.params.channel === channel)
    .map((one) => `${String(one.params.action.type).split('/').pop()} ${String(one.params.action.id)}`);
  /** Every row a subscribe answered, by id. */
  const rows = async (): Promise<Record<string, Bag>> => {
    const answer = await call('subscribe', { channel: URI });
    const records = answer.result.snapshot.state.records as { id: string; record: Bag }[];
    return Object.fromEntries(records.map((one) => [one.id, one.record]));
  };
  return { call, heard, rows, close: () => { client.close(); } };
};

it('lists two configured plugins, one with the manifest its package.json declares', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(Object.keys(rows)).toEqual(['declared', 'secret']);

  const declared = rows['declared'] as Bag;
  expect(declared['state']).toBe('ready');
  expect(declared['manifest']).toEqual({
    description: 'Declares its manifest in its package.json.',
    categories: ['tool'],
    links: [{ title: 'Docs', url: 'https://ahpd.dev/plugins' }],
    contracts: { agents: ['declared'] },
  });
  expect(declared['undeclared']).toBeUndefined();

  // The file plugin has no manifest at all, so it is listed and said to be
  // undeclared rather than left out.
  const secret = rows['secret'] as Bag;
  expect(secret['state']).toBe('ready');
  expect(secret['manifest']).toBeUndefined();
  expect(secret['undeclared']).toBe(true);
  await close();
});

it('turns a plugin off in the configuration file, and the row says so', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');
  const cy = await as(host, users, 'cy');
  await ana.rows();

  expect(await cy.call('x-ahpd/plugins/disable', { id: 'declared' })).toEqual({
    result: { id: 'declared', enabled: false, restart: true },
  });
  // The entry the command line writes: an object naming the spec, turned off.
  expect(held().plugins).toEqual([{ name: DECLARED, enabled: false }, { name: SECRET, options: { apiKey: 'sk-live-1', region: 'eu' } }]);

  await wait(50);
  expect(ana.heard(URI)).toEqual(['changed declared']);
  const rows = await ana.rows();
  expect((rows['declared'] as Bag)['state']).toBe('disabled');
  await close();
});

it('lists a write-only option as set, and any other option as the file holds it', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  const secret = rows['secret'] as Bag;
  expect(secret['spec']).toEqual({ name: SECRET, options: { apiKey: SET, region: 'eu' } });
  await close();
});

it('refuses a caller with no grant, to read and to change', async () => {
  const { host, users, close } = await served();
  const bo = await as(host, users, 'bo');

  expect(await bo.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  expect(await bo.call('x-ahpd/plugins/disable', { id: 'declared' })).toMatchObject({ code: -32009 });
  expect(held().plugins).toEqual([DECLARED, { name: SECRET, options: { apiKey: 'sk-live-1', region: 'eu' } }]);
  await close();
});

it('writes one option through the channel, and refuses a value the schema refuses', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');
  const cy = await as(host, users, 'cy');
  await ana.rows();

  expect(await cy.call('x-ahpd/plugins/options', { id: 'secret', key: 'region', value: 'us' })).toEqual({
    result: { id: 'secret', key: 'region', value: 'us', restart: true },
  });
  expect(held().plugins).toEqual([DECLARED, { name: SECRET, options: { apiKey: 'sk-live-1', region: 'us' } }]);

  // `retries` is an integer of at least zero, and nothing is written.
  expect(await cy.call('x-ahpd/plugins/options', { id: 'secret', key: 'retries', value: -1 })).toMatchObject({ code: -32602 });
  expect(held().plugins).toEqual([DECLARED, { name: SECRET, options: { apiKey: 'sk-live-1', region: 'us' } }]);

  await wait(50);
  expect(ana.heard(URI)).toEqual(['changed secret']);
  expect(((await ana.rows())['secret'] as Bag)['spec']).toEqual({ name: SECRET, options: { apiKey: SET, region: 'us' } });
  await close();
});

it('lists a spec that does not resolve with the userinfo of its URL masked, in its id as well', async () => {
  const { host, users, close } = await served();
  writeFileSync(config, JSON.stringify({ plugins: ['https://bob:sk-live-2@example.invalid/p.tgz'] }));
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(Object.keys(rows)).toEqual([`https://${SET}@example.invalid/p.tgz`]);
  expect(JSON.stringify(rows)).not.toContain('sk-live-2');
  await close();
});
