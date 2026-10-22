import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { connectorsChannel } from '../src/connectors/channel.js';
import { createHost } from '../src/host.js';
import { fileUsers } from '../src/access/users.js';
import { fileResources } from '../src/resources/resources.js';
import { memoryRecords } from '../src/resources/records.js';
import { servedRecords } from '../src/resources/recordschannel.js';
import { echo } from '../../../examples/echo/agent.js';
import type { Connector, ServedConnectorKind } from '../src/types/connectors.js';
import type { RecordCollection } from '../src/types/records.js';
import type { Users } from '../src/types/users.js';
import type { Vault } from '../src/types/vault.js';

/*
 * The connectors channel over a store in memory and a vault that is a map.
 *
 * The host is in this process, over a real users file, so the grant a caller
 * holds is the one the daemon would see: `connector:read` reads every row,
 * `connector:put` and `connector:remove` make and remove a host connector,
 * `team:write` makes a team's, and a person's own connector takes nothing but
 * being them.
 */

const URI = 'x-ahpd-connectors://';
const FILTERED = `${URI}?owner=me`;
const ROOT = 'ahp-root://';

type Bag = Record<string, any>;

/** The kind's schema: one string a person fills in, one secret and one choice. */
const SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    target: { type: 'string' },
    secret: { type: 'string', writeOnly: true },
    reply: { type: 'string' },
  },
  required: ['target'],
};

/**
 * The subset of JSON Schema this kind's form uses, as the daemon's checker
 * reads it: a value of the named type, the required fields, and no field the
 * schema does not describe.
 */
const check = (value: unknown, schema: Bag, label: string): void => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const given = value as Bag;
  const properties = (schema['properties'] ?? {}) as Bag;
  for (const name of (schema['required'] ?? []) as string[]) {
    if (given[name] === undefined) throw new Error(`${label}.${name} is required`);
  }
  for (const [name, one] of Object.entries(properties) as [string, Bag][]) {
    if (given[name] === undefined) continue;
    if (one['type'] === 'string' && typeof given[name] !== 'string') throw new Error(`${label}.${name} must be text`);
    if (one['type'] === 'boolean' && typeof given[name] !== 'boolean') throw new Error(`${label}.${name} must be true or false`);
  }
  for (const name of Object.keys(given)) {
    if (!(name in properties)) throw new Error(`${label}.${name} is not a field`);
  }
};

/** A vault that is a map, and says what is in it. */
const made = (): Vault & { held: Map<string, string> } => {
  const held = new Map<string, string>();
  return {
    held,
    get: async (name) => held.get(name),
    set: async (name, value) => { held.set(name, value); },
    delete: async (name) => held.delete(name),
    list: async () => [...held.keys()].sort(),
  };
};

let home: string;
let usersFile: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-connectors-'));
  usersFile = join(home, 'users.json');
  writeFileSync(usersFile, JSON.stringify({
    teams: [{ id: 'backend' }],
    roles: {
      reader: ['connector:read'],
      writer: ['connector:read', 'connector:write'],
      teamer: ['team:write'],
      'config-reader': ['config:read'],
      'config-writer': ['config:write'],
      putter: ['connector:put'],
    },
    users: [
      { id: 'ana', roles: ['reader'] },
      { id: 'bo', roles: [] },
      { id: 'cy', roles: ['writer'] },
      { id: 'di', roles: ['teamer'], memberships: ['backend'] },
      { id: 'el', roles: [], memberships: ['backend'] },
      { id: 'fa', roles: ['config-reader'] },
      { id: 'gi', roles: ['config-writer'] },
      { id: 'ha', roles: ['putter'] },
    ],
  }));
});
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

type Host = ReturnType<typeof createHost>;

/** What a kind was opened with, and what it was closed as. */
interface Opened {
  id: string;
  kind: string;
  owner: string;
  config: Record<string, unknown>;
}

/** A host serving the connectors channel over one kind, the `webhook` one. */
async function served(register = true) {
  const collection: RecordCollection = await memoryRecords().collection('connectors', { format: 'json' });
  const opened: Opened[] = [];
  const closed: string[] = [];
  const problems: string[] = [];
  const vault = made();
  const kinds: Record<string, ServedConnectorKind> = register
    ? {
        webhook: {
          name: 'webhook',
          title: 'Webhook',
          description: 'Receives calls at a URL.',
          by: 'webhook',
          schema: SCHEMA,
          capabilities: [{ type: 'receive', name: 'call', title: 'Receives calls', description: 'Receives calls at a URL.' }],
          open: (connector: Connector) => {
            opened.push({ id: connector.id, kind: connector.kind, owner: connector.owner, config: connector.config });
            return () => { closed.push(connector.id); };
          },
        },
      }
    : {};
  const connectors = connectorsChannel({
    collection,
    kinds: () => kinds,
    vault: () => vault,
    check,
    onProblem: (line) => { problems.push(line); },
  });
  const wire = servedRecords('ahpd', [connectors.channel], connectors.methods);
  const users = fileUsers({ path: usersFile });
  const host = createHost({
    path: home,
    agents: [{ ...echo({ path: home, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    channels: wire.channels,
    methods: wire.methods,
    users,
  });
  return { host, users, collection, connectors, kinds, opened, closed, problems, vault, close: async () => { await host.close(); } };
}

/** A client signed in as `id`, whose channel actions are kept. */
const as = async (host: Host, users: Users, id: string) => {
  const token = await users.mint(id);
  const seen: { method: string; params: Bag }[] = [];
  const client = host.accept({
    send: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
    notify: (method, params) => { seen.push({ method, params: params as Bag }); },
  });
  const ready = await client.handle({
    method: 'initialize', params: { clientId: id, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  }) as Bag;
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: users.resource.resource, token } });
  const call = async (method: string, params: Bag) => client.handle({ method, params }).then(
    (result) => ({ result: result as Bag }),
    (error: { code: number; message: string }) => ({ code: error.code, message: error.message }),
  );
  /** Every row a subscribe to `channel` answered, by id. */
  const rows = async (channel = URI): Promise<Record<string, Bag>> => {
    const answer = await call('subscribe', { channel }) as Bag;
    if (answer['result'] === undefined) throw new Error(`subscribe refused: ${JSON.stringify(answer)}`);
    const records = (answer['result'] as Bag)['snapshot'].state.records as { id: string; record: Bag }[];
    return Object.fromEntries(records.map((one) => [one.id, one.record]));
  };
  return { call, rows, ready, close: () => { client.close(); } };
};

it('lists a kind before any connector of it exists', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(Object.keys(rows)).toEqual(['kind:webhook']);
  expect(rows['kind:webhook']).toEqual({
    name: 'webhook',
    title: 'Webhook',
    description: 'Receives calls at a URL.',
    schema: SCHEMA,
    capabilities: [{ type: 'receive', name: 'call', title: 'Receives calls', description: 'Receives calls at a URL.' }],
    plugin: 'webhook',
  });
  await close();
});

it('makes two connectors of one kind, and opens each with its own config', async () => {
  const { host, users, opened, close } = await served();
  const cy = await as(host, users, 'cy');
  await cy.rows();

  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'webhook', owner: 'user:cy', title: 'CI', config: { target: 'bot://motion' },
  })).toMatchObject({ result: { id: 'ci', kind: 'webhook', owner: 'user:cy', title: 'CI', state: 'open' } });
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'deploys', kind: 'webhook', owner: 'user:cy', config: { target: 'automation' },
  })).toMatchObject({ result: { id: 'deploys', state: 'open' } });

  expect(opened).toEqual([
    { id: 'ci', kind: 'webhook', owner: 'user:cy', config: { target: 'bot://motion' } },
    { id: 'deploys', kind: 'webhook', owner: 'user:cy', config: { target: 'automation' } },
  ]);
  const rows = await cy.rows();
  expect(Object.keys(rows)).toEqual(['kind:webhook', 'ci', 'deploys']);
  expect(rows['ci']).toMatchObject({ id: 'ci', kind: 'webhook', owner: 'user:cy', state: 'open' });
  expect(rows['deploys']).toMatchObject({ state: 'open' });
  await close();
});

it('keeps a writeOnly value in the vault, and in no record and no snapshot', async () => {
  const { host, users, collection, opened, vault, close } = await served();
  const cy = await as(host, users, 'cy');
  await cy.rows();

  await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'webhook', owner: 'user:cy', config: { target: 'bot://motion', secret: 'sk-live-1' },
  });

  // The vault holds it under the owner's scope, under the connector and the field.
  expect(await vault.get('user:cy/connector/ci/secret')).toBe('sk-live-1');
  // The kind is given the value back, because that is what it answers calls with.
  expect(opened[0]?.config['secret']).toBe('sk-live-1');

  const stored = await collection.get('ci');
  expect(stored?.['config']).toEqual({ target: 'bot://motion', secret: { $secret: 'user:cy/connector/ci/secret' } });
  expect(JSON.stringify(stored)).not.toContain('sk-live-1');
  expect(JSON.stringify(await cy.rows())).not.toContain('sk-live-1');
  await close();
});

it('keeps the stored secret when a put sends the writeOnly field empty', async () => {
  const { host, users, collection, opened, vault, close } = await served();
  const cy = await as(host, users, 'cy');
  await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'webhook', owner: 'user:cy', config: { target: 'bot://motion', secret: 'sk-live-1' },
  });

  // A client never sees the value, so it sends the field empty rather than leaving it out.
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'webhook', owner: 'user:cy', config: { target: 'bot://other', secret: '' },
  })).toMatchObject({ result: { state: 'open' } });

  expect(await vault.get('user:cy/connector/ci/secret')).toBe('sk-live-1');
  expect((await collection.get('ci'))?.['config']).toEqual({
    target: 'bot://other',
    secret: { $secret: 'user:cy/connector/ci/secret' },
  });
  // Closed for the rewrite and opened again with the secret read back.
  expect(opened).toHaveLength(2);
  expect(opened[1]?.config).toEqual({ target: 'bot://other', secret: 'sk-live-1' });
  await close();
});

it('serves a connector of a kind nobody registers as unavailable, and does not open it', async () => {
  const { host, users, collection, opened, connectors, close } = await served(false);
  await collection.put({ id: 'lost', kind: 'webhook', owner: 'host', config: { target: 'bot://motion' } });
  await connectors.openAll();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(rows['lost']).toMatchObject({ id: 'lost', kind: 'webhook', owner: 'host', state: 'unavailable' });
  expect(opened).toEqual([]);
  await close();
});

it('serves a connector whose config no longer fits its kind as invalid, and opens none', async () => {
  const { host, users, collection, opened, connectors, close } = await served();
  await collection.put({ id: 'lost', kind: 'webhook', owner: 'host', config: { reply: 'none' } });
  await connectors.openAll();
  const ana = await as(host, users, 'ana');

  expect((await ana.rows())['lost']).toMatchObject({ state: 'invalid' });
  expect(opened).toEqual([]);
  await close();
});

it('opens a stored connector of a registered kind when the daemon starts', async () => {
  const { host, users, collection, opened, connectors, vault, close } = await served();
  await vault.set('host:connector/ci/secret', 'right-token');
  await collection.put({
    id: 'ci', kind: 'webhook', owner: 'host', config: { target: 'bot://motion', secret: { $secret: 'host:connector/ci/secret' } },
  });
  await connectors.openAll();
  const ana = await as(host, users, 'ana');

  expect(opened).toEqual([
    { id: 'ci', kind: 'webhook', owner: 'host', config: { target: 'bot://motion', secret: 'right-token' } },
  ]);
  expect((await ana.rows())['ci']).toMatchObject({ state: 'open' });
  await close();
});

it('lists only the caller\'s own connectors through ?owner=me', async () => {
  const { host, users, close } = await served();
  const cy = await as(host, users, 'cy');
  const di = await as(host, users, 'di');
  await cy.call('x-ahpd/connectors/put', { id: 'mine', kind: 'webhook', owner: 'user:cy', config: { target: 'a' } });
  await cy.call('x-ahpd/connectors/put', { id: 'shared', kind: 'webhook', owner: 'host', config: { target: 'b' } });
  await di.call('x-ahpd/connectors/put', { id: 'theirs', kind: 'webhook', owner: 'user:di', config: { target: 'c' } });

  // Everything, because `connector:read` is the whole listing.
  expect(Object.keys(await cy.rows())).toEqual(['kind:webhook', 'mine', 'shared', 'theirs']);
  // Only the caller's own, and no kind row, because a kind belongs to nobody.
  expect(Object.keys(await cy.rows(FILTERED))).toEqual(['mine']);
  expect(Object.keys(await di.rows(FILTERED))).toEqual(['theirs']);
  await close();
});

it('refuses a caller with no grant, to read and to change what is not theirs', async () => {
  const { host, users, close } = await served();
  const bo = await as(host, users, 'bo');
  const cy = await as(host, users, 'cy');
  await cy.call('x-ahpd/connectors/put', { id: 'shared', kind: 'webhook', owner: 'host', config: { target: 'a' } });

  // A reader with nothing of their own is answered no row at all.
  expect(await bo.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  // A host connector is the daemon's, and takes connector:put.
  expect(await bo.call('x-ahpd/connectors/put', {
    id: 'other', kind: 'webhook', owner: 'host', config: { target: 'a' },
  })).toMatchObject({ code: -32009 });
  // A team's takes team:write and a membership, and a person's takes being them.
  expect(await bo.call('x-ahpd/connectors/put', {
    id: 'other', kind: 'webhook', owner: 'team:backend', config: { target: 'a' },
  })).toMatchObject({ code: -32009 });
  expect(await bo.call('x-ahpd/connectors/put', {
    id: 'other', kind: 'webhook', owner: 'user:cy', config: { target: 'a' },
  })).toMatchObject({ code: -32009 });
  expect(await bo.call('x-ahpd/connectors/remove', { id: 'shared' })).toMatchObject({ code: -32009 });
  await close();
});

it('lets a person make and remove their own connector with no connector grant, and read it', async () => {
  const { host, users, closed, close } = await served();
  const bo = await as(host, users, 'bo');

  expect(await bo.call('x-ahpd/connectors/put', {
    id: 'mine', kind: 'webhook', owner: 'user:bo', config: { target: 'a' },
  })).toMatchObject({ result: { state: 'open' } });
  expect(Object.keys(await bo.rows())).toEqual(['mine']);
  expect(await bo.call('x-ahpd/connectors/remove', { id: 'mine' })).toEqual({ result: {} });
  expect(closed).toEqual(['mine']);
  // Nothing of theirs is left, and the kinds take connector:read, so there is no row to answer.
  expect(await bo.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  await close();
});

it('does not let a connector grant reach a team\'s connector or a person\'s', async () => {
  const { host, users, close } = await served();
  const cy = await as(host, users, 'cy');
  const di = await as(host, users, 'di');
  await di.call('x-ahpd/connectors/put', { id: 'theirs', kind: 'webhook', owner: 'user:di', config: { target: 'a' } });
  await di.call('x-ahpd/connectors/put', { id: 'team', kind: 'webhook', owner: 'team:backend', config: { target: 'b' } });

  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'theirs', kind: 'webhook', owner: 'user:di', config: { target: 'c' },
  })).toMatchObject({ code: -32009 });
  expect(await cy.call('x-ahpd/connectors/remove', { id: 'team' })).toMatchObject({ code: -32009 });
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'team', kind: 'webhook', owner: 'team:backend', config: { target: 'c' },
  })).toMatchObject({ code: -32009 });
  await close();
});

it('does not let a put with another owner take a connector its caller may not change', async () => {
  const { host, users, opened, close } = await served();
  const bo = await as(host, users, 'bo');
  const cy = await as(host, users, 'cy');
  const di = await as(host, users, 'di');
  await di.call('x-ahpd/connectors/put', { id: 'theirs', kind: 'webhook', owner: 'user:di', config: { target: 'a' } });
  await di.call('x-ahpd/connectors/put', { id: 'team', kind: 'webhook', owner: 'team:backend', config: { target: 'b' } });

  expect(await bo.call('x-ahpd/connectors/put', {
    id: 'theirs', kind: 'webhook', owner: 'user:bo', config: { target: 'c' },
  })).toMatchObject({ code: -32009 });
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'team', kind: 'webhook', owner: 'host', config: { target: 'c' },
  })).toMatchObject({ code: -32009 });
  expect(opened.map((one) => [one.id, one.owner])).toEqual([['theirs', 'user:di'], ['team', 'team:backend']]);
  await close();
});

it('takes the old owner\'s secrets out of the vault when a connector changes hands', async () => {
  const { host, users, vault, close } = await served();
  const di = await as(host, users, 'di');
  await di.call('x-ahpd/connectors/put', {
    id: 'moved', kind: 'webhook', owner: 'user:di', config: { target: 'a', secret: 'old-value' },
  });
  expect([...vault.held.keys()]).toEqual(['user:di/connector/moved/secret']);

  expect(await di.call('x-ahpd/connectors/put', {
    id: 'moved', kind: 'webhook', owner: 'team:backend', config: { target: 'a', secret: 'new-value' },
  })).toMatchObject({ result: { owner: 'team:backend' } });
  expect([...vault.held.keys()]).toEqual(['team:backend/connector/moved/secret']);
  await close();
});

it('makes a team connector with team:write and a membership, and the member reads it', async () => {
  const { host, users, close } = await served();
  const di = await as(host, users, 'di');

  expect(await di.call('x-ahpd/connectors/put', {
    id: 'team', kind: 'webhook', owner: 'team:backend', config: { target: 'a' },
  })).toMatchObject({ result: { state: 'open' } });
  expect(Object.keys(await di.rows())).toEqual(['team']);
  await close();
});

it('refuses a team connector to a member without team:write', async () => {
  const { host, users, close } = await served();
  const el = await as(host, users, 'el');

  expect(await el.call('x-ahpd/connectors/put', {
    id: 'team', kind: 'webhook', owner: 'team:backend', config: { target: 'a' },
  })).toMatchObject({ code: -32009 });
  await close();
});

it('reads every row with connector:read, and refuses a role holding only config:read', async () => {
  const { host, users, close } = await served();
  const cy = await as(host, users, 'cy');
  await cy.call('x-ahpd/connectors/put', { id: 'shared', kind: 'webhook', owner: 'host', config: { target: 'a' } });
  await cy.call('x-ahpd/connectors/put', { id: 'mine', kind: 'webhook', owner: 'user:cy', config: { target: 'b' } });

  // The grant reads the listing whole: a kind's row, a host's, and someone else's.
  const ana = await as(host, users, 'ana');
  expect(Object.keys(await ana.rows())).toEqual(['kind:webhook', 'mine', 'shared']);

  // `config:read` used to read this channel, and no longer does.
  const fa = await as(host, users, 'fa');
  expect(await fa.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  await close();
});

it('makes a host connector with connector:put, and refuses a role holding only config:write', async () => {
  const { host, users, closed, close } = await served();
  const ha = await as(host, users, 'ha');

  expect(await ha.call('x-ahpd/connectors/put', {
    id: 'shared', kind: 'webhook', owner: 'host', config: { target: 'a' },
  })).toMatchObject({ result: { id: 'shared', owner: 'host', state: 'open' } });
  // Making one is not removing it, which takes its own grant.
  expect(await ha.call('x-ahpd/connectors/remove', { id: 'shared' })).toMatchObject({ code: -32009 });
  // Moving it to themselves takes it from the host, which is a remove too.
  expect(await ha.call('x-ahpd/connectors/put', {
    id: 'shared', kind: 'webhook', owner: 'user:ha', config: { target: 'b' },
  })).toMatchObject({ code: -32009 });
  expect(closed).toEqual([]);

  const gi = await as(host, users, 'gi');
  expect(await gi.call('x-ahpd/connectors/put', {
    id: 'other', kind: 'webhook', owner: 'host', config: { target: 'a' },
  })).toMatchObject({ code: -32009 });
  await close();
});

it('advertises plugin and connector in the handshake, beside the built-ins', async () => {
  const { host, users, close } = await served();
  const bo = await as(host, users, 'bo');
  const grants = bo.ready['_meta']?.['ahpd.grants'] as Bag;

  expect(grants['plugin']).toEqual({
    title: 'Plugins',
    description: expect.any(String),
    operations: ['list', 'enable', 'disable', 'options'],
    groups: { read: ['list'], write: ['enable', 'disable', 'options'] },
  });
  expect(grants['connector']).toEqual({
    title: 'Connectors',
    description: expect.any(String),
    operations: ['list', 'put', 'remove'],
    groups: { read: ['list'], write: ['put', 'remove'] },
  });
  await close();
});

it('refuses a config the kind\'s schema refuses, and an unregistered kind', async () => {
  const { host, users, collection, opened, close } = await served();
  const cy = await as(host, users, 'cy');

  expect(await cy.call('x-ahpd/connectors/put', { id: 'ci', kind: 'webhook', owner: 'user:cy', config: {} }))
    .toMatchObject({ code: -32602, message: 'connector ci.target is required' });
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'webhook', owner: 'user:cy', config: { target: 'a', extra: true },
  })).toMatchObject({ code: -32602 });
  expect(await cy.call('x-ahpd/connectors/put', {
    id: 'ci', kind: 'ghost', owner: 'user:cy', config: { target: 'a' },
  })).toMatchObject({ code: -32602 });
  expect(await collection.list()).toEqual([]);
  expect(opened).toEqual([]);
  await close();
});
