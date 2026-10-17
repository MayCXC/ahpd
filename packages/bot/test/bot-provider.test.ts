import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, ROOT } from '../../sdk/src/host.js';
import { foldHostOptions, pluginHost } from '../../sdk/src/plugins.js';
import { memoryRecords } from '../../sdk/src/records.js';
import { fileResources } from '../../sdk/src/resources.js';
import { memorySessions } from '../../sdk/src/sessions.js';
import { sdkVersion } from '../../sdk/src/version.js';
import { holds } from '../../sdk/src/users.js';
import { echo } from '../../../examples/echo/agent.js';
import { apply } from '../src/plugin.js';
import { BOT_BODIES, BOT_COLORS } from '../src/record.js';
import { botStore } from '../src/store.js';
import type { Agent } from '../../sdk/src/types/agent.js';
import type { Bag } from '../../sdk/src/types/common.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';
import type { Peer } from '../../sdk/src/types/rpc.js';
import type { Grant, Principal, Users } from '../../sdk/src/types/users.js';

/*
 * The scheme the bot plugin serves.
 *
 * A bot is a record a person makes, edits and deletes through the same four
 * commands every resource has: a write to `bot://<slug>` is a bot, a read is
 * its record, a list is the bots a reader may see, and a delete leaves a
 * tombstone behind. What is checked here is the whole of that seam - the gate
 * the host already has, the provider behind it, and the files it keeps.
 */

/** A temporary directory removed after the test that made it. */
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
 * A directory whose tokens are decided by hand.
 *
 * A grant is held the way a role holds one - exactly, by a wildcard in either
 * position, or through the group its operation is in - so `bot:*` is every
 * operation of the scheme and `bot:write` is each of the four that write.
 *
 * `members` is what each person belongs to, which is what a write naming a
 * `team:` or `project:` owner is checked against.
 */
const directory = (tokens: Record<string, Grant[]>, members: Record<string, string[]> = {}): Users => ({
  resource: RECORD,
  verify: async (token) => {
    const held = tokens[token];
    if (held === undefined) return undefined;
    const belongs = members[token];
    const person: Principal = {
      id: token,
      roles: ['r'],
      can: (one) => holds(new Set<string>(held), one),
      ...(belongs === undefined ? {} : { memberships: belongs }),
    };
    return person;
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
});

const peer = (): Peer => ({
  send: () => {}, notify: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
});

/**
 * A host with the bot plugin on it, folded in the way the loader folds it.
 *
 * `people` is false for the host with no users directory, where no connection
 * is anybody: the one host whose writer and reader are both absent.
 */
function made(
  tokens: Record<string, Grant[]> = {},
  members: Record<string, string[]> = {},
  over: Partial<HostOptions> = {},
  people = true,
  extra: Agent[] = [],
) {
  const root = mkdtempSync(join(tmpdir(), 'ahpd-bot-'));
  loose.push(root);
  /** Where a bot's own folder goes, which is the plugin's `root` option. */
  const bots = join(root, 'bots');
  const context: LoaderContext = {
    path: root,
    paths: [root],
    version: sdkVersion(),
    hostName: 'test',
    configDir: join(root, 'config'),
    log: () => {},
    say: () => {},
  };
  // The sessions this host keeps, which is where a chat is started: read live
  // off the host rather than held by the plugin, so the two are the same store
  // a running daemon would hand it.
  const sessions = memorySessions();
  // The record store in place of a folder: the plugin keeps its bots in two
  // collections of this, as a running daemon keeps them in `fileRecords`. Read
  // live off the host, the way the sessions are, so the plugin and the host
  // hold the same one.
  const records = memoryRecords();
  /** The problems the plugin reported while the host ran. */
  const reported: string[] = [];
  const { host: plugin, contribution } = pluginHost('bot', context, {
    sessions: () => sessions,
    records: () => records,
    problem: (line) => { reported.push(line); },
  });
  apply(plugin, { root: bots });

  const base: HostOptions = {
    path: root,
    agents: [{ ...echo({ path: root, pace: 0 }), provider: 'base', displayName: 'Base' }, ...extra],
    resources: fileResources(),
    sessions,
    records,
    ...(people ? { users: directory(tokens, members) } : {}),
    ...over,
  };
  const { options, problems } = foldHostOptions(base, [contribution]);
  return { host: createHost(options), bots, root, problems, reported, sessions, records };
}

type Client = ReturnType<ReturnType<typeof createHost>['accept']>;

/** A client signed in as `token`, which is what the gate reads a grant off. */
async function as(host: ReturnType<typeof createHost>, token: string): Promise<Client> {
  const client = host.accept(peer());
  await client.handle({
    method: 'initialize',
    params: { clientId: token, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: RECORD.resource, token } });
  return client;
}

/**
 * The host's own key: signed in as nobody, and answerable to no grant.
 *
 * A root connection is what the deployment's token gets, and it is the one
 * writer that may name an owner it has no membership for.
 */
async function door(host: ReturnType<typeof createHost>): Promise<Client> {
  const client = host.accept(peer(), undefined, true);
  await client.handle({
    method: 'initialize',
    params: { clientId: 'root', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  return client;
}

/** The result, or the refusal, whichever the host answered with. */
const call = async (client: Client, method: string, params: Bag) => client.handle({ method, params }).then(
  (result) => ({ result: result as Bag }),
  (error: { code: number; message: string; data?: unknown }) => error,
);

const write = (client: Client, uri: string, body: unknown, extra: Bag = {}) =>
  call(client, 'resourceWrite', { uri, data: JSON.stringify(body), ...extra });

/** The result of an answer the test expects to be one, or the refusal it named. */
const got = (answer: Awaited<ReturnType<typeof call>>): Bag => {
  if (!('result' in answer)) throw new Error(`refused: ${answer.code} ${answer.message}`);
  return answer.result;
};

const listing = async (client: Client, uri: string): Promise<string[]> => {
  const answer = got(await call(client, 'resourceList', { uri }));
  const entries = answer['entries'] as { name: string }[] | undefined;
  return (entries ?? []).map((one) => one.name);
};

/** One bot's record as a client reads it, which is what these cases assert on. */
const record = async (client: Client, uri: string): Promise<Bag> => {
  const answer = got(await call(client, 'resourceRead', { uri }));
  expect(answer['encoding']).toBe('utf-8');
  return JSON.parse(String(answer['data'])) as Bag;
};

it('makes a bot from a name alone', async () => {
  const { host, bots } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true })).toEqual({ result: {} });

  const bot = await record(soft, 'bot://motion');
  expect(bot).toMatchObject({
    id: 'motion',
    name: 'Motion',
    labels: [],
    // The maker owns it, and its folder is its own.
    owner: 'user:soft',
    workspace: join(bots, 'motion'),
  });
  expect(BOT_BODIES).toContain(bot['body']);
  expect(BOT_COLORS).toContain(bot['color']);
  expect(Date.parse(String(bot['createdAt']))).not.toBeNaN();
  expect(bot['updatedAt']).toBe(bot['createdAt']);
});

it('refuses a second bot on a slug that is taken', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  const again = await write(soft, 'bot://motion', { name: 'Another' }, { createOnly: true });

  expect(again).toMatchObject({ code: -32010 });
  expect((await record(soft, 'bot://motion'))['name']).toBe('Motion');
});

it('refuses a slug that is not one', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  // An upper-case letter, a slash and a name that starts with a digit are all
  // the same refusal: the slug is the URI path, so there is nowhere else for it
  // to be written and nothing for a bad one to fall back to.
  expect(await write(soft, 'bot://Motion', { name: 'Motion' }, { createOnly: true })).toMatchObject({ code: -32602 });
  expect(await write(soft, 'bot://mo/tion', { name: 'Motion' }, { createOnly: true })).toMatchObject({ code: -32602 });
  expect(await write(soft, 'bot://2motion', { name: 'Motion' }, { createOnly: true })).toMatchObject({ code: -32602 });
});

it('offers in the make form every field a write takes', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const client = host.accept(peer());
  const ready = await client.handle({
    method: 'initialize',
    params: { clientId: 'probe', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  }) as { _meta?: Record<string, Record<string, unknown>> };

  // The form a client draws a make from, which has to offer what the check
  // takes: a field the check accepts and the form does not offer is one no
  // client can give, and a field the form offers and the check refuses is a
  // form that lies.
  const entry = ready._meta?.['ahpd.resourceProviders']?.['bot'] as Bag | undefined;
  expect(entry).toMatchObject({ title: 'Bot', root: 'bot://' });
  const properties = ((entry?.['manifest'] as Bag)?.['properties'] ?? {}) as Bag;
  expect(Object.keys(properties)).toEqual(expect.arrayContaining([
    'name', 'labels', 'description', 'body', 'color', 'instructions', 'template', 'harness', 'model', 'preset',
    'workspace', 'computer', 'owner',
  ]));
  // A colour is a name or a hex, and the manifest says both.
  expect(properties['color']).toMatchObject({ anyOf: [{ enum: [...BOT_COLORS] }, { pattern: '^#[0-9a-fA-F]{6}$' }] });
});

it('makes a bot with any word as its body, and refuses a colour outside the list', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://dragon', { name: 'Dragon', body: 'dragon' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect(await record(soft, 'bot://dragon')).toMatchObject({ body: 'dragon' });
  expect(await write(soft, 'bot://motion', { name: 'Motion', body: '' }, { createOnly: true }))
    .toMatchObject({ code: -32602 });
  expect(await write(soft, 'bot://motion', { name: 'Motion', color: 'chartreuse' }, { createOnly: true }))
    .toMatchObject({ code: -32602 });
  // And neither refused one was made, which is the half a refusal has to mean.
  expect(await call(soft, 'resourceRead', { uri: 'bot://motion' })).toMatchObject({ code: -32008 });
});

it('makes a bot in a hex colour, and reads it back after a restart', async () => {
  const { host, records } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', color: '#2f6fdf' }, { createOnly: true })).toEqual({ result: {} });
  expect(await record(soft, 'bot://motion')).toMatchObject({ color: '#2f6fdf' });

  // A daemon that starts again reads the collection, and a hex colour is a
  // colour there too.
  const problems: string[] = [];
  const held = botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    (line) => problems.push(line),
  );
  await held.ready();
  expect(held.get('motion')).toMatchObject({ color: '#2f6fdf' });
  expect(problems).toEqual([]);
});

it('gives a bot its own folder, and refuses one another bot has', async () => {
  const { host, bots } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  expect((await record(soft, 'bot://motion'))['workspace']).toBe(join(bots, 'motion'));

  // Two bots in one folder would be two sessions working in the same tree,
  // which is the one thing the folder is for.
  const taken = await write(soft, 'bot://other', { name: 'Other', workspace: join(bots, 'motion') }, { createOnly: true });
  expect(taken).toMatchObject({ code: -32602 });

  // And a bot whose folder somebody named keeps it.
  await write(soft, 'bot://other', { name: 'Other', workspace: join(bots, 'elsewhere') }, { createOnly: true });
  expect((await record(soft, 'bot://other'))['workspace']).toBe(join(bots, 'elsewhere'));

  // A named folder is one under the plugin's root, never one beside it.
  for (const outside of [join(bots, '..', 'escaped'), bots, '/tmp/anywhere']) {
    const refused = await write(soft, 'bot://third', { name: 'Third', workspace: outside }, { createOnly: true });
    expect(refused).toMatchObject({ code: -32602 });
  }
});

it('edits a bot, keeping the slug it was made with', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  const before = await record(soft, 'bot://motion');

  // The way a client edits: read the record, read the validator with it, and
  // write both back - so a second writer who got there first is a conflict
  // rather than a lost update.
  const at = got(await call(soft, 'resourceResolve', { uri: 'bot://motion' }));
  expect(await write(soft, 'bot://motion', { name: 'Moved' }, { ifMatch: String(at['etag']) }))
    .toEqual({ result: {} });

  const after = await record(soft, 'bot://motion');
  expect(after).toMatchObject({ id: 'motion', name: 'Moved', owner: 'user:soft', createdAt: before['createdAt'] });

  // A write against a validator that is not the bot's own is refused, and the
  // bot is left as it was.
  expect(await write(soft, 'bot://motion', { name: 'Stale' }, { ifMatch: 'not-this-one' }))
    .toMatchObject({ code: -32011 });
  expect((await record(soft, 'bot://motion'))['name']).toBe('Moved');

  // And an edit may not name another bot, or another owner: both are the slug
  // and the maker, which a write is not a way to change.
  expect(await write(soft, 'bot://motion', { name: 'Moved', id: 'other' })).toMatchObject({ code: -32602 });
  expect(await write(soft, 'bot://motion', { name: 'Moved', owner: 'user:ana' })).toMatchObject({ code: -32602 });
});

it('leaves a tombstone where a bot was deleted', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  expect(await call(soft, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });

  // Gone from the listing, gone to a read, and never made again: the slug is
  // what a client had the address of, so a different bot under it would be a
  // different bot answering to a name somebody already knows.
  expect(await listing(soft, 'bot://')).toEqual([]);
  expect(await call(soft, 'resourceRead', { uri: 'bot://motion' })).toMatchObject({ code: -32008 });
  expect(await write(soft, 'bot://motion', { name: 'Again' }, { createOnly: true })).toMatchObject({ code: -32010 });
});

it('shows a bot to its owner, to their team, and to whoever holds the grant', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'], ana: ['bot:write', 'session:create'], rob: ['bot:get', 'bot:list'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  // Not hers, and nothing of this scheme held: refused, and not in a listing
  // either - a list that showed a bot a read would refuse is a list of names
  // its reader cannot open.
  const ana = await as(host, 'ana');
  expect(await call(ana, 'resourceRead', { uri: 'bot://motion' })).toMatchObject({ code: -32009 });
  expect(await listing(ana, 'bot://')).toEqual([]);

  // `bot:write` alone is enough to make one of her own, and hers is what she is
  // shown.
  expect(await write(ana, 'bot://hers', { name: 'Hers' }, { createOnly: true })).toEqual({ result: {} });
  expect(await listing(ana, 'bot://')).toEqual(['hers']);

  // And the grant is the other way in: whoever may read every bot reads this
  // one, which is what makes a scheme the host's own rather than each maker's.
  const rob = await as(host, 'rob');
  expect((await record(rob, 'bot://motion'))['name']).toBe('Motion');
  expect(await listing(rob, 'bot://')).toEqual(['hers', 'motion']);
});

/*
 * Who a bot may be made for.
 *
 * A bot belongs to a person, or to a team or a project they are part of, and
 * the last two are the writer's to name only where they are the writer's own.
 * The rule is the read road's, so what a write may make is what its maker may
 * then read.
 */
it('lets a member of a team make a bot the team owns', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] }, { soft: ['backend'] });
  const soft = await as(host, 'soft');

  const answer = await write(soft, 'bot://motion', { name: 'Motion', owner: 'team:backend' }, { createOnly: true });
  expect(answer).toEqual({ result: {} });
  expect((await record(soft, 'bot://motion'))['owner']).toBe('team:backend');
});

it('refuses a bot for a team the writer is not in', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] }, { soft: ['frontend'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'team:backend' }, { createOnly: true }))
    .toMatchObject({ code: -32009 });
  // And nothing was made: a refused write leaves no bot behind it.
  expect(await listing(soft, 'bot://')).toEqual([]);
});

it('lets a member of a project make a bot the project owns', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] }, { soft: ['shop:website'] });
  const soft = await as(host, 'soft');

  const answer = await write(soft, 'bot://storefront', { name: 'Storefront', owner: 'project:shop:website' }, { createOnly: true });
  expect(answer).toEqual({ result: {} });
  expect((await record(soft, 'bot://storefront'))['owner']).toBe('project:shop:website');
});

it('refuses a bot for a project the writer is not in', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] }, { soft: ['shop:billing'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://storefront', { name: 'Storefront', owner: 'project:shop:website' }, { createOnly: true }))
    .toMatchObject({ code: -32009 });
  expect(await listing(soft, 'bot://')).toEqual([]);
});

/*
 * Who an admin may make a bot for.
 *
 * A holder of `*:*` administers the host, so the membership rule is not theirs
 * to meet: they may name any person, any team or project, and this host's own
 * owner. A `root:` that is not this host's is nobody's to name but the root
 * connection's.
 */
it('lets an admin make a bot for another person, who then reads it', async () => {
  const { host } = made({ soft: ['*:*'], ana: ['bot:write', 'session:create'] });
  // A host starts a session for a person only once they have signed in, and a
  // chat is a session: ana signs in before she reads the bot of hers.
  const ana = await as(host, 'ana');
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'user:ana' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect((await record(ana, 'bot://motion'))['owner']).toBe('user:ana');
});

it('lets an admin make a bot for a team they are not in', async () => {
  const { host } = made({ soft: ['*:*'] }, { soft: ['frontend'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'team:backend' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect((await record(soft, 'bot://motion'))['owner']).toBe('team:backend');
});

it('lets an admin make a bot for this host, which a person without bot:get does not see', async () => {
  const { host } = made({ soft: ['*:*'], ana: ['bot:write', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://keeper', { name: 'Keeper', owner: 'root:test' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect((await record(soft, 'bot://keeper'))['owner']).toBe('root:test');

  const ana = await as(host, 'ana');
  expect(await call(ana, 'resourceRead', { uri: 'bot://keeper' })).toMatchObject({ code: -32009 });
  expect(await listing(ana, 'bot://')).toEqual([]);
});

it('writes any root: an admin names as the host under its name today', async () => {
  const { host } = made({ soft: ['*:*'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'root:old-name' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect((await record(soft, 'bot://motion'))['owner']).toBe('root:test');
});

it('takes an edit that names the host under another name, and keeps the owner on record', async () => {
  const { host } = made({ soft: ['*:*'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'root:test' }, { createOnly: true }))
    .toEqual({ result: {} });
  // The machine was renamed since: a client sends the name the manifest gives it now.
  expect(await write(soft, 'bot://motion', { name: 'Moved', owner: 'root:new-name' })).toEqual({ result: {} });
  const bot = await record(soft, 'bot://motion');
  expect(bot['name']).toBe('Moved');
  expect(bot['owner']).toBe('root:test');
});

it('refuses the host as the owner to a writer without *:*', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'root:test' }, { createOnly: true }))
    .toMatchObject({ code: -32009 });
  expect(await listing(soft, 'bot://')).toEqual([]);
});

it('still refuses a bot for another person to a writer without *:*', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', owner: 'user:ana' }, { createOnly: true }))
    .toMatchObject({ code: -32009 });
  expect(await listing(soft, 'bot://')).toEqual([]);
});

it('names this host\'s own owner in the manifest', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const client = host.accept(peer());
  const ready = await client.handle({
    method: 'initialize',
    params: { clientId: 'probe', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  }) as { _meta?: Record<string, Record<string, unknown>> };

  // A client is never told the host's key, so the manifest is where it reads
  // the owner a host bot is made with.
  const entry = ready._meta?.['ahpd.resourceProviders']?.['bot'] as Bag | undefined;
  const properties = ((entry?.['manifest'] as Bag)?.['properties'] ?? {}) as Bag;
  expect(properties['owner']).toMatchObject({
    anyOf: [{ type: 'string' }, { const: 'root:test', title: 'This host' }],
  });
});

/*
 * Who may change a bot that is already there.
 *
 * Making one is any holder of the grant a write asks for. Changing one is the
 * four ways in: its owner, a member of the team or project it belongs to, an
 * admin, and this host. A bot belongs to somebody, so the grant that makes one
 * may not reach into somebody else's - and neither may a read of every bot.
 */
it('refuses an edit and a delete to a bot whose writer it is not', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'], ana: ['bot:write'], rob: ['bot:*'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion', instructions: 'Be calm' }, { createOnly: true });

  // `bot:write` is the group a write and a delete both ask the host for, so the
  // gate lets all four of these through and the bot is what refuses them.
  const ana = await as(host, 'ana');
  expect(await write(ana, 'bot://motion', { name: 'Ana was here' }))
    .toMatchObject({ code: -32009, message: expect.stringContaining('motion') });
  expect(await call(ana, 'resourceDelete', { uri: 'bot://motion' }))
    .toMatchObject({ code: -32009, message: expect.stringContaining('motion') });

  // And every operation on this scheme is not the grant that is every grant: a
  // holder of `bot:*` may make a bot of their own and change no other.
  const rob = await as(host, 'rob');
  expect(await write(rob, 'bot://motion', { name: 'Rob was here' }))
    .toMatchObject({ code: -32009, message: expect.stringContaining('motion') });
  expect(await call(rob, 'resourceDelete', { uri: 'bot://motion' }))
    .toMatchObject({ code: -32009, message: expect.stringContaining('motion') });

  // Both of them left it exactly as it was.
  expect(await record(soft, 'bot://motion')).toMatchObject({ name: 'Motion', instructions: 'Be calm' });
});

it('lets the owner edit and delete their own bot', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  expect(await write(soft, 'bot://motion', { name: 'Moved' })).toEqual({ result: {} });
  expect((await record(soft, 'bot://motion'))['name']).toBe('Moved');
  expect(await call(soft, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });
  expect(await listing(soft, 'bot://')).toEqual([]);
});

it('lets a member of the team a bot belongs to change it', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'], ana: ['bot:write'] }, { soft: ['backend'], ana: ['backend'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion', owner: 'team:backend' }, { createOnly: true });

  const ana = await as(host, 'ana');
  expect(await write(ana, 'bot://motion', { name: 'Moved' })).toEqual({ result: {} });
  expect((await record(ana, 'bot://motion'))['name']).toBe('Moved');
  expect(await call(ana, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });
});

it('lets an admin change a bot that is not theirs', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'], ana: ['*:*'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  const ana = await as(host, 'ana');
  expect(await write(ana, 'bot://motion', { name: 'Moved' })).toEqual({ result: {} });
  expect((await record(ana, 'bot://motion'))['name']).toBe('Moved');
  expect(await call(ana, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });
});

it('lets the host change any bot', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  // The root connection is the host's own key, and it is not a person whose
  // membership of anything could be asked.
  const root = await door(host);
  expect(await write(root, 'bot://motion', { name: 'Moved' })).toEqual({ result: {} });
  expect(await call(root, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });
});

it('lets a host with no users directory change any bot', async () => {
  // No directory means no principal means nobody to ask, so this host is
  // exactly as open as it was before there was an owner to check.
  const { host } = made({}, {}, {}, false);
  const anyone = host.accept(peer());
  await anyone.handle({
    method: 'initialize',
    params: { clientId: 'anyone', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });

  await write(anyone, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  expect(String((await record(anyone, 'bot://motion'))['owner'])).toMatch(/^root:/);
  expect(await write(anyone, 'bot://motion', { name: 'Moved' })).toEqual({ result: {} });
  expect(await call(anyone, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });
});

it('lets the host make a bot for a team it holds no membership of', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const root = await door(host);

  expect(await write(root, 'bot://motion', { name: 'Motion', owner: 'team:backend' }, { createOnly: true }))
    .toEqual({ result: {} });
  expect((await record(root, 'bot://motion'))['owner']).toBe('team:backend');
});

/*
 * A bot made with no session is made anyway.
 *
 * A bot is a record, a folder, a chat, and the name of the session a message to
 * it wakes. A make leaves the record and the folder behind - the folder because
 * that is where the bot works - and opens nothing: what anybody says to a bot is
 * said in a chat, and a chat is opened by a read of the bot rather than by its
 * maker. The name is written rather than started, so nothing is running until
 * somebody says something.
 */

/**
 * The row a client reads for one session, or the failure of it not being there.
 *
 * A session is in the listing when this host has it, so an empty listing is
 * what a host that started nothing answers with.
 */
const row = async (client: Client, uri: string): Promise<Bag> => {
  const answer = got(await call(client, 'listSessions', { channel: ROOT }));
  const items = (answer['items'] ?? []) as Bag[];
  const found = items.find((one) => one['resource'] === uri);
  if (found === undefined) throw new Error(`${uri} is in no listing`);
  return found;
};

/** Every session this host holds, by URI. */
const allSessions = async (client: Client): Promise<string[]> => {
  const answer = got(await call(client, 'listSessions', { channel: ROOT }));
  return ((answer['items'] ?? []) as Bag[]).map((one) => String(one['resource']));
};

it('runs a bot in its own folder, and makes the folder first', async () => {
  const { host, bots } = made({ soft: ['bot:*', 'session:*'] });
  const soft = await as(host, 'soft');

  const workspace = join(bots, 'motion');
  expect(existsSync(workspace)).toBe(false);
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  // The folder is there for the bot to work in, and it is the bot's whether or
  // not anybody has talked to it: a read answers the same path.
  expect(existsSync(workspace)).toBe(true);
  expect((await record(soft, 'bot://motion'))['workspace']).toBe(workspace);
});

it('starts no session on a make', async () => {
  // A bot is not talked to in a session of its own: what is said to it is said
  // in a chat, and a chat is opened by a read of the bot. So a make opens
  // nothing at all, whatever the body named - a preset, a harness or neither.
  const { host } = made({ soft: ['bot:*', 'session:*'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion', preset: 'loud', harness: 'whisper', model: 'the-big-one' }, { createOnly: true });
  await write(soft, 'bot://quiet', { name: 'Quiet' }, { createOnly: true });

  expect(await allSessions(soft)).toEqual([]);
  // The name is on the record, and a name is not a session: the one a bot that
  // names none has is `work`.
  expect((await record(soft, 'bot://motion'))['session']).toBe('work');
});

it('edits a bot whose template was removed, and refuses an edit that names a missing one', async () => {
  const { host, records } = made({ soft: ['bot:*', 'session:*'] });
  const soft = await as(host, 'soft');
  const templates = await records.collection('templates', { body: 'text' });
  await templates.put({ id: 'short', title: 'Short', text: '{{name}}' });
  got(await write(soft, 'bot://motion', { name: 'Motion', template: 'short' }, { createOnly: true }));
  await templates.remove('short');

  got(await write(soft, 'bot://motion', { name: 'Calm' }));
  expect(await write(soft, 'bot://motion', { name: 'Calm', template: 'short' }))
    .toMatchObject({ code: -32602, message: 'The template short does not exist.' });
});

it('refuses a make that names a template that does not exist', async () => {
  const { host } = made({ soft: ['bot:*', 'session:*'] });
  const soft = await as(host, 'soft');

  expect(await write(soft, 'bot://motion', { name: 'Motion', template: 'missing' }, { createOnly: true }))
    .toMatchObject({ code: -32602, message: 'The template missing does not exist.' });
  // Nothing was made, so the name is still free.
  expect(await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true })).toMatchObject({ result: {} });
});

it('takes the name of a back session, and fills one a bot named none of', async () => {
  const { host, bots, records } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  await write(soft, 'bot://motion', { name: 'Motion', session: 'reviews' }, { createOnly: true });
  expect((await record(soft, 'bot://motion'))['session']).toBe('reviews');

  // A name a session can have is a slug, and `{turn}` is the one word it may
  // hold: a body that names anything else is refused, so a name read back off a
  // bot is always a name a message can wake.
  expect(await write(soft, 'bot://other', { name: 'Other', session: 'claude:/one' }, { createOnly: true }))
    .toMatchObject({
      code: -32602,
      message: 'claude:/one is not a name a back session can have: lowercase letters, digits, a dash and {turn}, starting with a letter',
    });
  expect(await write(soft, 'bot://job', { name: 'Job', session: 'job-{turn}' }, { createOnly: true }))
    .toMatchObject({ result: {} });

  // A file written before a bot named one is read as a bot that named none: the
  // store fills the name in, so nothing that reads a bot has to know the default.
  await (await records.collection('bots', { body: 'instructions' })).put({
    id: 'older',
    name: 'Older',
    labels: [],
    body: 'robot',
    color: 'red',
    workspace: join(bots, 'older'),
    owner: 'user:soft',
    createdAt: '2026-10-11T00:00:00.000Z',
    updatedAt: '2026-10-11T00:00:00.000Z',
  });

  expect((await record(soft, 'bot://older'))['session']).toBe('work');
});

/*
 * The writes `docs/plugins/BOTS.md` prints, sent as the file prints them.
 *
 * The examples in that file are bodies a client may copy, so they are bodies
 * this host has to answer. A change on either side the other did not follow is
 * a doc that has stopped being true.
 */
it('answers the writes docs/plugins/BOTS.md shows', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');

  // A make from a name alone.
  expect(await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true })).toEqual({ result: {} });

  // A bot on a harness of its own, with a body and a colour of its choosing.
  expect(await write(soft, 'bot://reader', {
    name: 'Motion',
    labels: ['review', 'ci'],
    description: 'Reads pull requests and says what would break.',
    body: 'robot',
    color: 'teal',
    instructions: 'You review pull requests. Say what would break, in one paragraph.',
    harness: 'claude',
    model: 'claude-sonnet-5',
  }, { createOnly: true })).toEqual({ result: {} });
  expect(await record(soft, 'bot://reader')).toMatchObject({
    body: 'robot', color: 'teal', harness: 'claude', model: 'claude-sonnet-5',
  });
});

/*
 * A watch on the scheme.
 *
 * `createResourceWatch` on `bot://` hears every bot its reader may see being
 * made, edited and deleted, and a watch on `bot://<slug>` hears that one bot.
 * What a watcher hears is what a read or a listing would show it.
 */

/** A client signed in as `token` whose peer keeps every notification it is sent. */
async function listening(host: ReturnType<typeof createHost>, token: string) {
  const notes: { method: string; params: unknown }[] = [];
  const client = host.accept({ ...peer(), notify: (method, params) => { notes.push({ method, params }); } });
  await client.handle({
    method: 'initialize',
    params: { clientId: token, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: RECORD.resource, token } });
  /** Open a watch on `uri` and subscribe to it, and answer the channel. */
  const watch = async (uri: string): Promise<string> => {
    const { channel } = got(await call(client, 'createResourceWatch', { channel: ROOT, uri })) as { channel: string };
    got(await call(client, 'subscribe', { channel }));
    return channel;
  };
  /** Every change told on one channel so far, as `<type> <uri>`. */
  const heard = (channel: string): string[] => notes
    .filter((n) => n.method === 'action')
    .map((n) => n.params as { channel: string; action: { type: string; changes?: { items: { uri: string; type: string }[] } } })
    .filter((n) => n.channel === channel && n.action.type === 'resourceWatch/changed')
    .flatMap((n) => n.action.changes?.items ?? [])
    .map((one) => `${one.type} ${one.uri}`);
  return { client, watch, heard };
}

it('tells a watch on bot:// about a bot its owner makes, edits and deletes', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await listening(host, 'soft');
  const channel = await soft.watch('bot://');

  await write(soft.client, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  await write(soft.client, 'bot://motion', { name: 'Motion two' });
  expect(await call(soft.client, 'resourceDelete', { uri: 'bot://motion' })).toEqual({ result: {} });

  expect(soft.heard(channel)).toEqual(['added bot://motion', 'updated bot://motion', 'deleted bot://motion']);
});

it('tells a watch on one bot about that bot and nothing else', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await listening(host, 'soft');
  await write(soft.client, 'bot://motion', { name: 'Motion' }, { createOnly: true });
  const channel = await soft.watch('bot://motion');

  await write(soft.client, 'bot://other', { name: 'Other' }, { createOnly: true });
  await write(soft.client, 'bot://motion', { name: 'Motion two' });

  expect(soft.heard(channel)).toEqual(['updated bot://motion']);
});

it('refuses a watch on a bot that does not exist, or on a path under one', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await listening(host, 'soft');
  await write(soft.client, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  expect(await call(soft.client, 'createResourceWatch', { channel: ROOT, uri: 'bot://nobody' })).toMatchObject({ code: expect.any(Number) });
  expect(await call(soft.client, 'createResourceWatch', { channel: ROOT, uri: 'bot://motion/leaf' })).toMatchObject({ code: expect.any(Number) });
});

it('tells a watcher only about the bots it may read', async () => {
  const { host } = made(
    { soft: ['bot:*', 'session:create'], ana: ['bot:watch'], bea: ['bot:watch'], rob: ['bot:watch', 'bot:list'] },
    { soft: ['backend'], ana: ['backend'] },
  );
  const soft = await listening(host, 'soft');
  const ana = await listening(host, 'ana');
  const bea = await listening(host, 'bea');
  const rob = await listening(host, 'rob');
  const [own, member, stranger, granted] = [await soft.watch('bot://'), await ana.watch('bot://'), await bea.watch('bot://'), await rob.watch('bot://')];

  await write(soft.client, 'bot://team', { name: 'Team', owner: 'team:backend' }, { createOnly: true });
  await write(soft.client, 'bot://mine', { name: 'Mine' }, { createOnly: true });

  // The owner hears both, the team member hears the team's bot, a person of
  // no team hears neither, and whoever may list every bot hears both.
  expect(soft.heard(own)).toEqual(['added bot://team', 'added bot://mine']);
  expect(ana.heard(member)).toEqual(['added bot://team']);
  expect(bea.heard(stranger)).toEqual([]);
  expect(rob.heard(granted)).toEqual(['added bot://team', 'added bot://mine']);
});

it('tells a watch nothing once its last subscriber leaves', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await listening(host, 'soft');
  const channel = await soft.watch('bot://');
  await write(soft.client, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  got(await call(soft.client, 'unsubscribe', { channel }));
  await write(soft.client, 'bot://motion', { name: 'Motion two' });

  expect(soft.heard(channel)).toEqual(['added bot://motion']);
});

/*
 * The chat a read of a bot answers.
 *
 * A bot is talked to in a chat: one session of the `bot-chat` provider per bot
 * and person, which runs no model and keeps what was said a line at a time. A
 * read of `bot:/<slug>` is the one door onto it, so that is where one is opened:
 * whoever holds `bot:chat`, or owns the bot, is answered the URI of their own,
 * and reads the same bot again to find the same conversation. A reader who may
 * not chat is answered the record alone, which is not a refusal - there is
 * nothing wrong with their read, there is simply no conversation of theirs.
 */

/** The id inside a session URI, which is what the session store is keyed by. */
const idIn = (uri: string): string => uri.slice(uri.indexOf(':') + 1).replace(/^\/+/, '');

it('answers a read with the reader\'s own chat, and the same chat again', async () => {
  const { host, bots, sessions } = made({
    soft: ['bot:*', 'session:create'],
    ana: ['bot:get', 'bot:chat', 'session:create', 'session:read'],
  });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  const ana = await as(host, 'ana');
  const first = await record(ana, 'bot://motion');
  const chat = String(first['chat']);
  expect(chat).toMatch(/^bot-chat:\//);
  // A session of the plugin's own provider, in the bot's folder, named after
  // the bot, and hers: it is the same session she would have started herself.
  expect(await row(ana, chat)).toMatchObject({
    title: 'Motion',
    workingDirectories: [`file://${join(bots, 'motion')}`],
  });
  expect(sessions.owner(idIn(chat))).toBe('user:ana');

  // And the second read is the same conversation: a person reads a bot over and
  // over, and a session started for each read would be a chat per glance.
  expect((await record(ana, 'bot://motion'))['chat']).toBe(chat);
});

it('gives two people a chat each with one bot', async () => {
  const { host } = made({
    // The owner holds no chat grant of her own and chats anyway: the grant is
    // for everybody else, which is the read road's rule for `bot:get`.
    soft: ['bot:write', 'session:create'],
    ana: ['bot:get', 'bot:chat', 'session:create'],
  });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  const hers = String((await record(soft, 'bot://motion'))['chat']);
  const ana = await as(host, 'ana');
  const theirs = String((await record(ana, 'bot://motion'))['chat']);

  // One bot, two conversations: what each of them says to it is their own.
  expect(hers).toMatch(/^bot-chat:\//);
  expect(theirs).toMatch(/^bot-chat:\//);
  expect(theirs).not.toBe(hers);
});

it('answers a reader who may not chat with the record alone', async () => {
  const { host } = made({ soft: ['bot:*', 'session:create'], rob: ['bot:get', 'session:read'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  const rob = await as(host, 'rob');
  const read = await record(rob, 'bot://motion');
  expect(read).toMatchObject({ id: 'motion', name: 'Motion' });
  expect(read).not.toHaveProperty('chat');

  // And nothing was opened for him: a chat he may not have is not started on
  // the way to being withheld.
  const listed = got(await call(rob, 'listSessions', { channel: ROOT }));
  const items = (listed['items'] ?? []) as Bag[];
  expect(items.map((one) => String(one['resource'])).filter((one) => one.startsWith('bot-chat:/'))).toEqual([]);
});

it('takes a write that carries a chat back, and keeps none of it', async () => {
  const { host, records } = made({ soft: ['bot:*', 'session:create'] });
  const soft = await as(host, 'soft');
  await write(soft, 'bot://motion', { name: 'Motion' }, { createOnly: true });

  // The way a client edits: it read the record, so what it writes back is the
  // record with the chat it was answered. `chat` is the reader's own rather
  // than a bot's field, so a body carrying one is a body about the rest.
  const read = await record(soft, 'bot://motion');
  expect(String(read['chat'])).toMatch(/^bot-chat:\//);
  expect(await write(soft, 'bot://motion', read)).toEqual({ result: {} });

  // None of it is kept, and the chat it was given is still the one it answers
  // with - a chat is not something a write can move.
  const kept = await (await records.collection('bots', { body: 'instructions' })).get('motion');
  expect(kept).not.toHaveProperty('chat');
  expect((await record(soft, 'bot://motion'))['chat']).toBe(read['chat']);
});
