import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { chatReducer } from '@microsoft/agent-host-protocol';
import type { Bag } from '@ahpd/sdk';

/*
 * A steering message the turn could not take in before its last answer.
 *
 * The CLI reads a message pushed while a turn runs at the turn's next tool
 * boundary. A message that arrives after the last one, while the model writes
 * its answer, is run by the CLI as a turn of its own: the first result, a
 * second `system/init`, the frames that answer the message, and a second
 * result. Each frame and result names the client uuids it answers in
 * `user_message_uuids`, and `command_lifecycle` frames say when the CLI queued,
 * started and completed each one.
 *
 * The fixtures are trimmed from a real capture of the SDK this package depends
 * on (0.3.301, its bundled CLI): model `haiku`, `includePartialMessages`, a
 * second message pushed at the first text delta of a turn with no tool call
 * (`claude-late-steer.jsonl`), at the tool call of a turn running `sleep 4`
 * (`claude-folded-steer.jsonl`), and at the first text delta of a turn that
 * was then interrupted once the CLI had queued the second message
 * (`claude-cancelled-steer.jsonl`): the interrupt's receipt listed it in
 * `still_queued`, and the CLI ran it after the interrupted turn's result.
 * Trimmed: the `system/init` frames to the fields this host reads, a thinking
 * signature shortened, the partial input and text deltas of one block joined,
 * and the rate limit events left out.
 */

const sdk = vi.hoisted(() => {
  const state = {
    held: [] as Record<string, unknown>[],
    wake: undefined as (() => void) | undefined,
    /** What the session handed the CLI, in order. */
    handed: [] as Bag[],
    reset() { state.held = []; state.wake = undefined; state.handed = []; },
    push(...frames: Record<string, unknown>[]) {
      state.held.push(...frames);
      state.wake?.();
      state.wake = undefined;
    },
    async next(): Promise<Record<string, unknown>> {
      while (state.held.length === 0) await new Promise<void>((resolve) => { state.wake = resolve; });
      return state.held.shift() as Record<string, unknown>;
    },
  };
  return state;
});

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  query: (given: { prompt: AsyncGenerator<Bag> }) => {
    void (async () => { for await (const one of given.prompt) sdk.handed.push(one); })();
    return {
      async *[Symbol.asyncIterator]() {
        for (;;) yield await sdk.next();
      },
      interrupt: async () => {},
      setPermissionMode: async () => {},
      setModel: async () => {},
      applyFlagSettings: async () => {},
      toggleMcpServer: async () => {},
      reconnectMcpServer: async () => {},
      setMcpServers: async () => {},
      initializationResult: async () => ({}),
      mcpServerStatus: async () => [],
      reloadSkills: async () => ({ skills: [] }),
      reloadPlugins: async () => ({ plugins: [] }),
      supportedModels: async () => [],
      streamInput: async () => {},
      close: () => {},
    };
  },
}));

const { createSession } = await import('../src/session.js');

const fixture = (name: string): Record<string, unknown>[] => readFileSync(
  new URL(`./fixtures/${name}`, import.meta.url),
  'utf8',
).split('\n').filter((line) => line.trim() !== '').map((line) => JSON.parse(line) as Record<string, unknown>);

const settle = async (times = 30): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((r) => { setTimeout(r, 0); });
};

/** The prompts of the capture, by the client uuid each was sent under. */
const FIRST = '5778dc9a-eea4-4d3c-9ff2-6b8c9475f3a0';
const LATE = '07d2a923-3755-4cc5-b5da-15244048317d';
const TOOL = '6c5642a3-e2c5-4c93-85c2-35c1c5734e9b';
const FOLDED = 'ca47bbbc-3cf0-43f4-be43-3c1aee5134ed';
const STOPPED = '8a2702e5-4fac-4d9b-83a4-b35919b2b7e7';
const SURVIVOR = '5ed48b7f-e1c6-4091-aa84-6d44e37ae7f8';

/** Where a capture's frames stop for the second message to be sent: just after the frame `at` finds. */
const splitAfter = (frames: Record<string, unknown>[], at: (frame: Bag) => boolean): [Record<string, unknown>[], Record<string, unknown>[]] => {
  const index = frames.findIndex((frame) => at(frame as Bag));
  if (index < 0) throw new Error('the capture has no such frame');
  return [frames.slice(0, index + 1), frames.slice(index + 1)];
};

/** The late capture, cut at the first text delta, where the probe sent its second message. */
const late = (): [Record<string, unknown>[], Record<string, unknown>[]] => splitAfter(
  fixture('claude-late-steer.jsonl'),
  (frame) => frame.type === 'stream_event' && (frame.event as Bag).type === 'content_block_delta',
);

/** The folded capture, cut at the tool call, where the probe sent its second message. */
const folded = (): [Record<string, unknown>[], Record<string, unknown>[]] => splitAfter(
  fixture('claude-folded-steer.jsonl'),
  (frame) => frame.type === 'assistant'
    && ((frame.message as Bag).content as Bag[]).some((block) => block.type === 'tool_use'),
);

/** Every frame with one client uuid put in another's place, as the CLI would have written it. */
const renamed = (frames: Record<string, unknown>[], from: string, to: string): Record<string, unknown>[] =>
  frames.map((frame) => JSON.parse(JSON.stringify(frame).split(from).join(to)) as Record<string, unknown>);

async function opened() {
  sdk.reset();
  const chat: Bag[] = [];
  const session = createSession({
    uri: 'ahp-session:/late',
    chatUri: 'ahp-chat:/late',
    cwd: mkdtempSync(join(tmpdir(), 'ahpd-late-steer-')),
    // Copied as sent, as the wire would carry it: a part announced empty is filled in place afterwards.
    emit: (channel, action) => {
      if (channel === 'chat') chat.push(structuredClone(action) as Bag);
    },
  });
  await settle();
  // A copy: the state a session answers holds its own lists, which the turns that follow fill.
  const before = structuredClone(session.chatState()) as Bag;
  return { session, chat, before };
}

/** The chat a client builds from the state it started with and every chat action after it. */
const replayed = (before: Bag, chat: Bag[]): Bag =>
  chat.reduce<Bag>((state, action) => chatReducer(state as never, action as never) as unknown as Bag, before);

/** The prose of one turn, part by part. */
const prose = (turn: Bag): string[] => ((turn.responseParts ?? []) as Bag[])
  .filter((part) => part.kind === 'markdown')
  .map((part) => String(part.content ?? ''));

const said = (one: Bag): unknown => (one.message as Bag).content;

it('answers a steering message the CLI runs after the turn\'s last answer inside that turn', async () => {
  const { session, chat, before } = await opened();
  const [first, rest] = late();
  session.begin(FIRST, 'Reply with exactly the word ALPHA and nothing else.');
  await settle();
  sdk.push(...first);
  await settle();
  expect(session.steer?.(LATE, 'Reply with exactly the word BETA and nothing else.')).toBe(true);
  await settle();
  sdk.push(...rest);
  await settle();

  // The CLI was handed the steering message under the uuid its frames answer.
  expect(sdk.handed.map((one) => one.uuid)).toEqual([FIRST, LATE]);
  // One turn, begun by the client and ended once, after the answer to the steer.
  expect(chat.filter((one) => one.type === 'chat/turnStarted')).toHaveLength(1);
  const ends = chat.filter((one) => one.type === 'chat/turnComplete' || one.type === 'chat/error');
  expect(ends).toHaveLength(1);
  expect(ends[0]).toMatchObject({ type: 'chat/turnComplete', turnId: FIRST });

  const state = replayed(before, chat);
  expect(state.activeTurn).toBeUndefined();
  const turns = state.turns as Bag[];
  expect(turns).toHaveLength(1);
  expect(turns[0]).toMatchObject({ id: FIRST, state: 'complete' });
  expect(prose(turns[0] as Bag)).toEqual(['ALPHA', 'BETA']);
  // The turn is charged for both of the CLI's turns: the second result's running total.
  expect(((turns[0] as Bag).usage as Bag)?._meta).toMatchObject({ 'ahpd.cost': { amount: 0.0038125200000000007, currency: 'USD' } });
});

it('gives a steering message whose id is not a UUID a uuid of its own, and answers it in the turn', async () => {
  const { session, chat, before } = await opened();
  const [first, rest] = late();
  session.begin(FIRST, 'Reply with exactly the word ALPHA and nothing else.');
  await settle();
  sdk.push(...first);
  await settle();
  expect(session.steer?.('s1', 'Reply with exactly the word BETA and nothing else.')).toBe(true);
  await settle();
  const uuid = String(sdk.handed[1]?.uuid ?? '');
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u);
  sdk.push(...renamed(rest, LATE, uuid));
  await settle();

  const turns = replayed(before, chat).turns as Bag[];
  expect(turns).toHaveLength(1);
  expect(prose(turns[0] as Bag)).toEqual(['ALPHA', 'BETA']);
});

it('ends the turn at its one result when the CLI folds the steering message into it', async () => {
  const { session, chat, before } = await opened();
  const [first, rest] = folded();
  session.begin(TOOL, 'Run the shell command `sleep 4` with the Bash tool, then reply with exactly the word DONE.');
  await settle();
  sdk.push(...first);
  await settle();
  expect(session.steer?.(FOLDED, 'Also, at the very end of your reply, add the word BETA2.')).toBe(true);
  await settle();
  sdk.push(...rest);
  await settle();

  const ends = chat.filter((one) => one.type === 'chat/turnComplete' || one.type === 'chat/error');
  expect(ends).toHaveLength(1);
  const state = replayed(before, chat);
  expect(state.activeTurn).toBeUndefined();
  const turns = state.turns as Bag[];
  expect(turns).toHaveLength(1);
  expect(prose(turns[0] as Bag)).toEqual(['DONE\n\nBETA2']);
});

it('answers a steering message the CLI runs after a stop in a turn that carries it', async () => {
  const { session, chat, before } = await opened();
  const [first, rest] = splitAfter(
    fixture('claude-cancelled-steer.jsonl'),
    (frame) => frame.type === 'stream_event' && (frame.event as Bag).type === 'content_block_delta',
  );
  const [queued, after] = splitAfter(rest, (frame) => frame.type === 'command_lifecycle');
  session.begin(STOPPED, 'Count from 1 to 60, one number per line, and nothing else.');
  await settle();
  sdk.push(...first);
  await settle();
  expect(session.steer?.(SURVIVOR, 'Reply with exactly the word BETA and nothing else.')).toBe(true);
  await settle();
  // The CLI queued the steering message, and the turn is stopped before it takes it in.
  sdk.push(...queued);
  await settle();
  session.cancel(STOPPED);
  await settle();
  sdk.push(...after);
  await settle();

  expect(chat.filter((one) => one.type === 'chat/turnCancelled')).toEqual([expect.objectContaining({ turnId: STOPPED })]);
  const state = replayed(before, chat);
  expect(state.activeTurn).toBeUndefined();
  const turns = state.turns as Bag[];
  expect(turns.map((turn) => [turn.id, turn.state, (turn.message as Bag).text, (turn.message as Bag).origin])).toEqual([
    [STOPPED, 'cancelled', 'Count from 1 to 60, one number per line, and nothing else.', { kind: 'user' }],
    [SURVIVOR, 'complete', 'Reply with exactly the word BETA and nothing else.', { kind: 'user' }],
  ]);
  // What the stopped answer said after the stop is not added to it, nor opened as a turn.
  expect(prose(turns[0] as Bag)).toEqual(['1\n2\n3\n4']);
  expect(prose(turns[1] as Bag)).toEqual(['BETA']);
});

it('begins a queued message only once the steering message the CLI still owed has its answer', async () => {
  const { session, chat, before } = await opened();
  const [first, rest] = late();
  const [owed, after] = splitAfter(rest, (frame) => frame.type === 'result');
  session.begin(FIRST, 'Reply with exactly the word ALPHA and nothing else.');
  await settle();
  sdk.push(...first);
  await settle();
  expect(session.steer?.(LATE, 'Reply with exactly the word BETA and nothing else.')).toBe(true);
  session.queue('q1', 'second');
  await settle();
  // The first answer's result: the steer is still owed, so the queue waits.
  sdk.push(...owed);
  await settle();
  expect(chat.filter((one) => one.type === 'chat/turnStarted')).toHaveLength(1);
  expect(sdk.handed.map(said)).not.toContain('second');

  sdk.push(...after);
  await settle();
  const started = chat.filter((one) => one.type === 'chat/turnStarted');
  expect(started).toHaveLength(2);
  expect(started[1]).toMatchObject({ queuedMessageId: 'q1' });
  expect(sdk.handed.map(said).at(-1)).toBe('second');

  const turns = replayed(before, chat).turns as Bag[];
  expect(turns).toHaveLength(1);
  expect(prose(turns[0] as Bag)).toEqual(['ALPHA', 'BETA']);
});
