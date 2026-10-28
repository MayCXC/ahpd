import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Bag } from '@ahpd/sdk';

/*
 * One Claude agent on several logins, as meridian routes one proxy's accounts.
 *
 * A record's `logins` are tokens from `claude setup-token`. Each conversation
 * orders them by meridian's rendezvous score and runs on the first one that is
 * not cooling down; the CLI reads the token as `CLAUDE_CODE_OAUTH_TOKEN`.
 * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/profiles-routing.spec.md
 */

/** Every CLI a session started, with the options it was given and a queue of the frames it sends. */
const sdk = vi.hoisted(() => {
  interface Fake { options: Record<string, unknown>; held: Record<string, unknown>[]; wake: (() => void) | undefined; closed: boolean }
  const state = {
    queries: [] as Fake[],
    /** Each prompt a CLI read, with the uuid it carried and the CLI that read it. */
    said: [] as { content: unknown; uuid: string | undefined; query: number }[],
    reset() { state.queries.length = 0; state.said.length = 0; },
    /** Frames from the CLI started last. */
    push(...frames: Record<string, unknown>[]) {
      const fake = state.queries.at(-1);
      if (fake === undefined) throw new Error('no CLI was started');
      fake.held.push(...frames);
      fake.wake?.();
      fake.wake = undefined;
    },
  };
  return state;
});

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  query: ({ prompt, options }: { prompt: AsyncIterable<unknown>; options: Record<string, unknown> }) => {
    const fake = { options, held: [] as Record<string, unknown>[], wake: undefined as (() => void) | undefined, closed: false };
    const index = sdk.queries.push(fake) - 1;
    // Read at once, as the SDK reads its input, so a prompt reaches the CLI started last.
    void (async () => {
      for await (const frame of prompt) {
        const { message, uuid } = frame as { message?: { content?: unknown }; uuid?: string };
        sdk.said.push({ content: message?.content, uuid, query: index });
      }
    })();
    return {
      async *[Symbol.asyncIterator]() {
        for (;;) {
          while (fake.held.length > 0) yield fake.held.shift() as Record<string, unknown>;
          if (fake.closed) return;
          await new Promise<void>((resolve) => { fake.wake = resolve; });
        }
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
      close: () => { fake.closed = true; fake.wake?.(); },
    };
  },
}));

const { createSession } = await import('../src/session.js');
const { Cooldowns } = await import('../src/logins.js');

const settle = async (times = 30): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((r) => { setTimeout(r, 0); });
};

beforeEach(() => {
  sdk.reset();
  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
});

const LOGINS = [
  { name: 'personal', token: 'token-personal' },
  { name: 'work', token: 'token-work' },
];

/** A session of a record with these values, on one chat. */
const open = (chatUri: string, preset: Bag, extra: Record<string, unknown> = {}) => {
  const chat: Bag[] = [];
  const session = createSession({
    uri: `ahp-session:/${chatUri}`,
    chatUri,
    cwd: mkdtempSync(join(tmpdir(), 'ahpd-logins-')),
    emit: (channel, action) => { if (channel === 'chat') chat.push(action as Bag); },
    preset,
    ...extra,
  });
  return { session, chat };
};

/** The token the CLI started `at` (the last by default) signs in with. */
const tokenOf = (at = -1): unknown => (sdk.queries.at(at)?.options.env as Bag | undefined)?.['CLAUDE_CODE_OAUTH_TOKEN'];

/** A turn the CLI answered and ended, as its frames come. */
const answered = (id: string) => [
  { type: 'assistant', parent_tool_use_id: null, uuid: `end-${id}`, session_id: 'cli-1', message: { id: `msg-${id}`, role: 'assistant', model: 'claude-x', content: [{ type: 'text', text: `answer ${id}` }] } },
  { type: 'result', subtype: 'success', is_error: false, session_id: 'cli-1', duration_ms: 5 },
];

it("picks meridian's account for meridian's pinned sessions", async () => {
  // Pinned in meridian's routing.ts as RENDEZVOUS_STABLE_GUARD: a change of the
  // score would move every conversation to another account.
  for (const [key, names, expected] of [
    ['sess-a', ['personal', 'work'], 'work'],
    ['sess-b', ['personal', 'work'], 'personal'],
    ['opencode-3f2a', ['a', 'b', 'c'], 'b'],
  ] as const) {
    sdk.reset();
    open(key, { logins: names.map((name) => ({ name, token: `token-${name}` })) });
    await settle();
    expect(tokenOf(), key).toBe(`token-${expected}`);
  }
});

it('starts one chat on the same login every time it opens', async () => {
  open('ahp-chat:/same', { logins: LOGINS });
  await settle();
  const first = tokenOf();
  open('ahp-chat:/same', { logins: LOGINS });
  await settle();
  expect(first).toBeDefined();
  expect(tokenOf()).toBe(first);
});

it('spreads conversations over the logins', async () => {
  const three = [...LOGINS, { name: 'spare', token: 'token-spare' }];
  const seen = new Set<unknown>();
  for (let i = 0; i < 30; i++) {
    open(`ahp-chat:/spread-${String(i)}`, { logins: three });
    await settle(2);
    seen.add(tokenOf());
  }
  expect(seen.size).toBeGreaterThan(1);
});

it('keeps a pushed credential and the record env, with the login between them', async () => {
  open('sess-a', { logins: LOGINS, env: { ANTHROPIC_BASE_URL: 'https://example.invalid' } }, { env: { ANTHROPIC_API_KEY: 'pushed' } });
  await settle();
  const env = sdk.queries.at(-1)?.options.env as Bag;
  expect(env['CLAUDE_CODE_OAUTH_TOKEN']).toBe('token-work');
  expect(env['ANTHROPIC_API_KEY']).toBe('pushed');
  expect(env['ANTHROPIC_BASE_URL']).toBe('https://example.invalid');
});

it('adds no token for a record with no logins', async () => {
  open('ahp-chat:/none', {});
  await settle();
  expect(tokenOf()).toBeUndefined();
});

it('runs on the first of its order when every login cools down', async () => {
  const cooldowns = new Cooldowns(() => 1000);
  cooldowns.mark('personal', 5000);
  cooldowns.mark('work', 5000);
  open('sess-a', { logins: LOGINS }, { cooldowns });
  await settle();
  expect(tokenOf()).toBe('token-work');
});

it('keeps its login while the login works, and moves when it cools down', async () => {
  let now = 1000;
  const cooldowns = new Cooldowns(() => now);
  const { session } = open('sess-a', { logins: LOGINS }, { cooldowns });
  await settle();
  expect(tokenOf()).toBe('token-work');

  session.begin('t1', 'one');
  await settle();
  sdk.push(...answered('t1'));
  await settle();
  session.begin('t2', 'two');
  await settle();
  // The same CLI answers the second turn: nothing moved.
  expect(sdk.queries).toHaveLength(1);
  sdk.push(...answered('t2'));
  await settle();

  // Another session of the agent found `work` spent.
  cooldowns.mark('work', now + 60_000);
  session.begin('t3', 'three');
  await settle();
  expect(sdk.queries).toHaveLength(2);
  expect(tokenOf()).toBe('token-personal');
  // Resumed into the conversation the first CLI named, with nothing cut.
  expect(sdk.queries.at(-1)?.options.resume).toBe('cli-1');
  expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBeUndefined();
  expect(sdk.said.at(-1)).toMatchObject({ content: 'three', query: 1 });

  // A cooldown that ended leaves the conversation where it is.
  sdk.push(...answered('t3'));
  await settle();
  now += 120_000;
  session.begin('t4', 'four');
  await settle();
  expect(sdk.queries).toHaveLength(2);
});
