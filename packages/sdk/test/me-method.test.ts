/*
 * `x-ahpd/me`, which answers a connection who it is.
 *
 * Every reader may ask, a minted token too, because the answer is only ever
 * about the caller. The root connection is answered from its owner, and a
 * connection that names nobody is refused.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, expect, it } from 'vitest';
import { meMethods } from '../src/access/me.js';
import { fileUsers } from '../src/access/users.js';
import { call, hello, host, peer, root, signIn } from './users-gate-helpers.js';
import type { ServedMethod } from '../src/types/plugin.js';
import type { Issuer, Me, MintedToken, Principal, Users } from '../src/types/users.js';

/** A role that reads sessions, and one that adds the proxy, for the claim to name. */
const ROLES = {
  member: ['session:list', 'session:read'],
  operators: ['proxy:read'],
};

let path: string;
let people: Users;
let secrets: Record<string, string>;

/** An issuer that answers one token for ana, with a `groups` claim. */
const claiming: Issuer = {
  id: 'https://idp.test',
  scopes: ['openid'],
  who: async (token) => token === 'at-1' ? { subject: 'ana', claims: { groups: ['operators'] } } : undefined,
};

beforeEach(async () => {
  path = join(root, 'users.json');
  writeFileSync(path, JSON.stringify({
    roles: ROLES,
    teams: [{ id: 'core' }],
    users: [{ id: 'ana', roles: ['member'], token: '', issuer: 'https://idp.test', rolesFrom: 'groups' }],
  }));
  people = fileUsers({ path, issuerFor: () => claiming });
  await people.add('bob', ['member'], { memberships: ['core'], primary: 'core' });
  secrets = { bob: await people.mint('bob') };
});

/** The one command, as the gate would call it after admitting the reader. */
const ask = (reader: Principal | undefined, owner?: string) =>
  meMethods(people)['x-ahpd/me']!.handle({}, reader, 'probe', owner as never) as Promise<Me>;

/** The command served by a host, as the daemon registers it. */
const served = (): Record<string, ServedMethod> =>
  Object.fromEntries(Object.entries(meMethods(people)).map(([name, method]) => [name, { by: 'ahpd', name, method }]));

it('lets a member without user:get ask who they are', async () => {
  const method = meMethods(people)['x-ahpd/me']!;
  const bob = (await people.verify(secrets['bob']!))!;
  expect(bob.can('user:get')).toBe(false);
  expect(method.grant).toBe('user:get');
  expect(await method.authorize!({}, bob)).toBe(true);

  const made = host({ users: people, methods: served() });
  const client = made.accept(peer());
  await hello(client, 'bob');
  await signIn(client, secrets['bob']!);
  const answered = await call(client, 'x-ahpd/me', {}) as { result: Me };
  expect(answered.result).toMatchObject({ principal: 'user:bob', kind: 'user', id: 'bob', roles: ['member'] });
  await made.close();
});

it('answers the roles a sign-in added apart, and their grants with the rest', async () => {
  const ana = (await people.verify('at-1'))!;
  const me = await ask(ana);
  expect(me.roles).toEqual(['member', 'operators']);
  expect(me.rolesFromSignIn).toEqual(['operators']);
  expect(me.grants).toEqual(expect.arrayContaining(['session:list', 'session:read', 'proxy:read']));
  expect(me).toMatchObject({ issuer: 'https://idp.test', rolesFrom: 'groups' });
  expect(me).not.toHaveProperty('token');
});

it('narrows a minted token to its own grants, and names it', async () => {
  const minted = await people.mintToken!('bob', { grants: ['session:list'] }) as MintedToken;
  const token = (await people.verify(minted.secret))!;
  const me = await ask(token);
  expect(me.grants).toEqual(['session:list']);
  expect(me.token).toBe(minted.id);
  expect(me.rolesFromSignIn).toEqual([]);
});

it('names a person\'s own pool and their team\'s', async () => {
  const bob = (await people.verify(secrets['bob']!))!;
  const me = await ask(bob);
  expect(me.pools).toEqual(['user:bob', 'team:core']);
  expect(me).toMatchObject({ memberships: ['core'], primary: 'core' });
  expect(me).not.toHaveProperty('issuer');
});

it('answers the root connection from its owner', async () => {
  expect(await ask(undefined, 'root:builder')).toEqual({
    principal: 'root:builder',
    kind: 'root',
    roles: [],
    rolesFromSignIn: [],
    grants: ['*:*'],
    pools: ['root:builder'],
  });

  const made = host({ users: people, methods: served() });
  const door = made.accept(peer(), undefined, true);
  await hello(door, 'root');
  const answered = await call(door, 'x-ahpd/me', {}) as { result: Me };
  expect(answered.result).toMatchObject({ kind: 'root', roles: [], grants: ['*:*'] });
  expect(answered.result.principal).toMatch(/^root:/);
  expect(answered.result.pools).toEqual([answered.result.principal]);
  await made.close();
});

it('refuses a connection that names nobody with -32007', async () => {
  await expect(ask(undefined)).rejects.toMatchObject({ code: -32007 });
});

it('is advertised on initialize with its grant', async () => {
  const made = host({ users: people, methods: served() });
  const client = made.accept(peer());
  const ready = await hello(client, 'bob') as { _meta?: Record<string, unknown> };
  const entries = (ready._meta?.['ahpd.methods'] ?? []) as { method: string; grant: string }[];
  expect(entries.find((one) => one.method === 'x-ahpd/me')).toMatchObject({ method: 'x-ahpd/me', grant: 'user:get' });
  await made.close();
});
