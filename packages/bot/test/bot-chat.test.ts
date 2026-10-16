import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, ROOT } from '../../sdk/src/host.js';
import { Status } from '../../sdk/src/catalog.js';
import { foldHostOptions, pluginHost } from '../../sdk/src/plugins.js';
import { memoryRecords } from '../../sdk/src/records.js';
import { fileResources } from '../../sdk/src/resources.js';
import { memorySessions } from '../../sdk/src/sessions.js';
import { sdkVersion } from '../../sdk/src/version.js';
import { echo } from '../../../examples/echo/agent.js';
import { botChatAgent, CHATS_DIR, CHAT_PROVIDER, turns } from '../src/chat.js';
import { apply } from '../src/plugin.js';
import { botStore } from '../src/store.js';
import type { ChatMessage } from '../src/chat.js';
import type { Bag } from '../../sdk/src/types/common.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';
import type { Peer } from '../../sdk/src/types/rpc.js';

/*
 * A chat with a bot is a session with no harness.
 *
 * A person says something to a bot, and what they said has to be kept somewhere
 * the bot can read and answer into. That is this: a session of the `bot-chat`
 * provider, one JSON line per turn in a log under the daemon's own
 * configuration, and nothing running behind it.
 *
 * What is checked here is the two things the log decides - a turn is a line,
 * and a line is what a restarted daemon answers `list`, `find` and `transcript`
 * from - the refusal a chat with a bot that is not there gets, and the turn a
 * chat now holds open: nothing answers this chat by itself, so a turn it begins
 * is over only when the handle over it says so.
 */

/** A temporary directory removed after the test that made it. */
let loose: string[] = [];
beforeEach(() => { loose = []; });
afterEach(() => {
  for (const dir of loose) rmSync(dir, { recursive: true, force: true });
  loose = [];
});

/** What one connection was told, in the order it was told it. */
type Notes = { method: string; params: unknown }[];

const peer = (notes: Notes): Peer => ({
  send: () => {},
  notify: (method, params) => { notes.push({ method, params }); },
  request: async () => ({}),
  answered: () => {},
  close: () => {},
});

/** The actions one connection was told about one channel. */
const actions = (notes: Notes, channel: string): Bag[] => notes
  .filter((note) => note.method === 'action')
  .map((note) => note.params as { channel: string; action: Bag })
  .filter((one) => one.channel === channel)
  .map((one) => one.action);

/**
 * A host with the bot plugin on it, and no users directory.
 *
 * No directory is the one host where no connection is anybody, which is what
 * this file wants: who may read a bot, and so who may start a chat with one, is
 * the provider's business and is checked there. Nothing below is a question
 * about a grant.
 */
function made() {
  const root = mkdtempSync(join(tmpdir(), 'ahpd-bot-chat-'));
  loose.push(root);
  /** Where a bot's own folder goes, which is the plugin's `root` option. */
  const bots = join(root, 'bots');
  /** The daemon's own configuration, which is where the chats are kept. */
  const configDir = join(root, 'config');
  const context: LoaderContext = {
    path: root,
    paths: [root],
    version: sdkVersion(),
    hostName: 'test',
    configDir,
    log: () => {},
    say: () => {},
  };
  const sessions = memorySessions();
  const records = memoryRecords();
  const { host: plugin, contribution } = pluginHost('bot', context, {
    sessions: () => sessions,
    records: () => records,
    problem: () => {},
  });
  apply(plugin, { root: bots });

  const base: HostOptions = {
    path: root,
    // One agent, because a bot that names no harness is started on the host's
    // first one: a host with no agent at all could not answer a write of a bot.
    agents: [{ ...echo({ path: root, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    sessions,
    records,
  };
  const { options } = foldHostOptions(base, [contribution]);
  return { host: createHost(options), root, bots, configDir, records };
}

type Client = ReturnType<ReturnType<typeof createHost>['accept']>;

/**
 * A client of this host, signed in as nobody, which is everybody here.
 *
 * `notes` is where what it is told lands, for a test that has to watch an
 * action arrive rather than read the state it left behind.
 */
async function anyone(host: ReturnType<typeof createHost>, notes: Notes = []): Promise<Client> {
  const client = host.accept(peer(notes));
  await client.handle({
    method: 'initialize',
    params: { clientId: 'anyone', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  return client;
}

/** The session every test below works in, as the client that starts it names it. */
const SESSION = 'ahp-session:/one';
/**
 * The same session as this host holds it: `<provider>:/<id>`.
 *
 * A client names a session and the host names its scheme, so the URI a backend
 * is started with is not the one the client sent - and the URI a backend is
 * started with is the only one `turns` knows a chat by.
 */
const HELD = `${CHAT_PROVIDER}:/one`;
const CHAT = 'ahp-chat:/one';

/** A bot, a chat with it, and a client watching that chat. */
async function talkTo(client: Client): Promise<void> {
  await client.handle({
    method: 'resourceWrite',
    params: { uri: 'bot://backer', data: JSON.stringify({ name: 'Backer' }), createOnly: true },
  });
  await client.handle({
    method: 'createSession',
    params: { channel: SESSION, provider: CHAT_PROVIDER, config: { bot: 'backer' } },
  });
  await client.handle({ method: 'subscribe', params: { channel: CHAT } });
}

/** A client says something in the chat. */
const said = (client: Client, turnId: string, text: string): Promise<unknown> => client.handle({
  method: 'dispatchAction',
  params: { channel: CHAT, action: { type: 'chat/turnStarted', turnId, message: { text } } },
});

/** What the chat's state is, as a client subscribing to it now is told. */
const stateOf = async (client: Client): Promise<Bag> => {
  const opened = await client.handle({ method: 'subscribe', params: { channel: CHAT } }) as {
    snapshot: { state: Bag };
  };
  return opened.snapshot.state;
};

/**
 * The agent a restarted daemon has: the same records, and the same folder.
 *
 * A restart is nothing in memory and everything on the disk, so this is the
 * whole of what it leaves behind for the chats to be read back from.
 */
async function restarted(configDir: string, records: ReturnType<typeof memoryRecords>) {
  return botChatAgent(configDir, botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    () => {},
  ));
}

/** What the call was refused with, or a case that fails because it was allowed. */
const refusalOf = async (run: Promise<unknown>): Promise<{ code?: number; message: string }> =>
  run.then(() => { throw new Error('the call was allowed'); }, (error: { code?: number; message: string }) => error);

/** One line of a chat's log, as it was written. */
const lines = (configDir: string, id: string): Bag[] => readFileSync(join(configDir, CHATS_DIR, `${id}.jsonl`), 'utf8')
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => JSON.parse(line) as Bag);

it('keeps a chat in a log, and answers it again after a restart', async () => {
  const { host, configDir, records } = made();
  const client = await anyone(host);

  await talkTo(client);
  for (const [turnId, text] of [['t1', 'hello'], ['t2', 'again']] as const) await said(client, turnId, text);

  /*
   * Two turns, and two lines each: the one a turn begins with, which says what
   * was said and nothing about how it went, and the one it ends with. Nobody
   * answers this chat, so each turn is over in the call it began in.
   */
  const kept = lines(configDir, 'one');
  expect(kept.map((one) => one['id'])).toEqual(['t1', 't1', 't2', 't2']);
  expect(kept[0]).toMatchObject({
    message: { text: 'hello', origin: { kind: 'user' } },
    responseParts: [],
    // The bot is on the line so that a listing knows which chat this is, and
    // not on the turn a client is served.
    _meta: { bot: 'backer', name: 'Backer', kind: 'direct' },
  });
  // A turn that has not ended has no ending, which is the whole difference
  // between the line above and the one below.
  expect(kept[0]).not.toHaveProperty('state');
  expect(kept[1]).toMatchObject({ id: 't1', state: 'complete', responseParts: [] });

  // A daemon that restarts has nothing in memory. What it has is the folder.
  const fresh = await restarted(configDir, records);

  expect(await fresh.list?.()).toMatchObject([{ id: 'one', title: 'Backer' }]);
  expect(await fresh.find?.('one')).toMatchObject({ id: 'one', title: 'Backer' });

  // Two turns, and not four: the lines are folded back into the turns they are
  // the beginning and the end of.
  const read = await fresh.transcript?.('one');
  expect(read?.map((turn) => turn.message.text)).toEqual(['hello', 'again']);
  // A turn served to a client is the turn: no `_meta`, and no response part -
  // nothing has answered this chat yet.
  expect(read?.[0]).not.toHaveProperty('_meta');
  expect(read?.[0]?.responseParts).toEqual([]);
  expect(read?.[0]?.message.origin).toEqual({ kind: 'user' });
  // A chat this host has no log for is not a chat, which is not the same
  // answer as a chat nothing has been said to.
  expect(await fresh.transcript?.('two')).toBeUndefined();
  expect(await fresh.find?.('two')).toBeUndefined();
});

it('holds a turn open until the handle answers it', async () => {
  const { host, configDir, records } = made();
  const notes: Notes = [];
  const client = await anyone(host, notes);
  await talkTo(client);
  const chat = turns(HELD);
  const heard: ChatMessage[] = [];
  chat.onMessage = (message) => { heard.push(message); };

  await said(client, 't1', 'hello');

  /*
   * Open: the chat is working, the turn is its `activeTurn`, and the log has
   * the line the turn began with and not one it ended with. Nothing has ended
   * it, and nothing here would - this chat runs no model.
   */
  const running = await stateOf(client);
  expect(running['status']).toBe(Status.InProgress);
  expect(running['activeTurn']).toMatchObject({ id: 't1', message: { text: 'hello' }, responseParts: [] });
  expect(running['turns']).toEqual([]);
  expect(lines(configDir, 'one')).toHaveLength(1);
  expect(actions(notes, CHAT).map((one) => one['type'])).not.toContain('chat/turnComplete');
  // And whoever answers this chat was told what was said, and in which turn.
  expect(heard).toEqual([{ session: HELD, turnId: 't1', text: 'hello' }]);

  chat.reply('hello yourself');

  // Over: the answer is the turn's one part, and the turn is the transcript's.
  const idle = await stateOf(client);
  expect(idle['status']).toBe(Status.Idle);
  expect(idle['activeTurn']).toBeUndefined();
  expect(idle['turns']).toMatchObject([{
    id: 't1',
    state: 'complete',
    responseParts: [{ id: 't1:reply', kind: 'markdown', content: 'hello yourself' }],
  }]);
  // A part, then the turn it belongs to: a part after the end is a part of a
  // turn nobody is holding any more.
  const answered = actions(notes, CHAT).map((one) => one['type']);
  expect(answered.slice(answered.indexOf('chat/responsePart'))).toEqual(['chat/responsePart', 'chat/turnComplete']);

  // The second line is the turn as it ended, and it is what a restart reads.
  const kept = lines(configDir, 'one');
  expect(kept).toHaveLength(2);
  expect(kept[1]).toMatchObject({
    id: 't1',
    state: 'complete',
    responseParts: [{ id: 't1:reply', kind: 'markdown', content: 'hello yourself' }],
  });

  const fresh = await restarted(configDir, records);
  const read = await fresh.transcript?.('one');
  expect(read?.[0]?.responseParts).toEqual([{ id: 't1:reply', kind: 'markdown', content: 'hello yourself' }]);
  expect(read?.[0]?.state).toBe('complete');
});

it('ends a turn with a notice, and with a cancellation', async () => {
  const { host, configDir } = made();
  const notes: Notes = [];
  const client = await anyone(host, notes);
  await talkTo(client);
  const chat = turns(HELD);
  // Somebody answers this chat, and says nothing here: a turn with a listener
  // stays open, which is what leaves the endings below something to end.
  chat.onMessage = () => {};

  await said(client, 't1', 'hello');
  chat.notice('Backer finished without a reply');
  expect((await stateOf(client))['turns']).toMatchObject([{
    id: 't1',
    state: 'complete',
    responseParts: [{ kind: 'systemNotification', content: 'Backer finished without a reply' }],
  }]);

  /*
   * A stop, along the road a client's stop takes: the host reads the turn this
   * chat has open, hands it to `cancel`, and the turn is ended as cancelled -
   * which is what the client that asked is told.
   */
  await said(client, 't2', 'again');
  await client.handle({
    method: 'dispatchAction',
    params: { channel: CHAT, action: { type: 'chat/turnCancelled', turnId: 't2' } },
  });
  expect(actions(notes, CHAT).map((one) => one['type'])).toContain('chat/turnCancelled');
  const state = await stateOf(client);
  expect(state['status']).toBe(Status.Idle);
  expect(state['activeTurn']).toBeUndefined();
  expect(state['turns']).toMatchObject([{ id: 't1' }, { id: 't2', state: 'cancelled', responseParts: [] }]);
  expect(lines(configDir, 'one').at(-1)).toMatchObject({ id: 't2', state: 'cancelled', responseParts: [] });
});

it('hands a steer to whoever answers, and keeps it in the log', async () => {
  const { host, configDir, records } = made();
  const notes: Notes = [];
  const client = await anyone(host, notes);
  await talkTo(client);
  const chat = turns(HELD);
  const heard: ChatMessage[] = [];
  chat.onMessage = (message) => { heard.push(message); };

  await said(client, 't1', 'hello');
  await client.handle({
    method: 'dispatchAction',
    params: { channel: CHAT, action: { type: 'chat/pendingMessageSet', kind: 'steering', id: 's1', message: { text: 'stop that' } } },
  });

  // What was steered reaches whoever answers, named after the turn it went in
  // rather than after the entry the client held it as.
  expect(heard).toEqual([
    { session: HELD, turnId: 't1', text: 'hello' },
    { session: HELD, turnId: 't1', text: 'stop that' },
  ]);
  // And it is a line of the chat's, which is not a turn of its own: a steering
  // message is consumed by the turn it steers.
  const kept = lines(configDir, 'one');
  expect(kept).toHaveLength(2);
  expect(kept[1]).toMatchObject({ id: 't1', steering: true, message: { text: 'stop that', origin: { kind: 'user' } } });

  chat.reply('done');
  const fresh = await restarted(configDir, records);
  const read = await fresh.transcript?.('one');
  expect(read?.map((turn) => turn.message.text)).toEqual(['hello']);
  expect(read?.[0]?.responseParts).toEqual([{ id: 't1:reply', kind: 'markdown', content: 'done' }]);
});

it('refuses a chat with a bot that is not there', async () => {
  const { host } = made();
  const client = await anyone(host);

  const refusal = await refusalOf(client.handle({
    method: 'createSession',
    params: { channel: 'ahp-session:/one', provider: CHAT_PROVIDER, config: { bot: 'nobody' } },
  }));

  // The host's own code for what a backend refused `create` with, and the
  // backend's sentence: `openSession` answers every one of them the same way.
  expect(refusal.code).toBe(-32602);
  expect(refusal.message).toBe('There is no bot nobody.');
});
