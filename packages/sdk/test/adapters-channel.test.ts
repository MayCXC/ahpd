import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { adaptersChannel } from '../src/connectors/adapters.js';
import { createHost } from '../src/host.js';
import { fileUsers } from '../src/access/users.js';
import { fileResources } from '../src/resources/resources.js';
import { servedRecords } from '../src/resources/recordschannel.js';
import { echo } from '../../../examples/echo/agent.js';
import type { ServedAdapter } from '../src/types/connectors.js';
import type { Users } from '../src/types/users.js';

/*
 * The adapters channel over a fold that holds two adapters.
 *
 * The channel is read-only and needs `connector:list`; it lists what the
 * plugins registered before any connector exists, keyed by the adapter's name.
 */

const URI = 'x-ahpd-adapters://';
const ROOT = 'ahp-root://';

type Bag = Record<string, any>;

const WEBHOOK: ServedAdapter = {
  name: 'webhook',
  title: 'Webhook',
  description: 'A URL that talks to a bot or fires an automation.',
  by: 'webhook',
  schema: { type: 'object', properties: { secret: { type: 'string', writeOnly: true } }, required: ['secret'] },
  capabilities: [{ type: 'receive', name: 'calls', title: 'Receives calls', description: 'Answers a POST.' }],
  open: () => {},
};

const MAIL: ServedAdapter = {
  name: 'mail',
  title: 'Mail',
  description: 'A mailbox that sends and receives.',
  by: 'mail',
  schema: { type: 'object', properties: {}, additionalProperties: false },
  capabilities: [],
  open: () => {},
};

let home: string;
let usersFile: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-adapters-'));
  usersFile = join(home, 'users.json');
  writeFileSync(usersFile, JSON.stringify({
    roles: {
      lister: ['connector:list'],
      'config-reader': ['config:read'],
    },
    users: [
      { id: 'ana', roles: ['lister'] },
      { id: 'bo', roles: [] },
      { id: 'fa', roles: ['config-reader'] },
    ],
  }));
});
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

type Host = ReturnType<typeof createHost>;

/** A host serving the adapters channel over two adapters, and no connector. */
async function served() {
  const adapters: Record<string, ServedAdapter> = { webhook: WEBHOOK, mail: MAIL };
  const lists = adaptersChannel({ adapters: () => adapters });
  const wire = servedRecords('ahpd', [lists.channel], {});
  const users = fileUsers({ path: usersFile });
  const host = createHost({
    path: home,
    agents: [{ ...echo({ path: home, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    channels: wire.channels,
    methods: wire.methods,
    users,
  });
  return { host, users, adapters, close: async () => { await host.close(); } };
}

/** A client signed in as `id`. */
const as = async (host: Host, users: Users, id: string) => {
  const token = await users.mint(id);
  const client = host.accept({
    send: () => {}, request: async () => ({}), answered: () => {}, close: () => {}, notify: () => {},
  });
  await client.handle({
    method: 'initialize', params: { clientId: id, protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  await client.handle({ method: 'authenticate', params: { channel: ROOT, resource: users.resource.resource, token } });
  const call = async (method: string, params: Bag) => client.handle({ method, params }).then(
    (result) => ({ result: result as Bag }),
    (error: { code: number; message: string }) => ({ code: error.code, message: error.message }),
  );
  /** Every row a subscribe to the adapters channel answered, by id. */
  const rows = async (): Promise<Record<string, Bag>> => {
    const answer = await call('subscribe', { channel: URI }) as Bag;
    if (answer['result'] === undefined) throw new Error(`subscribe refused: ${JSON.stringify(answer)}`);
    const records = (answer['result'] as Bag)['snapshot'].state.records as { id: string; record: Bag }[];
    return Object.fromEntries(records.map((one) => [one.id, one.record]));
  };
  return { call, rows, close: () => { client.close(); } };
};

it('lists every adapter by name with connector:list, before any connector exists', async () => {
  const { host, users, close } = await served();
  const ana = await as(host, users, 'ana');

  const rows = await ana.rows();
  expect(Object.keys(rows)).toEqual(['mail', 'webhook']);
  expect(rows['webhook']).toEqual({
    name: 'webhook',
    title: 'Webhook',
    description: 'A URL that talks to a bot or fires an automation.',
    schema: WEBHOOK.schema,
    capabilities: WEBHOOK.capabilities,
    plugin: 'webhook',
  });
  await close();
});

it('refuses a role without connector:list, config:read included', async () => {
  const { host, users, close } = await served();
  const bo = await as(host, users, 'bo');
  expect(await bo.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });

  const fa = await as(host, users, 'fa');
  expect(await fa.call('subscribe', { channel: URI })).toMatchObject({ code: -32009 });
  await close();
});
