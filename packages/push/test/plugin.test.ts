import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { apply } from '../src/plugin.js';
import { ENDPOINT } from '../src/send.js';
import type { EventHandler, EventName, HostEventOf } from '../../sdk/src/types/events.js';
import type { PluginHost } from '../../sdk/src/types/plugin.js';
import type { Owner } from '../../sdk/src/types/usage.js';

/*
 * Which devices the plugin picks for a session.
 *
 * A device is a row in a file written before `apply` runs, and `host.sessionOwner`
 * is a map the host answers from, because that is the whole of what the plugin
 * asks the host to know a session's person. The service is a stub, so what a
 * case reads is the token of every device that was sent to.
 */

/** A temporary directory removed after the test that made it. */
let loose: string | undefined;
afterEach(() => {
  vi.unstubAllGlobals();
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});

/** One host, as a plugin sees it: the handlers it registers, and the owners it answers. */
interface Node {
  host: PluginHost;
  fire<K extends EventName>(event: HostEventOf<K>): Promise<void>;
}

const node = (configDir: string, owners: Map<string, Owner>): Node => {
  const handlers = new Map<EventName, EventHandler[]>();
  const host = {
    path: configDir,
    paths: [configDir],
    version: '0.10.0',
    hostName: 'Echo',
    configDir,
    log: () => {},
    say: () => {},
    problem: () => {},
    secret: async () => { throw new Error('the vault holds nothing'); },
    on: (event: EventName, handler: EventHandler) => {
      const held = handlers.get(event);
      if (held === undefined) handlers.set(event, [handler]);
      else held.push(handler);
    },
    registerResourceProvider: () => {},
    sessionOwner: async (uri: string) => owners.get(uri),
  } as unknown as PluginHost;
  return {
    host,
    fire: async (event) => {
      for (const handler of handlers.get(event.type) ?? []) await handler(event, host);
    },
  };
};

/** A service that takes every message, and the tokens it was sent. */
const service = () => {
  const sent: { to: string }[] = [];
  const request = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const body: unknown = JSON.parse(String(init?.body ?? 'null'));
    const answer = url === ENDPOINT
      ? { data: (body as unknown[]).map((_one, index) => ({ status: 'ok', id: `ticket-${index}` })) }
      : { data: {} };
    if (url === ENDPOINT) sent.push(...(body as { to: string }[]));
    return new Response(JSON.stringify(answer), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { sent, request };
};

/** The plugin, over a devices file and a map of the host's owners. */
const up = (
  said: Record<string, Record<string, unknown>>,
  owners: Map<string, Owner>,
): Node & { sent: { to: string }[] } => {
  const dir = (loose ??= mkdtempSync(join(tmpdir(), 'ahpd-push-audience-')));
  writeFileSync(join(dir, 'push-devices.json'), JSON.stringify(said, null, 2));
  const { sent, request } = service();
  vi.stubGlobal('fetch', request);
  const made = node(dir, owners);
  apply(made.host, {});
  return { ...made, sent };
};

/** The session, waiting on one request. */
const waiting = async (world: Node, session: string, id: string): Promise<void> =>
  world.fire({ type: 'input_needed_set', session, chat: `${session}/chat`, id, kind: 'chatInput' } as HostEventOf<'input_needed_set'>);

it('a person device hears a session another client of its person created', async () => {
  const world = up(
    { 'phone-1': { token: 'ExponentPushToken[phone]', platform: 'ios', client: 'phone', owner: 'user:ana' } },
    new Map([['echo:/one', 'user:ana']]),
  );
  // No audience set, which is a person device by default.
  await world.fire({ type: 'session_start', session: 'echo:/one', provider: 'echo', client: 'laptop' });
  await waiting(world, 'echo:/one', 'q1');
  expect(world.sent.map((one) => one.to)).toEqual(['ExponentPushToken[phone]']);
});

it('a device set to device does not hear a session another client of its person created', async () => {
  const world = up(
    { 'phone-1': { token: 'ExponentPushToken[phone]', platform: 'ios', client: 'phone', owner: 'user:ana', audience: 'device' } },
    new Map([['echo:/one', 'user:ana'], ['echo:/two', 'user:ana']]),
  );
  await world.fire({ type: 'session_start', session: 'echo:/one', provider: 'echo', client: 'laptop' });
  await waiting(world, 'echo:/one', 'q1');
  expect(world.sent).toEqual([]);

  // The sessions its own client opened still reach it.
  await world.fire({ type: 'session_start', session: 'echo:/two', provider: 'echo', client: 'phone' });
  await waiting(world, 'echo:/two', 'q2');
  expect(world.sent.map((one) => one.to)).toEqual(['ExponentPushToken[phone]']);
});

it('a device with no person hears only the sessions its own client opened', async () => {
  const world = up(
    { 'phone-1': { token: 'ExponentPushToken[phone]', platform: 'ios', client: 'phone', audience: 'person' } },
    new Map([['echo:/one', 'user:ana'], ['echo:/two', 'user:ana']]),
  );
  await world.fire({ type: 'session_start', session: 'echo:/one', provider: 'echo', client: 'laptop' });
  await waiting(world, 'echo:/one', 'q1');
  expect(world.sent).toEqual([]);

  await world.fire({ type: 'session_start', session: 'echo:/two', provider: 'echo', client: 'phone' });
  await waiting(world, 'echo:/two', 'q2');
  expect(world.sent.map((one) => one.to)).toEqual(['ExponentPushToken[phone]']);
});
