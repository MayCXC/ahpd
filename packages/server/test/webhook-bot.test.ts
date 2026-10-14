import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createHost, ROOT } from '../../sdk/src/host.js';
import { raise } from '../../sdk/src/plugins.js';
import { memoryRecords } from '../../sdk/src/records.js';
import { memorySessions } from '../../sdk/src/sessions.js';
import { loadPlugins } from '../src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import type { Bag } from '../../sdk/src/types/common.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { Peer } from '../../sdk/src/types/rpc.js';
import type { Users } from '../../sdk/src/types/users.js';
import type { Vault } from '../../sdk/src/types/vault.js';

/*
 * A webhook call that talks to a bot, on a daemon with both plugins loaded.
 *
 * The daemon has a users directory, so the webhook plugin's connection is
 * answered against the grants its entry names, and nothing else. A root client
 * makes the bot, which starts its session. A `sync` call then waits for the
 * echo backend's answer and gets the turn's text back.
 */

const REPO = join(import.meta.dirname, '../../..');
const BOT = './packages/bot/src/index.ts';
const WEBHOOK = './packages/webhook/src/index.ts';

/** The grants the webhook plugin needs to read a bot, make a chat and send a turn. */
const GRANTS = ['bot:get', 'session:read', 'session:write'];

let loose: string[] = [];
afterEach(() => {
  for (const dir of loose) rmSync(dir, { recursive: true, force: true });
  loose = [];
});

const RECORD = { resource: 'ahpd://users', resource_name: 'ahpd users', authorization_servers: ['https://example.test'], required: false };

/** A directory that knows nobody: having one is what turns the gate on. */
const directory = (): Users => ({
  resource: RECORD,
  verify: async () => undefined,
  list: async () => [],
  grantsOfRoles: async () => [],
  grantsOfPerson: async () => undefined,
  add: async () => {},
  roles: async () => [],
  addRole: async () => {},
  removeRole: async () => false,
  teams: async () => [],
  projects: async () => [],
  addTeam: async () => {},
  addProject: async () => {},
  removeTeam: async () => false,
  removeProject: async () => false,
  remove: async () => false,
  mint: async () => '',
});

/** A vault in memory. */
const vault = (held: Record<string, string>): Vault => ({
  get: async (name) => held[name],
  set: async (name, value) => { held[name] = value; },
  delete: async (name) => delete held[name],
  list: async () => Object.keys(held).sort(),
});

const peer = (): Peer => ({
  send: () => {}, notify: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
});

/** Yield between looks until `done` says so. */
const until = async (done: () => Promise<boolean>, what: string, tries = 600): Promise<void> => {
  for (let i = 0; i < tries; i++) {
    if (await done()) return;
    await new Promise((r) => { setTimeout(r, 5); });
  }
  throw new Error(`${what} never happened`);
};

/** A daemon with the bot and webhook plugins on it, up to the moment the socket is bound. */
async function started(grants: string[] = GRANTS) {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-webhook-'));
  loose.push(dir);
  const lines: string[] = [];
  const records = memoryRecords();
  const base: HostOptions = {
    path: dir,
    agents: [echo({ path: dir, pace: 0 })],
    sessions: memorySessions(),
    records,
    vault: vault({ 'host:ci-hook': 'right-token' }),
    users: directory(),
  };
  const { options, problems, routes } = await loadPlugins([
    { name: BOT, options: { root: join(dir, 'bots') } },
    { name: WEBHOOK, grants },
  ], { base, configDir: join(dir, 'config'), cwd: REPO, log: (line) => { lines.push(line); } });
  const host = createHost(options);
  for (const one of options.pluginConnects ?? []) one.host = host;
  await raise(
    options.events,
    { type: 'listening', runtime: 'node', host: '127.0.0.1', port: 0, guarded: false },
    (line) => { lines.push(line); },
  );
  return { host, lines, problems, routes, records };
}

it('answers a sync call with the text of the bot turn', async () => {
  const { host, problems, routes, records } = await started();
  expect(problems).toEqual([]);

  // The host's own key makes the bot, which starts its session.
  const root = host.accept(peer(), undefined, true);
  await root.handle({ method: 'initialize', params: { clientId: 'root', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] } });
  await root.handle({ method: 'resourceWrite', params: { uri: 'bot://motion', data: JSON.stringify({ name: 'Motion', harness: 'echo' }) } });
  const read = async (): Promise<Bag> => {
    const answer = await root.handle({ method: 'resourceRead', params: { uri: 'bot://motion' } }) as Bag;
    return JSON.parse(String(answer['data'])) as Bag;
  };
  await until(async () => typeof (await read())['session'] === 'string', 'the bot session to start');

  const webhooks = await records.collection('webhooks');
  await webhooks.put({ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'sync', syncTimeoutSeconds: 10 });

  const route = routes['@ahpd/webhook'];
  expect(route).toBeDefined();
  const call = (text: string) => route!(new Request('http://127.0.0.1:1/plugins/%40ahpd/webhook/ci', {
    method: 'POST',
    headers: { authorization: 'Bearer right-token', 'content-type': 'application/json' },
    body: JSON.stringify({ thread: 'pr-12', text }),
  }));

  const first = await call('hello there');
  const said = await first.json() as Bag;
  expect({ status: first.status, said }).toMatchObject({ status: 200, said: { thread: 'pr-12', status: 'complete' } });
  expect(String(said['text'])).toContain('hello there');

  const second = await call('once more');
  expect(second.status).toBe(200);
  expect(String((await second.json() as Bag)['text'])).toContain('once more');

  // One thread, one chat: the second call went to the chat the first one made.
  const threads = await (await records.collection('webhook-threads')).list();
  expect(threads).toHaveLength(1);
  expect(threads[0]).toMatchObject({ endpoint: 'ci', thread: 'pr-12' });
});

it('answers 409 when the plugin may not read the bot', async () => {
  const { host, routes, records } = await started([]);
  const root = host.accept(peer(), undefined, true);
  await root.handle({ method: 'initialize', params: { clientId: 'root', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] } });
  await root.handle({ method: 'resourceWrite', params: { uri: 'bot://motion', data: JSON.stringify({ name: 'Motion', harness: 'echo' }) } });
  const webhooks = await records.collection('webhooks');
  await webhooks.put({ id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'none' });

  const answer = await routes['@ahpd/webhook']!(new Request('http://127.0.0.1:1/plugins/%40ahpd/webhook/ci?thread=pr-12', {
    method: 'POST',
    headers: { authorization: 'Bearer right-token' },
    body: 'hello',
  }));
  expect(answer.status).toBe(409);
});
