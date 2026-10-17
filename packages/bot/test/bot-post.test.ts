import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { backSessions, rowId } from '../src/names.js';
import { postMessage } from '../src/post.js';
import { botStore } from '../src/store.js';
import { botWake } from '../src/wake.js';
import type { ChatMessage, TurnHandle } from '../src/chat.js';
import type { BotSessions } from '../src/provider.js';
import type { BotRecord } from '../src/record.js';
import type { ToolCall } from '../../sdk/src/types/host.js';
import type { SessionRequest } from '../../sdk/src/types/plugin.js';
import type { Owner } from '../../sdk/src/types/usage.js';

/*
 * The tool a back session answers its main chat with.
 *
 * A message said to a bot leaves a main turn open while a back session works,
 * and something has to end it. This is the two ways: `post_message`, which ends
 * it with the text the session posts, and the end of the session's own turn,
 * which ends it with a notice when nothing was posted. What is checked is that
 * the chat answered is the session's own - the tool reads `at.session` and no
 * input - and that a turn ends once, whichever road gets there first.
 *
 * The host's own halves are stubs, as they are in `bot-wake.test.ts`: what
 * starts a session and what carries an action are the plugin's. The wake and
 * the rows are real, because the turn a post ends is the turn a message woke.
 */

/** The main chat every case below says something in, as this host holds it. */
const CHAT = 'bot-chat:/one';

/** The person of that chat, who is whose the back session is. */
const PERSON: Owner = 'user:ana';

/** Where the bot works, which the wake writes the bot's files into. */
const WORKSPACE = mkdtempSync(join(tmpdir(), 'ahpd-bot-post-'));

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
const message = (turnId: string, text: string): ChatMessage => ({ session: CHAT, turnId, text });

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
 * Where a call was made from, as much of it as this tool reads.
 *
 * `post_message` finds the main chat from the calling session and from nothing
 * else, so the rest of a `ToolCall` is not there to be stubbed.
 */
const called = (session: string): ToolCall => ({ session } as unknown as ToolCall);

/**
 * A wake over one host, with everything the host owns stubbed.
 *
 * The collections and the store are real, because the row a start writes is
 * what a later message finds. The sessions are a map that mints a URI per
 * start, `look` reads a chat off the same map, and `send` records what it was
 * asked to carry rather than carrying it.
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
  let minted = 0;

  const sessions: BotSessions = {
    owner: async (uri) => owners.get(uri),
    start: async (wanted: SessionRequest) => {
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
    // template, and these cases are about the post rather than the file.
    agents: async (one) => `# ${one.name}\n`,
    look: async (session) => {
      const chat = at.get(session);
      if (chat === undefined) throw new Error(`${session} names no chat to say a message in`);
      return { chat, working: false };
    },
    // What the message becomes in the back session is task 03's, and what it
    // carries is not what a post answers: nothing here is refused.
    send: async () => undefined,
    problem: () => {},
  });

  return { wake, post: postMessage(wake) };
}

/** A message that wakes the one back session, and the turn it leaves open. */
async function woken(one: Awaited<ReturnType<typeof sitting>>): Promise<Recorded> {
  const said = turn();
  await one.wake.woken(message('t1', 'hello'), said.handle);
  return said;
}

it('ends the main turn with the text the back session posts', async () => {
  const one = await sitting();
  const said = await woken(one);

  expect(await one.post.run({ text: 'the answer' }, called('ahp-session:/1'))).toBe('Posted to the main chat.');

  // The text is the response of the turn the person is waiting on, and the
  // wake holds no turn for that session any more.
  expect(said.replies).toEqual(['the answer']);
  expect(said.notices).toEqual([]);
  expect(said.endings).toEqual([]);
  expect(one.wake.main('ahp-session:/1')).toBeUndefined();

  // A second post is a call into a turn that is over, and it answers nothing:
  // one ending is one turn, and a second would be a turn of its own.
  expect(await one.post.run({ text: 'and again' }, called('ahp-session:/1')))
    .toBe('There is no main chat waiting on this session, so there is nothing to post to.');
  expect(said.replies).toEqual(['the answer']);
});

it('refuses a session that is not a back session', async () => {
  const one = await sitting();
  const said = await woken(one);

  // A session this wake never woke has no main chat behind it, and the tool
  // says so rather than throwing: the model can go on with its own turn.
  expect(await one.post.run({ text: 'the answer' }, called('ahp-session:/stray')))
    .toBe('There is no main chat waiting on this session, so there is nothing to post to.');
  expect(said.replies).toEqual([]);
  expect(one.wake.main('ahp-session:/1')).toMatchObject({ turnId: 't1' });
});

it('posts into the chat that woke the session, never one an input names', async () => {
  const one = await sitting();
  const said = await woken(one);

  // The only input is the text, and anything else a caller sends is ignored:
  // the chat answered is the one the calling session was woken by.
  await one.post.run({ text: 'the answer', session: 'bot-chat:/another' }, called('ahp-session:/1'));

  expect(said.replies).toEqual(['the answer']);
});

it('ends the main turn with a notice when the back session finishes without a post', async () => {
  const one = await sitting();
  const said = await woken(one);

  // The session's turn is over and nothing was posted, so the person is told
  // that rather than left with a turn nothing will ever end.
  one.wake.finished('ahp-session:/1');

  expect(said.notices).toEqual(['Backer finished without a reply']);
  expect(said.replies).toEqual([]);
  expect(said.endings).toEqual([]);
  expect(one.wake.main('ahp-session:/1')).toBeUndefined();

  // A session that already answered ends nothing when its turn ends after, and
  // neither does one this wake never woke.
  one.wake.finished('ahp-session:/1');
  one.wake.finished('ahp-session:/stray');
  expect(said.notices).toHaveLength(1);
});

it('ends nothing when the session\'s own turn ends after a post', async () => {
  const one = await sitting();
  const said = await woken(one);

  await one.post.run({ text: 'the answer' }, called('ahp-session:/1'));
  // The turn a post ended is over, so the session's own turn ending after it
  // is nothing: the answer is not followed by a notice saying it was not given.
  one.wake.finished('ahp-session:/1');

  expect(said.replies).toEqual(['the answer']);
  expect(said.notices).toEqual([]);
});

it('is offered only to a session that names it, with the rule that it is the reply', () => {
  const tool = postMessage(botWake({} as never));

  // The rule rides on the tool, so a session is told it exactly when it has the
  // tool, a restart included: the names are kept with the session, a request's
  // instructions are not.
  expect(tool.optIn).toBe(true);
  expect(tool.instruction).toContain('main chat');
  expect(tool.instruction).toMatch(/send_message starts a turn in another session and does not reply/);
});
