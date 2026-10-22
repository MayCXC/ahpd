/*
 * The plugins channel: what a client lists, and what a client changes.
 *
 * The plugins are the real fixtures loaded by the real loader, so a row's
 * manifest and its masked options are the ones a daemon would serve. The host
 * is in this process, over a real users file, and every change is read back
 * from the file on disk: the point of the channel is that it writes what
 * `ahpd plugin` writes.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, fileResources, fileUsers, servedRecords, type Users } from '@ahpd/sdk';
import { echo } from '../../../examples/echo/agent.js';
import { SET } from '../src/commands/config.js';
import type { Options } from '../src/commands/options.js';
import { apiOrigins } from '../src/commands/run.js';
import { servedRegistry, type ServedFacts } from '../src/commands/served.js';
import { apiHandler } from '../src/http.js';
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
/** The plugin whose `apply` throws, quoting its write-only option. */
const THROWS = './fixtures/plugin-throws-secret/index.ts';
/** The plugin whose module leaves a file behind when it is imported. */
const MARKER_OFF = './fixtures/plugin-marker-off';

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
    roles: {
      reader: ['plugin:read'],
      writer: ['plugin:read', 'plugin:write'],
      enabler: ['plugin:enable'],
      'config-reader': ['config:read'],
      'config-writer': ['config:write'],
    },
    users: [
      { id: 'ana', roles: ['reader'] },
      { id: 'bo', roles: [] },
      { id: 'cy', roles: ['writer'] },
      { id: 'fa', roles: ['config-reader'] },
      { id: 'gi', roles: ['config-writer'] },
      { id: 'ha', roles: ['enabler'] },
    ],
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
const served = async ({ load = true } = {}) => {
  let loaded: Awaited<ReturnType<typeof loadPlugins>>['loaded'] = [];
  let failures: Record<string, string> = {};
  if (load) {
    const specs = held().plugins as Parameters<typeof loadPlugins>[0];
    ({ loaded, failures } = await loadPlugins(specs, {
      base: { path: home, agents: [echo({ path: home })] },
      configDir: fixtures,
      cwd: here,
      log: () => {},
    }));
  }
  let markRestart: () => void = () => {};
  const lists = pluginsChannel({
    configFile: config,
    where: { configDir: fixtures, cwd: here },
    loaded: () => loaded,
    failures: () => failures,
    restartNeeded: () => markRestart(),
  });
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
  markRestart = () => { host.markRestartNeeded(); };
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
  /** The root state this client reads now. */
  const root = async (): Promise<Bag> => {
    const answer = await call('subscribe', { channel: ROOT });
    return (answer.result as Bag)['snapshot'].state as Bag;
  };
  return { call, heard, rows, root, close: () => { client.close(); } };
};

/** The authority the served handler is asked at; nothing listens on it. */
const AUTHORITY = '127.0.0.1:9350';

/** The HTTP API over this test's configuration file, signing people in from `users`. */
const servedHttp = (users: Users) => {
  const facts: ServedFacts = {
    options: {} as Options,
    configFile: config,
    users,
    running: () => ({ pid: process.pid, url: `ws://${AUTHORITY}`, host: '127.0.0.1', port: 9350, paths: [], startedAt: '' }),
    turning: () => [],
    restart: () => {},
  };
  const handler = apiHandler({
    registry: servedRegistry(facts),
    token: 'root-secret',
    users,
    program: { name: 'ahpd', version: '0.0.0' },
    origins: () => apiOrigins('127.0.0.1', undefined, 9350),
  });
  /** One POST, answered as the response it drew. */
  return (path: string, token: string | undefined, body: unknown): Promise<Response> => handler(new Request(
    `http://${AUTHORITY}/api${path}`,
    {
      method: 'POST',
      headers: {
        host: AUTHORITY,
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    },
  ));
};

it('lists two configured plugins, one with the manifest its package.json declares', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(Object.keys(rows)).toEqual(['declared', 'secret']);

  const declared = rows['declared'] as Bag;
  expect(declared['state']).toBe('ready');
  expect(declared['version']).toBe('1.0.0');
  expect(declared['loaded']).toBe(true);
  expect(declared['loadProblem']).toBeUndefined();
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
  expect(secret['loaded']).toBe(true);
  expect(secret['optionsSchema']).toEqual({
    type: 'object',
    properties: {
      apiKey: { type: 'string', writeOnly: true },
      region: { type: 'string' },
      retries: { type: 'integer', minimum: 0 },
    },
  });
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

it('reads with plugin:read, and refuses a role holding only config:read', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');
  expect(Object.keys(await ana.rows())).toEqual(['declared', 'secret']);

  // `config:read` used to read this channel, and no longer does.
  const fa = await as(host, users, 'fa');
  expect(await fa.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  await close();
});

it('enables with plugin:enable over the protocol and over HTTP, and refuses config:write alone', async () => {
  const { host, users, close } = await served();
  const ha = await as(host, users, 'ha');

  // `plugin:enable` lets one in, and is not `plugin:disable`.
  expect(await ha.call('x-ahpd/plugins/disable', { id: 'declared' })).toMatchObject({ code: -32009 });
  expect(await ha.call('x-ahpd/plugins/enable', { id: 'declared' })).toEqual({
    result: { id: 'declared', enabled: true, restart: true },
  });

  const gi = await as(host, users, 'gi');
  expect(await gi.call('x-ahpd/plugins/enable', { id: 'declared' })).toMatchObject({ code: -32009 });

  // The same command, the same grant, over HTTP.
  const ask = servedHttp(users);
  const refused = await ask('/plugin/enable', await users.mint('gi'), { name: DECLARED });
  expect(refused.status).toBe(403);
  expect((await refused.json() as { message: string }).message).toBe('gi may not plugin:enable here');

  const answered = await ask('/plugin/enable', await users.mint('ha'), { name: DECLARED });
  expect(answered.status).toBe(200);
  await close();
});

it('refuses an install to a role holding plugin:write, which the deployment token keeps', async () => {
  const { users, close } = await served();
  const ask = servedHttp(users);
  const refused = await ask('/plugin/install', await users.mint('cy'), { name: [DECLARED] });
  expect(refused.status).toBe(403);
  expect((await refused.json() as { message: string }).message).toContain('only the deployment token may');
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

it('serves the problem a plugin that failed to load left, with its URL userinfo masked', async () => {
  writeFileSync(config, JSON.stringify({ plugins: ['https://bob:sk-live-2@example.invalid/p.tgz'] }));
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const row = (await ana.rows())[`https://${SET}@example.invalid/p.tgz`] as Bag;
  expect(row['loaded']).toBe(false);
  expect(row['loadProblem']).toContain(`https://${SET}@example.invalid/p.tgz`);
  expect(JSON.stringify(row)).not.toContain('sk-live-2');
  await close();
});

it('serves a plugin whose apply throws as not loaded, and its problem without the write-only value', async () => {
  writeFileSync(config, JSON.stringify({
    plugins: [{ name: THROWS, options: { apiKey: 'sk-live-3', region: 'eu' } }],
  }));
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const row = (await ana.rows())['throws-secret'] as Bag;
  expect(row['loaded']).toBe(false);
  // The error names what the plugin was handed, so the non-secret option is
  // still there and the credential is not.
  expect(row['loadProblem']).toContain('the secret fixture threw');
  expect(row['loadProblem']).toContain('in eu');
  expect(row['loadProblem']).not.toContain('sk-live-3');
  expect(JSON.stringify(row)).not.toContain('sk-live-3');
  await close();
});

it('lists a switched-off plugin as not loaded, with no schema, and imports nothing', async () => {
  const marker = join(home, 'imported');
  const had = process.env['AHPD_MARKER'];
  process.env['AHPD_MARKER'] = marker;
  try {
    writeFileSync(config, JSON.stringify({
      plugins: [{ name: MARKER_OFF, options: { level: 1 }, enabled: false }],
    }));
    // Nothing loaded, because loading is what imports a switched-off plugin to
    // read its id; the listing alone must not.
    const { host, users, close } = await served({ load: false });
    const ana = await as(host, users, 'ana');

    const row = (await ana.rows())['marker-off'] as Bag;
    expect(row['state']).toBe('disabled');
    expect(row['loaded']).toBe(false);
    expect(row['loadProblem']).toBeUndefined();
    expect(row['optionsSchema']).toBeUndefined();
    expect(existsSync(marker)).toBe(false);
    await close();
  }
  finally {
    if (had === undefined) delete process.env['AHPD_MARKER']; else process.env['AHPD_MARKER'] = had;
  }
});

it('marks a restart on the root every client reads, and a new host over the same file starts without it', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');
  const cy = await as(host, users, 'cy');
  await ana.rows();
  expect(((await cy.root())['_meta'] as Bag | undefined)?.['ahpd.restartNeeded']).toBeUndefined();

  expect(await cy.call('x-ahpd/plugins/enable', { id: 'declared' })).toEqual({
    result: { id: 'declared', enabled: true, restart: true },
  });
  // Ana sent nothing: the mark is the host's, not the calling client's.
  expect((((await ana.root())['_meta'] ?? {}) as Bag)['ahpd.restartNeeded']).toBe(true);

  // The mark lives only in memory, so the daemon that reads the file next
  // starts without it.
  const again = await served();
  const bo = await as(again.host, again.users, 'bo');
  expect((((await bo.root())['_meta'] ?? {}) as Bag)['ahpd.restartNeeded']).toBeUndefined();
  await again.close();
  await close();
});

it('does not mark a restart for a refused command', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');
  const cy = await as(host, users, 'cy');
  await ana.rows();

  // `retries` is an integer of at least zero, so this is refused before the
  // file is written, and a refusal is not a change a restart would apply.
  expect(await cy.call('x-ahpd/plugins/options', { id: 'secret', key: 'retries', value: -1 }))
    .toMatchObject({ code: -32602 });
  expect((((await ana.root())['_meta'] ?? {}) as Bag)['ahpd.restartNeeded']).toBeUndefined();
  await close();
});
