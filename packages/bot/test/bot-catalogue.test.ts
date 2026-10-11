import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, ROOT } from '../../sdk/src/host.js';
import { foldHostOptions, pluginHost } from '../../sdk/src/plugins.js';
import { fileResources } from '../../sdk/src/resources.js';
import { memorySessions } from '../../sdk/src/sessions.js';
import { sdkVersion } from '../../sdk/src/version.js';
import { holds } from '../../sdk/src/users.js';
import { echo } from '../../../examples/echo/agent.js';
import { apply } from '../src/plugin.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';
import type { Peer } from '../../sdk/src/types/rpc.js';
import type { Grant, Principal, Users } from '../../sdk/src/types/users.js';

/*
 * The `x-ahpd-bots://` catalogue the bot plugin serves.
 *
 * Two people and a team. Each subscribes, and each case asks what each was
 * sent: a snapshot of the bots they may read, then `added`, `changed` and
 * `removed` as bots are made, edited and deleted, and as memberships change.
 */

const CATALOGUE = 'x-ahpd-bots://';

/** A frame as the test reads it, any key at any depth. */
type Bag = Record<string, any>;

let loose: string[] = [];
beforeEach(() => { loose = []; });
afterEach(() => {
  for (const dir of loose) rmSync(dir, { recursive: true, force: true });
  loose = [];
});

const RECORD = {
  resource: 'ahpd://users',
  resource_name: 'ahpd users',
  authorization_servers: ['https://example.test/users'],
  required: false,
};

/**
 * Every grant a person here holds: a bot of their own, and its session.
 *
 * Not `bot:read`, whose `bot:get` reads every bot: a person here subscribes
 * through the channel's `authorize`, as the owner of a bot.
 */
const PERSON: Grant[] = ['bot:write', 'session:create'];

/**
 * A directory whose tokens are decided by hand, and whose memberships a case
 * changes in place. `changed()` is what the users file's watch would say.
 */
const directory = (tokens: Record<string, Grant[]>, members: Record<string, string[]>) => {
  let heard: (() => void) | undefined;
  const users: Users = {
    resource: RECORD,
    verify: async (token) => {
      const held = tokens[token];
      if (held === undefined) return undefined;
      const person: Principal = {
        id: token,
        roles: ['r'],
        can: (one) => holds(new Set<string>(held), one),
        get memberships() { return members[token] ?? []; },
      };
      return person;
    },
    watch: (onChange) => {
      heard = onChange;
      return { close: () => { heard = undefined; } };
    },
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
  };
  return { users, changed: () => { heard?.(); } };
};

/** A host with the bot plugin on it, folded in the way the loader folds it. */
function made(tokens: Record<string, Grant[]>, members: Record<string, string[]> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ahpd-bot-catalogue-'));
  loose.push(root);
  const context: LoaderContext = {
    path: root, paths: [root], version: sdkVersion(), hostName: 'test', configDir: join(root, 'config'), log: () => {}, say: () => {},
  };
  const sessions = memorySessions();
  const { host: plugin, contribution } = pluginHost('bot', context, { sessions: () => sessions });
  apply(plugin, { root: join(root, 'bots') });
  const { users, changed } = directory(tokens, members);
  const { options, problems } = foldHostOptions({
    path: root,
    agents: [{ ...echo({ path: root, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    sessions,
    users,
  }, [contribution]);
  expect(problems).toEqual([]);
  return { host: createHost(options), changed, users };
}

type Host = ReturnType<typeof createHost>;

/** What a client was sent on the catalogue, as `type id` lines. */
interface Reader {
  client: ReturnType<Host['accept']>;
  ready: Bag;
  /** Each catalogue action, as `added motion`, `changed motion` or `removed motion`. */
  heard(): string[];
}

/** A client signed in as `token`, under the client id `id`, whose catalogue actions are kept. */
async function as(host: Host, token: string, id = token): Promise<Reader> {
  const seen: { method: string; params: Bag }[] = [];
  const peer: Peer = {
    send: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
    notify: (method, params) => { seen.push({ method, params: params as Bag }); },
  };
  const client = host.accept(peer);
  const ready = await client.handle({
    method: 'initialize',
    params: { clientId: id, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  }) as Bag;
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: RECORD.resource, token } });
  const heard = () => seen
    .filter((one) => one.method === 'action' && one.params.channel === CATALOGUE)
    .map((one) => {
      const action = one.params.action as Bag;
      return `${String(action.type).slice('x-ahpd-bots/'.length)} ${String(action.bot?.id ?? action.id)}`;
    });
  return { client, ready, heard };
}

const call = async (reader: Reader, method: string, params: Bag) => reader.client.handle({ method, params }).then(
  (result) => ({ result: result as Bag }),
  (error: { code: number; message: string }) => error,
);

/** The bots a subscribe answered, by id. */
const subscribe = async (reader: Reader): Promise<string[]> => {
  const answer = await call(reader, 'subscribe', { channel: CATALOGUE });
  if (!('result' in answer)) throw new Error(`refused: ${answer.code} ${answer.message}`);
  return (answer.result.snapshot.state.bots as Bag[]).map((one) => String(one.id));
};

const write = async (reader: Reader, slug: string, body: Bag): Promise<void> => {
  const answer = await call(reader, 'resourceWrite', { uri: `bot://${slug}`, data: JSON.stringify(body) });
  if (!('result' in answer)) throw new Error(`refused: ${answer.code} ${answer.message}`);
};

it('answers each reader the bots it may read, each as a read of it answers', async () => {
  const { host } = made({ ana: PERSON, bo: PERSON }, { ana: ['crew'], bo: [] });
  const ana = await as(host, 'ana');
  const bo = await as(host, 'bo');
  await write(ana, 'mine', { name: 'Mine' });
  await write(ana, 'crews', { name: 'Crews', owner: 'team:crew' });
  await write(bo, 'his', { name: 'His' });

  expect(await subscribe(ana)).toEqual(['crews', 'mine']);
  expect(await subscribe(bo)).toEqual(['his']);

  const answer = await call(ana, 'subscribe', { channel: CATALOGUE });
  const read = await call(ana, 'resourceRead', { uri: 'bot://mine' });
  if (!('result' in answer) || !('result' in read)) throw new Error('refused');
  const record = (answer.result.snapshot.state.bots as Bag[]).find((one) => one.id === 'mine');
  expect(record).toEqual(JSON.parse(String(read.result.data)));
});

it('sends a make, an edit and a delete to the readers each concerns', async () => {
  const members: Record<string, string[]> = { ana: ['crew'], bo: [] };
  const { host } = made({ ana: PERSON, bo: PERSON }, members);
  const ana = await as(host, 'ana');
  const bo = await as(host, 'bo');
  await write(ana, 'hers', { name: 'Hers' });
  await write(bo, 'his', { name: 'His' });
  await subscribe(ana);
  await subscribe(bo);

  await write(ana, 'motion', { name: 'Motion', owner: 'team:crew' });
  await write(ana, 'motion', { name: 'Motion two' });
  // bo joins the team, and the edit comes before the users file says so:
  // the bot is new to him.
  members.bo = ['crew'];
  await write(ana, 'motion', { name: 'Motion three' });
  await write(ana, 'motion', { name: 'Motion four' });
  // He leaves it: the bot is gone for him.
  members.bo = [];
  await write(ana, 'motion', { name: 'Motion five' });
  await write(ana, 'hers', { name: 'Hers two' });
  members.bo = ['crew'];
  await write(ana, 'motion', { name: 'Motion six' });
  expect(await call(ana, 'resourceDelete', { uri: 'bot://motion' })).toHaveProperty('result');

  expect(ana.heard()).toEqual([
    'added motion', 'changed motion', 'changed motion', 'changed motion', 'changed motion', 'changed hers', 'changed motion', 'removed motion',
  ]);
  expect(bo.heard()).toEqual(['added motion', 'changed motion', 'removed motion', 'added motion', 'removed motion']);
});

it('sends the bots a membership change gives and takes, to that reader alone', async () => {
  const members: Record<string, string[]> = { ana: ['crew'], bo: [] };
  const { host, changed } = made({ ana: PERSON, bo: PERSON }, members);
  const ana = await as(host, 'ana');
  const bo = await as(host, 'bo');
  await write(ana, 'crews', { name: 'Crews', owner: 'team:crew' });
  await write(bo, 'his', { name: 'His' });
  await subscribe(ana);
  expect(await subscribe(bo)).toEqual(['his']);

  members.bo = ['crew'];
  changed();
  await new Promise((resolve) => { setTimeout(resolve, 20); });
  // A second word about the same change finds nothing more to send.
  changed();
  await new Promise((resolve) => { setTimeout(resolve, 20); });
  members.bo = [];
  changed();
  await new Promise((resolve) => { setTimeout(resolve, 20); });

  expect(bo.heard()).toEqual(['added crews', 'removed crews']);
  expect(ana.heard()).toEqual([]);
});

it('sends a membership change only to the person it concerns on a shared client id', async () => {
  const members: Record<string, string[]> = { ana: ['crew'], bo: [] };
  const { host, changed } = made({ ana: PERSON, bo: PERSON }, members);
  const ana = await as(host, 'ana', 'anonymous');
  const bo = await as(host, 'bo', 'anonymous');
  await write(ana, 'crews', { name: 'Crews', owner: 'team:crew' });
  await write(bo, 'his', { name: 'His' });
  await write(ana, 'hers', { name: 'Hers' });
  expect(await subscribe(bo)).toEqual(['his']);
  expect(await subscribe(ana)).toEqual(['crews', 'hers']);

  // Ana leaves the team: only she is sent the removal, and Bo's set stays his.
  members.ana = [];
  changed();
  await new Promise((resolve) => { setTimeout(resolve, 20); });
  members.bo = ['crew'];
  changed();
  await new Promise((resolve) => { setTimeout(resolve, 20); });

  expect(ana.heard()).toEqual(['removed crews']);
  expect(bo.heard()).toEqual(['added crews']);
});

it('replays to a reader only what it may read', async () => {
  const { host, users } = made({ ana: PERSON, bo: PERSON }, { ana: [], bo: [] });
  const ana = await as(host, 'ana');
  const bo = await as(host, 'bo');
  await write(bo, 'his', { name: 'His' });
  await write(bo, 'old', { name: 'Old' });
  const answer = await call(bo, 'subscribe', { channel: CATALOGUE });
  if (!('result' in answer)) throw new Error('refused');
  const from = answer.result.snapshot.fromSeq as number;
  bo.client.close();

  await write(ana, 'hers', { name: 'Hers' });
  await write(ana, 'hers', { name: 'Hers again' });
  const desk = await as(host, 'bo', 'bo-desk');
  await write(desk, 'new', { name: 'New' });
  await write(desk, 'his', { name: 'His again' });
  expect(await call(desk, 'resourceDelete', { uri: 'bot://old' })).toHaveProperty('result');

  // Back on a socket that resolved to bo, the way a personal token admits one.
  const person = await users.verify('bo');
  const back = host.accept({ send: () => {}, notify: () => {}, request: async () => ({}), answered: () => {}, close: () => {} }, person);
  const replay = await back.handle({
    method: 'reconnect',
    params: { clientId: 'bo', lastSeenServerSeq: from, subscriptions: [CATALOGUE] },
  }) as Bag;
  expect(replay.type).toBe('replay');
  const seen = (replay.actions as Bag[])
    .filter((one) => one.channel === CATALOGUE)
    .map((one) => `${String(one.action.type)} ${String(one.action.bot?.id ?? one.action.id)}`);
  expect(seen).toEqual(['x-ahpd-bots/added new', 'x-ahpd-bots/changed his', 'x-ahpd-bots/removed old']);
});

it('lets in a reader with no bot:read who may read a bot, and refuses one who may read none', async () => {
  const { host } = made({ ana: PERSON, bo: PERSON }, {});
  const ana = await as(host, 'ana');
  const bo = await as(host, 'bo');
  await write(ana, 'mine', { name: 'Mine' });
  expect(await subscribe(ana)).toEqual(['mine']);
  expect(await call(bo, 'subscribe', { channel: CATALOGUE })).toMatchObject({ code: -32009 });
});

it('advertises the catalogue on initialize', async () => {
  const { host } = made({ ana: PERSON });
  const ana = await as(host, 'ana');
  expect(ana.ready._meta?.['ahpd.channels']).toEqual([
    { scheme: 'x-ahpd-bots', title: 'Bots', description: 'Every bot the reader may read, kept current.', grant: 'bot:read' },
  ]);
});
