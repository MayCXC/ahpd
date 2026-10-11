import { expect, it } from 'vitest';
import { recordsProvider } from '../src/records.js';
import { recordsChannel, recordsDomain, recordsMethods } from '../src/recordschannel.js';
import { RpcError } from '../src/rpc.js';
import { holds } from '../src/users.js';
import type { Records } from '../src/records.js';
import type { ChannelHandle, ChannelSubscriber, PublishOptions } from '../src/types/plugin.js';
import type { Grant, Principal } from '../src/types/users.js';

/*
 * A records channel over an in-memory store: each case subscribes readers
 * through `snapshot`, changes the store, calls `refresh`, and reads what each
 * client was sent. The handle stands in for the host: it lists the subscribers
 * and keeps each publish with the client it was sent to.
 */

const SCHEME = 'x-ahpd-teams';
const URI = `${SCHEME}://`;

/** A store of teams, each `{ title }`, that a case edits in place. */
const store = (rows: Record<string, Record<string, unknown>> = {}): Records & { rows: Record<string, Record<string, unknown>> } => ({
  rows,
  title: 'Teams',
  description: 'Teams people belong to.',
  manifest: { type: 'object' },
  ids: async () => Object.keys(rows),
  find: async (id) => (rows[id] === undefined ? undefined : { ...rows[id] }),
  put: async (id, body) => {
    if (typeof body.title === 'number') throw new RpcError(-32602, 'A team is written with title as text');
    rows[id] = { ...rows[id], ...body };
  },
  drop: async (id) => {
    if (rows[id] === undefined) return false;
    delete rows[id];
    return true;
  },
});

/** A reader holding these grants, which a case may change. */
const person = (id: string, grants: Grant[]): Principal & { grants: Grant[] } => {
  const one = {
    id,
    roles: ['r'],
    grants,
    can: (grant: Grant) => holds(new Set<string>(one.grants), grant),
  };
  return one;
};

/** A handle with these subscribers, and every publish it was handed. */
const fakeHandle = (subscribers: ChannelSubscriber[]) => {
  const heard: { client: string | undefined; action: Record<string, unknown> }[] = [];
  const handle: ChannelHandle = {
    publish: (uri, action, options: PublishOptions = {}) => {
      expect(uri).toBe(URI);
      heard.push({ client: options.to, action });
    },
    subscribers: () => subscribers,
  };
  /** What one client was sent, as `type id` lines. */
  const of = (client: string): string[] => heard
    .filter((one) => one.client === client)
    .map((one) => `${String(one.action.type).slice(SCHEME.length + 1)} ${String(one.action.id)}`);
  return { handle, heard, of };
};

it('answers each reader a snapshot of the records they may read', async () => {
  const teams = store({ backend: { id: 'backend', title: 'Back' }, web: { id: 'web' } });
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read', mayRead: (id, reader) => id === reader.id });
  const ana = person('ana', ['team:read']);
  const web = person('web', []);
  expect(await list.channel.snapshot(URI, ana, 'ana')).toEqual({
    records: [{ id: 'backend', record: { id: 'backend', title: 'Back' } }, { id: 'web', record: { id: 'web' } }],
  });
  // Without the grant, only what `mayRead` lets in.
  expect(await list.channel.snapshot(URI, web, 'web')).toEqual({ records: [{ id: 'web', record: { id: 'web' } }] });
  // Nobody is a host with no users directory, or the root connection.
  expect(await list.channel.snapshot(URI, undefined, 'root')).toMatchObject({ records: [{ id: 'backend' }, { id: 'web' }] });
  await expect(list.channel.snapshot(`${URI}x`, ana, 'ana')).rejects.toMatchObject({ code: -32001 });
});

it('lets in a reader without the grant only when mayRead holds for a record', async () => {
  const teams = store({ backend: { id: 'backend' } });
  const own = recordsChannel(SCHEME, teams, { grant: 'team:read', mayRead: (id, reader) => id === reader.id });
  expect(await own.channel.authorize?.(URI, person('backend', []))).toBe(true);
  expect(await own.channel.authorize?.(URI, person('ana', []))).toBe(false);
  expect(await own.channel.authorize?.(`${URI}other`, person('backend', []))).toBe(false);
  const plain = recordsChannel(SCHEME, teams, { grant: 'team:read' });
  expect(await plain.channel.authorize?.(URI, person('backend', []))).toBe(false);
});

it('sends added, changed and removed after a refresh, each to the client it concerns', async () => {
  const teams = store({ backend: { id: 'backend' } });
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read', mayRead: (id, reader) => id === reader.id });
  const ana = person('ana', ['team:read']);
  const web = person('web', []);
  const { handle, of } = fakeHandle([{ client: 'ana', reader: ana }, { client: 'web', reader: web }]);
  list.bind(handle);
  await list.channel.snapshot(URI, ana, 'ana');
  await list.channel.snapshot(URI, web, 'web');

  teams.rows.web = { id: 'web' };
  await list.refresh();
  expect(of('ana')).toEqual(['added web']);
  expect(of('web')).toEqual(['added web']);

  teams.rows.backend = { id: 'backend', title: 'Back' };
  await list.refresh();
  // `web` cannot read backend, so is told nothing of its edit.
  expect(of('ana')).toEqual(['added web', 'changed backend']);
  expect(of('web')).toEqual(['added web']);

  delete teams.rows.web;
  await list.refresh();
  expect(of('ana')).toEqual(['added web', 'changed backend', 'removed web']);
  expect(of('web')).toEqual(['added web', 'removed web']);
});

it('carries the record with added and changed, and the id alone with removed', async () => {
  const teams = store({});
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read' });
  const { handle, heard } = fakeHandle([{ client: 'root', reader: undefined }]);
  list.bind(handle);
  await list.channel.snapshot(URI, undefined, 'root');
  teams.rows.backend = { id: 'backend' };
  await list.refresh();
  teams.rows.backend = { id: 'backend', title: 'Back' };
  await list.refresh();
  delete teams.rows.backend;
  await list.refresh();
  expect(heard.map((one) => one.action)).toEqual([
    { type: `${SCHEME}/added`, id: 'backend', record: { id: 'backend' } },
    { type: `${SCHEME}/changed`, id: 'backend', record: { id: 'backend', title: 'Back' } },
    { type: `${SCHEME}/removed`, id: 'backend' },
  ]);
  expect(heard.every((one) => one.client === 'root')).toBe(true);
});

it('sends removed for each record to a reader who lost the grant', async () => {
  const teams = store({ backend: { id: 'backend' }, web: { id: 'web' } });
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read' });
  const ana = person('ana', ['team:read']);
  const { handle, of } = fakeHandle([{ client: 'ana', reader: ana }]);
  list.bind(handle);
  await list.channel.snapshot(URI, ana, 'ana');
  ana.grants = [];
  await list.refresh();
  expect(of('ana')).toEqual(['removed backend', 'removed web']);
  // And an edit made after is not sent to them.
  teams.rows.backend = { id: 'backend', title: 'Back' };
  teams.rows.mobile = { id: 'mobile' };
  await list.refresh();
  expect(of('ana')).toEqual(['removed backend', 'removed web']);
});

it('sends nothing when nothing differs', async () => {
  const teams = store({ backend: { id: 'backend' } });
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read' });
  const ana = person('ana', ['team:read']);
  const { handle, heard } = fakeHandle([{ client: 'ana', reader: ana }]);
  list.bind(handle);
  await list.channel.snapshot(URI, ana, 'ana');
  teams.rows.web = { id: 'web' };
  await list.refresh();
  expect(heard).toHaveLength(1);
  await list.refresh();
  expect(heard).toHaveLength(1);
});

it('forgets a client at left, and starts it again from the next refresh', async () => {
  const teams = store({ backend: { id: 'backend' } });
  const list = recordsChannel(SCHEME, teams, { grant: 'team:read' });
  const ana = person('ana', ['team:read']);
  const { handle, heard } = fakeHandle([{ client: 'ana', reader: ana }]);
  list.bind(handle);
  await list.channel.snapshot(URI, ana, 'ana');
  list.channel.left?.('ana');
  teams.rows.web = { id: 'web' };
  await list.refresh();
  expect(heard).toEqual([]);
});

it('says a store it cannot read, and keeps refreshing after', async () => {
  const said: string[] = [];
  const teams = store({});
  let broken = true;
  const list = recordsChannel(SCHEME, {
    ids: async () => { if (broken) throw new Error('the file is not JSON'); return teams.ids(); },
    find: teams.find,
  }, { grant: 'team:read', onProblem: (line) => { said.push(line); } });
  list.bind(fakeHandle([{ client: 'ana', reader: person('ana', ['team:read']) }]).handle);
  await list.refresh();
  expect(said).toEqual([`${SCHEME}: the list could not be read: the file is not JSON`]);
  broken = false;
  await list.refresh();
  expect(said).toHaveLength(1);
});

it('reads nothing while nobody is subscribed', async () => {
  let asked = 0;
  const teams = store({ backend: { id: 'backend' } });
  const list = recordsChannel(SCHEME, { ids: async () => { asked += 1; return teams.ids(); }, find: teams.find }, { grant: 'team:read' });
  await list.refresh();
  list.bind(fakeHandle([]).handle);
  await list.refresh();
  expect(asked).toBe(0);
});

/** One method's answer, or the RpcError it threw. */
const answer = async (method: { handle: (params: Record<string, unknown>, reader: Principal | undefined, client: string) => unknown }, params: Record<string, unknown>) => {
  try {
    return { result: await method.handle(params, undefined, 'ana') };
  }
  catch (error) {
    return { code: (error as RpcError).code, message: (error as RpcError).message };
  }
};

it('names put and remove by domain, with the scheme\'s put and delete grants', () => {
  const methods = recordsMethods('teams', 'team', store(), async () => {});
  expect(Object.keys(methods)).toEqual(['x-ahpd/teams/put', 'x-ahpd/teams/remove']);
  expect(methods['x-ahpd/teams/put']?.grant).toBe('team:put');
  expect(methods['x-ahpd/teams/remove']?.grant).toBe('team:delete');
  // Neither lets in a caller without the grant.
  expect(methods['x-ahpd/teams/put']?.authorize).toBeUndefined();
  expect(methods['x-ahpd/teams/remove']?.authorize).toBeUndefined();
});

it('puts and removes a record by command, and refreshes after each', async () => {
  const teams = store();
  let refreshed = 0;
  const methods = recordsMethods('teams', 'team', teams, async () => { refreshed += 1; });
  const put = methods['x-ahpd/teams/put']!;
  const remove = methods['x-ahpd/teams/remove']!;
  expect(await answer(put, { id: 'backend', record: { title: 'Back' } })).toEqual({ result: {} });
  expect(teams.rows.backend).toEqual({ title: 'Back' });
  expect(refreshed).toBe(1);
  expect(await answer(remove, { id: 'backend' })).toEqual({ result: {} });
  expect(teams.rows.backend).toBeUndefined();
  expect(refreshed).toBe(2);
});

it('refuses with the sentence a resource write and delete give', async () => {
  const teams = store({ backend: { title: 'Back' } });
  const provider = recordsProvider('team', teams);
  const methods = recordsMethods('teams', 'team', teams, async () => {});
  const put = methods['x-ahpd/teams/put']!;
  const remove = methods['x-ahpd/teams/remove']!;
  const write = async (uri: string, data: unknown, createOnly?: boolean) => {
    try {
      await provider.write(uri, { data: JSON.stringify(data), encoding: 'utf-8', ...(createOnly === undefined ? {} : { createOnly }) });
      return {};
    }
    catch (error) {
      return { code: (error as RpcError).code, message: (error as RpcError).message };
    }
  };
  // A body the store refuses.
  expect(await answer(put, { id: 'web', record: { title: 7 } })).toEqual(await write('team://web', { title: 7 }));
  // An id already there, with createOnly.
  const taken = await answer(put, { id: 'backend', record: {}, createOnly: true });
  expect(taken).toEqual({ code: -32010, message: 'backend is already a team; edit it or choose another id' });
  expect(taken).toEqual(await write('team://backend', {}, true));
  // A record that is not an object.
  expect(await answer(put, { id: 'web', record: [1] })).toEqual(await write('team://web', [1]));
  // An id nothing holds.
  const gone = await answer(remove, { id: 'nobody' });
  expect(gone).toEqual({ code: -32008, message: 'No team resource at team://nobody' });
  await expect(provider.remove('team://nobody')).rejects.toMatchObject(gone);
});

it('refuses a missing id, an id no URI could name, a missing record and a createOnly that is not a boolean', async () => {
  const methods = recordsMethods('teams', 'team', store(), async () => {});
  const put = methods['x-ahpd/teams/put']!;
  expect(await answer(put, { record: {} })).toMatchObject({ code: -32602, message: 'x-ahpd/teams/put needs id, the team\'s id, with no / or ?' });
  expect(await answer(put, { id: 'a/b', record: {} })).toMatchObject({ code: -32602 });
  expect(await answer(put, { id: 'a?b', record: {} })).toMatchObject({ code: -32602 });
  expect(await answer(put, { id: 'web' })).toMatchObject({ code: -32602, message: 'A team is made from a JSON object, and that body is not one' });
  expect(await answer(put, { id: 'web', record: {}, createOnly: 'yes' })).toMatchObject({ code: -32602, message: 'x-ahpd/teams/put takes createOnly as true or false' });
  expect(await answer(methods['x-ahpd/teams/remove']!, {})).toMatchObject({ code: -32602 });
});

it('calls changed after a resource write and remove, and not after a refusal', async () => {
  const teams = store();
  let changed = 0;
  const provider = recordsProvider('team', teams, () => { changed += 1; });
  await provider.write('team://backend', { data: '{}', encoding: 'utf-8' });
  expect(changed).toBe(1);
  await provider.remove('team://backend');
  expect(changed).toBe(2);
  await expect(provider.remove('team://backend')).rejects.toMatchObject({ code: -32008 });
  await expect(provider.write('team://web', { data: '{"title":7}', encoding: 'utf-8' })).rejects.toMatchObject({ code: -32602 });
  expect(changed).toBe(2);
});

it('refreshes the channel after a write through the domain\'s provider and its command', async () => {
  const teams = store();
  const domain = recordsDomain('teams', 'team', teams);
  expect(domain.channel.scheme).toBe('x-ahpd-teams');
  expect(domain.channel.channel.grant).toBe('team:read');
  const { handle, of } = fakeHandle([{ client: 'root', reader: undefined }]);
  domain.channel.bind(handle);
  await domain.channel.channel.snapshot(URI, undefined, 'root');
  await domain.provider.write('team://backend', { data: '{}', encoding: 'utf-8' });
  await domain.channel.refresh();
  expect(of('root')).toEqual(['added backend']);
  await domain.methods['x-ahpd/teams/put']!.handle({ id: 'web', record: {} }, undefined, 'root');
  expect(of('root')).toEqual(['added backend', 'added web']);
});
