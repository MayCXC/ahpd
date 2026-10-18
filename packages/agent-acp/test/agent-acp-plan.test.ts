import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { uriOf } from '@ahpd/sdk';
import { createHost } from '../../sdk/src/host.js';
import { foldHostOptions, pluginHost } from '../../sdk/src/plugins.js';
import { sdkVersion } from '../../sdk/src/version.js';
import { shellTerminals } from '../../sdk/src/terminals.js';
import { acpAgent } from '../src/index.js';
import { anyone, signIn } from './people.js';
import type { PlanUpdateEvent } from '../../sdk/src/types/events.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';
import type { Peer } from '../../sdk/src/types/rpc.js';

/*
 * A plan written by an ACP server, as the host hears it.
 *
 * The server is the real subprocess (`test/fixtures/acp-server.mjs`), and a
 * prompt containing `plan` is the script that sends two plan updates over one
 * turn, the second with the entries' statuses moved on. What is under test is
 * the seam: each update reaches a `plan_update` listener as the whole list,
 * with the tool `plan`, while the turn keeps the one Plan call it drew before.
 */

const FIXTURE = fileURLToPath(new URL('./fixtures/acp-server.mjs', import.meta.url));

function peer(): Peer & { notes: { method: string; params: unknown }[] } {
  const notes: { method: string; params: unknown }[] = [];
  return {
    notes,
    send: () => {},
    notify: (method, params) => notes.push({ method, params }),
    request: async () => ({}),
    answered: () => {},
    close: async () => {},
  };
}

/** Let the subprocess's work finish, up to a point; the fixture never sleeps. */
const until = async (check: () => boolean, times = 2000): Promise<void> => {
  for (let i = 0; i < times; i++) {
    if (check()) return;
    await new Promise((r) => { setTimeout(r, 1); });
  }
};

type Note = { channel: string; action: Record<string, unknown> };

const actions = (p: ReturnType<typeof peer>, channel: string): Note[] => p.notes
  .filter((n) => n.method === 'action')
  .map((n) => n.params as Note)
  .filter((e) => e.channel === channel);

/**
 * The types of the actions on one channel, in order.
 *
 * Without `chat/isReadChanged`, which the host sends after a turn's ending and
 * which says what a person has seen rather than what the turn did.
 */
const types = (p: ReturnType<typeof peer>, channel: string): string[] =>
  actions(p, channel).map((e) => String(e.action.type)).filter((type) => type !== 'chat/isReadChanged');

/** Whether the chat has ended at least this many turns, one per `begin`. */
const finished = (p: ReturnType<typeof peer>, chatUri: string, turns: number): boolean =>
  types(p, chatUri).filter((type) => type === 'chat/turnComplete' || type === 'chat/turnCancelled').length >= turns;

/** What a plugin is handed, without the YAML the daemon would give it. */
const context = (path: string): LoaderContext => ({
  path, paths: [path], version: sdkVersion(), hostName: 'test', configDir: path, log: () => {}, say: () => {},
});

/** A connected client with one ACP session, and a plugin hearing `plan_update`. */
async function planning() {
  const path = mkdtempSync(join(tmpdir(), 'ahpd-acp-plan-'));
  const heard: PlanUpdateEvent[] = [];
  const probe = pluginHost('probe', context(path));
  probe.host.on('plan_update', (event) => { heard.push(event); });
  const { options } = foldHostOptions({
    path,
    agents: [acpAgent({ command: process.execPath, args: [FIXTURE], provider: 'acp' })],
    // The composer's `!` prefix is the host's shell, so the host has to hold one.
    terminals: shellTerminals(),
    // And somebody for this window to be, without whom its session has no owner
    // and so no folder it can be told is trusted.
    users: anyone(),
  }, [probe.contribution]);
  const host = createHost(options);
  const p = peer();
  const client = host.accept(p);
  await client.handle({
    method: 'initialize',
    params: { clientId: 'probe', protocolVersions: ['0.9.0'], initialSubscriptions: ['ahp-root://'] },
  });
  await signIn(client);
  const uri = 'ahp-session:/one';
  // The window says which folders it trusts, and a session of a folder nobody
  // vouched for is refused rather than started.
  await client.handle({
    method: 'dispatchAction',
    params: {
      channel: 'ahp-root://',
      action: { type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: [uriOf(path)] } } },
    },
  });
  await client.handle({
    method: 'createSession',
    params: { channel: uri, provider: 'acp', workingDirectories: [`file://${path}`] },
  });
  const chatUri = ((await client.handle({ method: 'subscribe', params: { channel: uri } })) as {
    snapshot: { state: { defaultChat: string } };
  }).snapshot.state.defaultChat;
  await client.handle({ method: 'subscribe', params: { channel: chatUri } });
  opened.push({ client, uri });
  return { client, peer: p, uri, chatUri, heard };
}

/** The sessions this file started, so each one's subprocess is stopped. */
const opened: { client: ReturnType<ReturnType<typeof createHost>['accept']>; uri: string }[] = [];

afterEach(async () => {
  for (const one of opened.splice(0)) {
    await one.client.handle({ method: 'disposeSession', params: { channel: one.uri } });
  }
});

/** The action a turn began with, dispatched the way a client dispatches it. */
const begin = (client: Awaited<ReturnType<typeof planning>>['client'], chatUri: string, turnId: string, text: string): void => {
  client.handle({
    method: 'dispatchAction',
    params: { channel: chatUri, action: { type: 'chat/turnStarted', turnId, message: { text } } },
  });
};

/** The calls this one turn made for its plan, by their types. */
const planCalls = (p: ReturnType<typeof peer>, chatUri: string, turnId: string): string[] =>
  actions(p, chatUri)
    .filter((e) => e.action.toolCallId === `${turnId}:plan` && String(e.action.type).startsWith('chat/toolCall'))
    .map((e) => String(e.action.type));

it('hands a plan update as the whole list, with each status and priority', async () => {
  const { client, peer: p, chatUri, heard } = await planning();
  begin(client, chatUri, 't1', 'plan it');
  await until(() => heard.length >= 2);
  await until(() => finished(p, chatUri, 1));

  expect(heard).toHaveLength(2);
  expect(heard[0]).toMatchObject({
    type: 'plan_update',
    session: 'acp:/one',
    harness: 'acp',
    tool: 'plan',
    turn: 't1',
    entries: [
      { text: 'Read the file', status: 'in_progress', priority: 'high' },
      { text: 'Write the answer', status: 'pending', priority: 'medium' },
    ],
  });
  // The second update carries the whole list again, with the statuses moved on.
  expect(heard[1]).toMatchObject({
    type: 'plan_update',
    session: 'acp:/one',
    tool: 'plan',
    turn: 't1',
    entries: [
      { text: 'Read the file', status: 'completed', priority: 'high' },
      { text: 'Write the answer', status: 'in_progress', priority: 'medium' },
    ],
  });
});

it('hands the next turn\'s plan for the same session', async () => {
  const { client, peer: p, chatUri, heard } = await planning();
  begin(client, chatUri, 't1', 'plan it');
  await until(() => heard.length >= 2);
  await until(() => finished(p, chatUri, 1));

  begin(client, chatUri, 't2', 'plan it again');
  await until(() => heard.length >= 4);
  await until(() => finished(p, chatUri, 2));

  expect(heard.map((event) => event.turn)).toEqual(['t1', 't1', 't2', 't2']);
  expect(heard.map((event) => event.session)).toEqual(['acp:/one', 'acp:/one', 'acp:/one', 'acp:/one']);
  expect(heard[2]?.entries).toEqual([
    { text: 'Read the file', status: 'in_progress', priority: 'high' },
    { text: 'Write the answer', status: 'pending', priority: 'medium' },
  ]);
});

it('keeps the turn\'s one Plan call while the list goes to the host', async () => {
  const { client, peer: p, chatUri, heard } = await planning();
  begin(client, chatUri, 't1', 'plan it');
  await until(() => heard.length >= 2);
  await until(() => finished(p, chatUri, 1));

  // One row for two plans: opened and readied by the first, rewritten by the
  // second, and completed by the turn ending rather than by an update.
  expect(planCalls(p, chatUri, 't1')).toEqual([
    'chat/toolCallStart',
    'chat/toolCallReady',
    'chat/toolCallContentChanged',
    'chat/toolCallContentChanged',
    'chat/toolCallComplete',
  ]);
});
