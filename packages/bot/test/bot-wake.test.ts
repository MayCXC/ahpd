import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { backSessions, rowId } from '../src/names.js';
import { botStore } from '../src/store.js';
import { botWake, sessionFor } from '../src/wake.js';
import type { ChatMessage, TurnHandle } from '../src/chat.js';
import type { BotSessions } from '../src/provider.js';
import type { BotRecord } from '../src/record.js';
import type { Bag } from '../../sdk/src/types/common.js';
import type { SessionRequest } from '../../sdk/src/types/plugin.js';
import type { Owner } from '../../sdk/src/types/usage.js';

/*
 * A message said to a bot wakes the back session its record names.
 *
 * What is checked here is the road between the two sessions: the name a bot's
 * record gives, the session that name is on - found in the `bot-sessions` rows,
 * or started and written down - the turn the message becomes there, and the main
 * turn left open while it is answered. Nothing is refused here, so nothing ends
 * a main turn but a notice naming a cause.
 *
 * The host's own halves are stubs: what starts a session, what reads one's chat
 * and state, and what carries an action are all the plugin's, and `plugin.ts` is
 * where those are real. What the wake decides is the order they happen in, and
 * that is what these cases watch.
 */

/** The main chat every case below says something in, as this host holds it. */
const CHAT = 'bot-chat:/one';

/** The person of that chat, who is whose the back session is. */
const PERSON: Owner = 'user:ana';

/**
 * Where the bots work in these cases.
 *
 * A real, empty folder, because a wake now writes the bot's files before it
 * starts the session and a folder nothing may write is a wake these cases
 * would be measuring for the wrong reason.
 */
const WORKSPACE = mkdtempSync(join(tmpdir(), 'ahpd-bot-wake-'));

/** One bot, as the store holds it. */
const bot = (over: Partial<BotRecord> = {}): BotRecord => ({
  id: 'backer',
  name: 'Backer',
  labels: [],
  body: 'robot',
  color: 'red',
  harness: 'base',
  session: 'work',
  workspace: WORKSPACE,
  owner: 'user:soft',
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
  ...over,
});

/** One message in a main chat, as `chat.ts` hands the plugin one. */
const message = (turnId: string, text: string, session = CHAT): ChatMessage => ({ session, turnId, text });

/** A handle over a main turn, and what was said through it. */
interface Recorded {
  handle: TurnHandle;
  /** What the turn was answered with. */
  replies: string[];
  /** What the turn was ended with instead of an answer. */
  notices: string[];
  /** One entry per ending, which is the only way a handle says it was used. */
  endings: string[];
}

const turn = (): Recorded => {
  const replies: string[] = [];
  const notices: string[] = [];
  const endings: string[] = [];
  const handle: TurnHandle = {
    reply: (text) => { replies.push(text); },
    notice: (text) => { notices.push(text); },
    end: () => { endings.push('ended'); },
  };
  return { handle, replies, notices, endings };
};

/**
 * A wake over one host, with everything the host owns stubbed.
 *
 * The collections and the store are real, because a row that was not written is
 * exactly what a second message would start a second session over. The sessions
 * are a map that mints a URI per start, `look` reads a chat off the same map,
 * and `send` records what it was asked to carry rather than carrying it.
 */
async function sitting(record: BotRecord = bot()) {
  const records = memoryRecords();
  const store = botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    () => {},
  );
  await store.put(record);
  const chats = await records.collection('bot-chats');
  await chats.put({ id: rowId([record.id, PERSON]), bot: record.id, owner: PERSON, chat: CHAT });
  const backs = backSessions(await records.collection('bot-sessions'));

  /** The default chat of each back session, by the session's URI. */
  const at = new Map<string, string>();
  /** Whose each session is: a URI absent here is one this host no longer has. */
  const owners = new Map<string, Owner>();
  /** The back sessions a turn is running in, which is what a message steers. */
  const working = new Set<string>();
  const starts: SessionRequest[] = [];
  const sent: { channel: string; action: Bag }[] = [];
  const problems: string[] = [];
  /** What a start is refused with, where the host refuses one. */
  let startRefusal: string | undefined;
  /** What a send is refused with, where the host refuses one. */
  let sendRefusal: string | undefined;
  let minted = 0;

  const sessions: BotSessions = {
    owner: async (uri) => owners.get(uri),
    start: async (wanted) => {
      if (startRefusal !== undefined) throw new Error(startRefusal);
      starts.push(wanted);
      minted += 1;
      const uri = `ahp-session:/${minted}`;
      owners.set(uri, wanted.owner);
      at.set(uri, `ahp-chat:/${minted}`);
      return uri;
    },
  };

  const wake = botWake({
    store,
    chats,
    backs,
    sessions,
    // What a first wake writes into the folder: the real plugin fills the
    // template, and these cases are about the message rather than the file.
    agents: async (one) => `# ${one.name}\n`,
    look: async (session) => {
      const chat = at.get(session);
      if (chat === undefined) throw new Error(`${session} names no chat to say a message in`);
      return { chat, working: working.has(session) };
    },
    send: async (channel, action) => {
      sent.push({ channel, action });
      return sendRefusal;
    },
    problem: (line) => { problems.push(line); },
  });

  return {
    wake, backs, starts, sent, problems, working,
    refuseStart: (line: string) => { startRefusal = line; },
    refuseSend: (line: string) => { sendRefusal = line; },
  };
}

it('starts a back session on the bot\'s own harness, in its folder, for the person who woke it', () => {
  const wanted = sessionFor(bot({ harness: 'claude', model: 'claude-sonnet-5', computer: 'workstation' }), PERSON);
  expect(wanted).toEqual({
    owner: PERSON,
    provider: 'claude',
    workingDirectory: WORKSPACE,
    trusted: true,
    userSettings: false,
    model: { id: 'claude-sonnet-5' },
    config: { computer: 'workstation' },
    title: 'Backer',
    tools: ['post_message'],
  });

  // A preset is a session whose backend and settings are already decided, so it
  // wins over the harness and the model rather than sitting beside them.
  expect(sessionFor(bot({ preset: 'loud', harness: 'claude', model: 'claude-sonnet-5' }), PERSON))
    .toEqual({
      owner: PERSON, provider: 'loud', workingDirectory: WORKSPACE, trusted: true, userSettings: false,
      title: 'Backer', tools: ['post_message'],
    });

  // A bot that names no backend at all says nothing about one: the host starts
  // the session on whatever it starts its own on.
  const quiet = { ...bot() };
  delete quiet.harness;
  expect(sessionFor(quiet, PERSON)).toEqual({
    owner: PERSON, workingDirectory: WORKSPACE, trusted: true, userSettings: false, title: 'Backer',
    tools: ['post_message'],
  });
});

it('asks the host for post_message when it starts a back session', async () => {
  const one = await sitting();

  await one.wake.woken(message('t1', 'hello'), turn().handle);

  // `post_message` is opt-in, so a session that does not name it is never
  // offered it, and is never told its instruction either.
  expect(one.starts[0]?.tools).toEqual(['post_message']);
  expect(one.starts[0]?.instructions).toBeUndefined();
});

it('starts a back session on the first message, and says the second in it', async () => {
  const one = await sitting();
  const first = turn();
  await one.wake.woken(message('t1', 'hello'), first.handle);

  expect(one.starts).toEqual([{
    owner: PERSON, provider: 'base', workingDirectory: WORKSPACE, trusted: true, userSettings: false,
    title: 'Backer', tools: ['post_message'],
  }]);
  expect(one.sent).toMatchObject([{
    channel: 'ahp-chat:/1',
    action: { type: 'chat/turnStarted', message: { text: 'hello' } },
  }]);
  // The turn in the back session is the back session's own, not the main chat's.
  expect(typeof one.sent[0]?.action['turnId']).toBe('string');
  expect(one.sent[0]?.action['turnId']).not.toBe('t1');
  // The row is written before the message is sent, so a second message finds
  // this session rather than starting another one.
  expect(await one.backs.get('backer', 'ana', 'work')).toBe('ahp-session:/1');
  // And the main turn is held open, waiting on the session that was woken.
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ session: CHAT, turnId: 't1' });

  const second = turn();
  await one.wake.woken(message('t2', 'and again'), second.handle);

  expect(one.starts).toHaveLength(1);
  expect(one.sent.map((each) => each.action['type'])).toEqual(['chat/turnStarted', 'chat/turnStarted']);
  expect(one.sent[1]).toMatchObject({ channel: 'ahp-chat:/1', action: { message: { text: 'and again' } } });
  // What the second message waits on is the second turn.
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ turnId: 't2', handle: second.handle });
  // Nothing ended a turn of the main chat: the wake ends one only over a
  // refusal, and nothing here was refused.
  expect([...first.notices, ...second.notices]).toEqual([]);
  expect([...first.endings, ...second.endings]).toEqual([]);
});

it('steers a message into the back session that is already working', async () => {
  const one = await sitting();
  const said = turn();
  await one.wake.woken(message('t1', 'hello'), said.handle);
  one.working.add('ahp-session:/1');

  // The same main turn: a message into a turn that is running is that turn's.
  await one.wake.woken(message('t1', 'stop that'), said.handle);

  expect(one.sent.map((each) => each.action['type'])).toEqual(['chat/turnStarted', 'chat/pendingMessageSet']);
  expect(one.sent[1]).toMatchObject({
    channel: 'ahp-chat:/1',
    action: { type: 'chat/pendingMessageSet', kind: 'steering', message: { text: 'stop that' } },
  });
  // The entry is the sender's own, which is what the protocol asks of a steer.
  expect(typeof one.sent[1]?.action['id']).toBe('string');
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ turnId: 't1', handle: said.handle });
  expect(said.notices).toEqual([]);
});

it('starts a session of its own for each message when the name holds {turn}', async () => {
  const one = await sitting(bot({ session: 'job-{turn}' }));
  const first = turn();
  const second = turn();

  await one.wake.woken(message('a1', 'first'), first.handle);
  await one.wake.woken(message('b2', 'second'), second.handle);

  // Two names, two rows and two sessions: what a person asks for by writing a
  // name that holds the word is a session per message rather than one continued.
  expect(one.starts).toHaveLength(2);
  expect(await one.backs.get('backer', 'ana', 'job-a1')).toBe('ahp-session:/1');
  expect(await one.backs.get('backer', 'ana', 'job-b2')).toBe('ahp-session:/2');
  expect(one.sent.map((each) => each.channel)).toEqual(['ahp-chat:/1', 'ahp-chat:/2']);
  // And each main turn waits on the session its own message woke.
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ turnId: 'a1', handle: first.handle });
  expect(one.wake.main('ahp-session:/2')).toMatchObject({ turnId: 'b2', handle: second.handle });
});

it('fills {turn} with a uuid that starts with a digit or makes the name longer than a slug', async () => {
  const one = await sitting(bot({ session: 'work-{turn}' }));
  const id = '2C9F0E4A-1B2C-4D3E-8F90-123456789ABC';

  await one.wake.woken(message(id, 'hello'), turn().handle);

  expect(await one.backs.get('backer', 'ana', `work-${id.toLowerCase()}`)).toBe('ahp-session:/1');
});

it('refuses a name that a message fills into something no session can be named', async () => {
  const one = await sitting(bot({ session: '{turn}' }));
  const said = turn();

  // A turn id is a client's to choose, so `{turn}` is a name only where the id
  // that takes its place is one.
  await one.wake.woken(message('a/b', 'hello'), said.handle);

  expect(one.starts).toEqual([]);
  expect(one.sent).toEqual([]);
  expect(said.notices[0]).toMatch(/a\/b is not a name a back session can have/);
});

it('starts a name again whose session this host no longer has', async () => {
  const one = await sitting();
  /*
   * The row of a daemon that restarted: it names a session this host has not.
   * A session that ran no turn is not on the backend's disk, so its store row
   * outlives it and `sessionOwner` - the seam `owner` is built on - answers
   * nothing for it. Nothing is a name to start again rather than a cause to
   * end the main turn over.
   */
  await one.backs.put('backer', 'ana', 'work', 'ahp-session:/gone');
  const said = turn();

  await one.wake.woken(message('t1', 'hello'), said.handle);

  expect(one.starts).toHaveLength(1);
  // The row is written over before the message is sent, so the next message
  // finds the new session rather than starting a third one.
  expect(await one.backs.get('backer', 'ana', 'work')).toBe('ahp-session:/1');
  expect(one.sent).toMatchObject([{
    channel: 'ahp-chat:/1',
    action: { type: 'chat/turnStarted', message: { text: 'hello' } },
  }]);
  // The person is not told a restart happened: the message reached a session
  // of the bot's, and the main turn waits on that one.
  expect([...said.notices, ...said.endings]).toEqual([]);
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ session: CHAT, turnId: 't1' });
});

it('ends the main turn with a notice when the host refuses the start', async () => {
  const one = await sitting();
  one.refuseStart('plugin:bot was not given session:create');
  const said = turn();

  await one.wake.woken(message('t1', 'hello'), said.handle);

  // Nothing was said, so nothing is coming: the person is told why rather than
  // left with a turn that will never end.
  expect(one.sent).toEqual([]);
  expect(said.notices).toEqual(['Backer was not woken: plugin:bot was not given session:create']);
  expect(await one.backs.get('backer', 'ana', 'work')).toBeUndefined();
});

it('ends the main turn with the host\'s own words when it refuses the message', async () => {
  const one = await sitting();
  one.refuseSend('plugin:bot may not send a turn to this chat');
  const said = turn();

  await one.wake.woken(message('t1', 'hello'), said.handle);

  expect(said.notices).toEqual(['Backer was not woken: plugin:bot may not send a turn to this chat']);
  // And nothing is left waiting on an answer that was never asked for.
  expect(one.wake.main('ahp-session:/1')).toBeUndefined();
});

it('ends a turn in a chat no bot opened, and says so', async () => {
  const one = await sitting();
  const said = turn();

  await one.wake.woken(message('t1', 'hello', 'bot-chat:/stray'), said.handle);

  // No row says which bot this chat is with, so there is nothing to wake and
  // nobody coming: the turn is over rather than left open for an answer.
  expect(said.endings).toHaveLength(1);
  expect(said.notices).toEqual([]);
  expect(one.problems).toEqual(['bot-chat:/stray is a chat no bot on this host opened']);
  expect(one.sent).toEqual([]);
});
