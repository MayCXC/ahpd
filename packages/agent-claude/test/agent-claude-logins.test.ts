import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bag } from '@ahpd/sdk';
import type { AgentView, Bag, ConnectorOwner, Engine, PluginHost, Start } from '@ahpd/sdk';

/*
 * One Claude agent on several logins.
 *
 * A record's `logins` names connectors of `claude-login`, each holding a token
 * from `claude setup-token`. Each conversation orders them by a rendezvous
 * score and runs on the first one that is not cooling down; the CLI reads the
 * token as `CLAUDE_CODE_OAUTH_TOKEN`.
 */

/** Every CLI a session started, with the options it was given and a queue of the frames it sends. */
const sdk = vi.hoisted(() => {
  interface Fake { options: Record<string, unknown>; held: Record<string, unknown>[]; wake: (() => void) | undefined; closed: boolean }
  const state = {
    queries: [] as Fake[],
    /** Each prompt a CLI read, with the uuid it carried and the CLI that read it. */
    said: [] as { content: unknown; uuid: string | undefined; query: number }[],
    /** Every conversation the SDK deleted. */
    deleted: [] as string[],
    /** The conversations whose delete fails. */
    undeletable: new Set<string>(),
    /** Whether a closed CLI's frames end by raising, as a close may, rather than by ending. */
    raising: false,
    reset() {
      state.queries.length = 0;
      state.said.length = 0;
      state.deleted.length = 0;
      state.undeletable.clear();
      state.raising = false;
    },
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
  deleteSession: async (id: string) => {
    if (sdk.undeletable.has(id)) throw new Error(`EACCES: permission denied, unlink '${id}.jsonl'`);
    sdk.deleted.push(id);
  },
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
          if (fake.closed && sdk.raising) throw new Error('The operation was aborted');
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
      // The SDK's close ends the frames at once, and its dispose settles once
      // the CLI's process has exited, a moment later.
      [Symbol.asyncDispose]: async () => {
        fake.closed = true;
        fake.wake?.();
        await new Promise((r) => { setTimeout(r, 20); });
      },
    };
  },
}));

const { createSession } = await import('../src/session.js');
const { Cooldowns, OpenLogins } = await import('../src/logins.js');
type Logins = InstanceType<typeof OpenLogins>;

const settle = async (times = 30): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((r) => { setTimeout(r, 0); });
};

/** Wait for `done` to hold, for a second at most, and then for what follows from it. */
const until = async (done: () => boolean): Promise<void> => {
  for (let i = 0; i < 300 && !done(); i++) await new Promise((r) => { setTimeout(r, 10); });
  await settle();
};

beforeEach(() => {
  sdk.reset();
  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
});

const LOGINS = ['personal', 'work'];

/** One open login of `claude-login`, as the adapter's `open` keeps it; the answer closes it. */
const opened = (logins: Logins, id: string, token: string, owner: ConnectorOwner = 'host'): (() => void) =>
  logins.opened({ id, adapter: 'claude-login', owner, config: { token } });

/** The host's logins of these ids, open, each with the token `token-<id>`. */
const openLogins = (ids: string[] = LOGINS): Logins => {
  const logins = new OpenLogins();
  for (const id of ids) opened(logins, id, `token-${id}`);
  return logins;
};

/** A session of a record with these values, on one chat, of an agent the owner holds. */
const open = (chatUri: string, preset: Bag, extra: Record<string, unknown> = {}, logins: Logins = openLogins(), owner: ConnectorOwner = 'host') => {
  const chat: Bag[] = [];
  const session = createSession({
    uri: `ahp-session:/${chatUri}`,
    chatUri,
    cwd: mkdtempSync(join(tmpdir(), 'ahpd-logins-')),
    emit: (channel, action) => { if (channel === 'chat') chat.push(action as Bag); },
    preset,
    logins: { open: logins, owner: () => owner },
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

it('picks the pinned login for fixed rendezvous vectors', async () => {
  // Fixed vectors of the rendezvous score: a change of the score would move
  // every conversation to another account.
  for (const [key, names, expected] of [
    ['sess-a', ['personal', 'work'], 'work'],
    ['sess-b', ['personal', 'work'], 'personal'],
    ['opencode-3f2a', ['a', 'b', 'c'], 'b'],
  ] as const) {
    sdk.reset();
    open(key, { logins: [...names] }, {}, openLogins([...names]));
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
  const three = [...LOGINS, 'spare'];
  const logins = openLogins(three);
  const seen = new Set<unknown>();
  for (let i = 0; i < 30; i++) {
    open(`ahp-chat:/spread-${String(i)}`, { logins: three }, {}, logins);
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

describe('a login read from its connector', () => {
  it('leaves out a named login whose connector is not open', async () => {
    open('sess-a', { logins: ['gone', ...LOGINS] });
    await settle();
    expect(tokenOf()).toBe('token-work');
    open('ahp-chat:/only-gone', { logins: ['gone'] });
    await settle();
    expect(tokenOf()).toBeUndefined();
  });

  it("skips another person's login and takes the host's", async () => {
    const logins = new OpenLogins();
    opened(logins, 'ana-login', 'token-ana', 'user:ana');
    opened(logins, 'cy-login', 'token-cy', 'user:cy');
    opened(logins, 'host-login', 'token-host');
    open('ahp-chat:/cy', { logins: ['ana-login', 'host-login'] }, {}, logins, 'user:cy');
    await settle();
    expect(tokenOf()).toBe('token-host');
    open('ahp-chat:/cy-own', { logins: ['ana-login', 'cy-login'] }, {}, logins, 'user:cy');
    await settle();
    expect(tokenOf()).toBe('token-cy');
    open('ahp-chat:/cy-none', { logins: ['ana-login'] }, {}, logins, 'user:cy');
    await settle();
    expect(tokenOf()).toBeUndefined();
  });

  it("moves the next turn to a new CLI when a put replaces its login's token", async () => {
    const logins = openLogins();
    const { session } = open('sess-a', { logins: LOGINS }, {}, logins);
    await settle();
    expect(tokenOf()).toBe('token-work');
    session.begin('t1', 'one');
    await settle();
    sdk.push(...answered('t1'));
    await settle();

    // A put closes the connector and opens it again with the new token.
    opened(logins, 'work', 'token-work-again');
    session.begin('t2', 'two');
    await settle();
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-work-again');
    expect(sdk.said.at(-1)).toMatchObject({ content: 'two', query: 1 });
  });

  it('moves the next turn to the next login when its connector closes', async () => {
    const logins = new OpenLogins();
    opened(logins, 'personal', 'token-personal');
    const close = opened(logins, 'work', 'token-work');
    const { session } = open('sess-a', { logins: LOGINS }, {}, logins);
    await settle();
    expect(tokenOf()).toBe('token-work');
    session.begin('t1', 'one');
    await settle();
    sdk.push(...answered('t1'));
    await settle();

    close();
    session.begin('t2', 'two');
    await settle();
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-personal');
    expect(sdk.queries.at(-1)?.options.resume).toBe('cli-1');
  });

  it("runs a record's logins from the load's open connectors, through the plugin's engine", async () => {
    const { apply } = await import('../src/plugin.js');
    const engines: Engine[] = [];
    const adapters: { name: string; open: (connector: unknown) => unknown }[] = [];
    const host = {
      paths: [mkdtempSync(join(tmpdir(), 'ahpd-logins-plugin-'))],
      log: () => {},
      registerAdapter: (adapter: { name: string; open: (connector: unknown) => unknown }) => { adapters.push(adapter); },
      registerEngine: (engine: Engine) => { engines.push(engine); },
    } as unknown as PluginHost;
    await apply(host, {});
    const adapter = adapters.find((one) => one.name === 'claude-login');
    const engine = engines.find((one) => one.name === 'claude');
    if (adapter === undefined || engine === undefined) throw new Error('the plugin registered no claude-login adapter or claude engine');
    adapter.open({ id: 'work', adapter: 'claude-login', owner: 'host', config: { token: 'token-work' } });

    const view: AgentView = {
      id: 'claude-logins', engine: 'claude', owner: 'host', name: 'Logins',
      description: undefined, icon: undefined, model: undefined, config: { logins: ['work'] },
    };
    const start: Start = {
      uri: 'ahp-session:/claude-logins', chatUri: 'ahp-chat:/claude-logins', settings: {}, clientToolTimeoutMs: 60_000,
      schema: () => ({ type: 'object', properties: {} }),
      emit: () => {},
      workingDirectory: (host as unknown as { paths: string[] }).paths[0] as string,
    };
    engine.open(view).create(start);
    await settle();
    expect(tokenOf()).toBe('token-work');
  });
});

/*
 * A refused login hands the turn on.
 *
 * The frames below are the ones a real CLI on SDK 0.3.301 sent for a request a
 * local stub refused with the unified rate-limit headers: the SDK's
 * `rate_limit_event`, then a synthetic assistant frame carrying `error`, then a
 * `result` with `is_error`. A billing refusal has no event before it.
 */
const SPENT = "You've hit your session limit";
const refused = (error: string, resetsAt?: number) => [
  ...(resetsAt === undefined ? [] : [{
    type: 'rate_limit_event', session_id: 'cli-1',
    rate_limit_info: { status: 'rejected', resetsAt, rateLimitType: 'five_hour' },
  }]),
  {
    type: 'assistant', parent_tool_use_id: null, uuid: `refused-${error}`, session_id: 'cli-1', error,
    message: { id: 'msg-refused', role: 'assistant', model: '<synthetic>', content: [{ type: 'text', text: SPENT }] },
  },
  { type: 'result', subtype: 'success', is_error: true, session_id: 'cli-1', duration_ms: 5, result: SPENT },
];

/** Whether a chat was shown the synthetic reply of a refusal. */
const shownSpent = (chat: Bag[]): boolean => chat.some((action) => JSON.stringify(action).includes(SPENT));

/** The actions a chat was sent of one type, for one turn. */
const ofTurn = (chat: Bag[], type: string, turnId: string): Bag[] =>
  chat.filter((action) => action.type === type && action.turnId === turnId);

/** A session of `LOGINS` on `sess-a`, whose order is `work` then `personal`, with one turn answered on `work`. */
const answeredOnce = async (cooldowns: InstanceType<typeof Cooldowns>, extra: Record<string, unknown> = {}) => {
  const opened = open('sess-a', { logins: LOGINS }, { cooldowns, ...extra });
  await settle();
  opened.session.begin('t1', 'one');
  await settle();
  sdk.push(...answered('t1'));
  await settle();
  return opened;
};

describe('a refused login', () => {
  it('runs a turn that showed nothing again on the next login, cut back to the turn before it', async () => {
    const now = Date.now();
    const cooldowns = new Cooldowns(() => now);
    const { session, chat } = await answeredOnce(cooldowns);
    session.begin('t2', 'two');
    await settle();
    const first = sdk.said.at(-1);
    sdk.push(...refused('rate_limit', Math.floor(now / 1000) + 3600));
    await settle();

    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-personal');
    expect(sdk.queries.at(-1)?.options.resume).toBe('cli-1');
    expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBe('end-t1');
    // The same prompt, under a new uuid, to the new CLI.
    expect(sdk.said.at(-1)).toMatchObject({ content: 'two', query: 1 });
    expect(sdk.said.at(-1)?.uuid).not.toBe(first?.uuid);
    // Until the reset the event named.
    expect(cooldowns.until('work')).toBe((Math.floor(now / 1000) + 3600) * 1000);
    expect(ofTurn(chat, 'chat/error', 't2')).toEqual([]);
    expect(shownSpent(chat)).toBe(false);

    sdk.push(...answered('t2'));
    await settle();
    expect(ofTurn(chat, 'chat/turnComplete', 't2')).toHaveLength(1);
  });

  it('fails a turn that showed something, and starts the next turn on the next login', async () => {
    const cooldowns = new Cooldowns();
    const { session, chat } = await answeredOnce(cooldowns);
    session.begin('t2', 'two');
    await settle();
    sdk.push(
      { type: 'assistant', parent_tool_use_id: null, uuid: 'part-t2', session_id: 'cli-1', message: { id: 'msg-part', role: 'assistant', model: 'claude-x', content: [{ type: 'text', text: 'half an answer' }] } },
      ...refused('rate_limit'),
    );
    await settle();
    expect(sdk.queries).toHaveLength(1);
    expect(ofTurn(chat, 'chat/error', 't2')).toHaveLength(1);
    expect(cooldowns.cooling('work')).toBe(true);

    session.begin('t3', 'three');
    await settle();
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-personal');
    expect(sdk.queries.at(-1)?.options.resume).toBe('cli-1');
    expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBeUndefined();
  });

  it('starts a conversation refused on its first turn over under its id', async () => {
    const id = '0b6f3c9a-2d4e-4f81-9a7b-5c3d2e1f0a9b';
    const cooldowns = new Cooldowns();
    const { session, chat } = open(`ahp-chat:/${id}`, { logins: LOGINS }, { cooldowns, uri: `ahp-session:/${id}` });
    await settle();
    expect(sdk.queries.at(-1)?.options.sessionId).toBe(id);
    const first = tokenOf();
    session.begin('t1', 'one');
    await settle();
    sdk.push(...refused('rate_limit').map((frame) => ({ ...frame, session_id: id })));
    await until(() => sdk.queries.length === 2);

    // No entry comes before the first prompt, so the conversation goes whole and
    // a new one begins under the same id, as a chat truncated whole does.
    expect(sdk.deleted).toEqual([id]);
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).not.toBe(first);
    expect(sdk.queries.at(-1)?.options.resume).toBeUndefined();
    expect(sdk.queries.at(-1)?.options.sessionId).toBe(id);
    expect(sdk.said.at(-1)).toMatchObject({ content: 'one', query: 1 });
    expect(ofTurn(chat, 'chat/error', 't1')).toEqual([]);
  });

  it('starts a conversation over when the CLI it stopped raises as it ends', async () => {
    // A close may raise afterwards, as `consume` says of the handshake's bound.
    sdk.raising = true;
    const id = '2c4e6a8b-1d3f-4a5c-8e7f-9b0d1f2a3c4e';
    const { session, chat } = open(`ahp-chat:/${id}`, { logins: LOGINS }, { cooldowns: new Cooldowns(), uri: `ahp-session:/${id}` });
    await settle();
    session.begin('t1', 'one');
    await settle();
    sdk.push(...refused('rate_limit').map((frame) => ({ ...frame, session_id: id })));
    await until(() => sdk.queries.length === 2);
    expect(sdk.deleted).toEqual([id]);
    expect(ofTurn(chat, 'chat/error', 't1')).toEqual([]);
    expect(sdk.said.at(-1)).toMatchObject({ content: 'one', query: 1 });
  });

  it('runs the next turn of a conversation it started over', async () => {
    const id = '5e8a1c2d-3f4b-4a6c-9d7e-0f1a2b3c4d5e';
    const { session, chat } = open(`ahp-chat:/${id}`, { logins: LOGINS }, { cooldowns: new Cooldowns(), uri: `ahp-session:/${id}` });
    await settle();
    session.begin('t1', 'one');
    await settle();
    sdk.push(...refused('rate_limit').map((frame) => ({ ...frame, session_id: id })));
    await until(() => sdk.queries.length === 2);
    sdk.push(...answered('t1').map((frame) => ({ ...frame, session_id: id })));
    await settle();
    expect(ofTurn(chat, 'chat/turnComplete', 't1')).toHaveLength(1);

    // The CLI stopped for the delete ended while the delete ran, and the session
    // is not one whose CLI went away: the new one answers.
    session.begin('t2', 'two');
    await settle();
    expect(ofTurn(chat, 'chat/error', 't2')).toEqual([]);
    expect(sdk.said.at(-1)).toMatchObject({ content: 'two', query: 1 });
  });

  it('keeps a conversation it could not delete, and ends the turn with the refusal', async () => {
    const id = '7d1e2f3a-4b5c-4d6e-8f70-9a1b2c3d4e5f';
    const before = process.env.CLAUDE_CONFIG_DIR;
    const home = mkdtempSync(join(tmpdir(), 'ahpd-logins-home-'));
    process.env.CLAUDE_CONFIG_DIR = home;
    try {
      // The CLI wrote the refused prompt, and the delete of it fails.
      mkdirSync(join(home, 'projects', 'elsewhere'), { recursive: true });
      writeFileSync(join(home, 'projects', 'elsewhere', `${id}.jsonl`), '{}\n');
      sdk.undeletable.add(id);
      const { session, chat } = open(`ahp-chat:/${id}`, { logins: LOGINS }, { cooldowns: new Cooldowns(), uri: `ahp-session:/${id}` });
      await settle();
      const first = tokenOf();
      session.begin('t1', 'one');
      await settle();
      sdk.push(...refused('rate_limit').map((frame) => ({ ...frame, session_id: id })));
      await until(() => sdk.queries.length === 2);

      // The conversation comes back as it is, on the next login, and the prompt
      // is not sent again: it is in the conversation already.
      expect(sdk.deleted).toEqual([]);
      expect(sdk.queries.at(-1)?.options.resume).toBe(id);
      expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBeUndefined();
      expect(tokenOf()).not.toBe(first);
      expect(sdk.said.filter((one) => one.query === 1)).toEqual([]);
      const failed = ofTurn(chat, 'chat/error', 't1');
      expect(failed).toHaveLength(1);
      expect(JSON.stringify(failed[0])).toContain(SPENT);
      expect(JSON.stringify(failed[0])).toContain('permission denied');

      session.begin('t2', 'two');
      await settle();
      expect(ofTurn(chat, 'chat/error', 't2')).toEqual([]);
      expect(sdk.said.at(-1)).toMatchObject({ content: 'two', query: 1 });
    }
    finally {
      if (before === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = before;
    }
  });

  it('fails a turn whose turn before it has no end to cut back to, and moves the next one', async () => {
    const cooldowns = new Cooldowns();
    // A turn read back from the transcript: this process never saw its end.
    const seed = [{ id: 'r1', message: { text: 'earlier', origin: { kind: 'user' } }, responseParts: [], state: 'complete' }];
    const { session, chat } = open('sess-a', { logins: LOGINS }, { cooldowns, resume: 'cli-1', seed });
    await settle();
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('rate_limit'));
    await settle();
    expect(sdk.queries).toHaveLength(1);
    expect(ofTurn(chat, 'chat/error', 't2')).toHaveLength(1);
    expect(sdk.deleted).toEqual([]);

    session.begin('t3', 'three');
    await settle();
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-personal');
    expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBeUndefined();
  });

  it('waits for the earliest login to come back when every one cools down, and then runs on it', async () => {
    const cooldowns = new Cooldowns();
    const { session, chat } = await answeredOnce(cooldowns);
    // Another session found `personal` spent a moment ago.
    cooldowns.mark('personal', Date.now() + 1500);
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('rate_limit'));
    await settle();
    expect(sdk.queries).toHaveLength(1);
    expect(chat.some((action) => action.type === 'chat/activityChanged'
      && String(bag(action.activity).text ?? action.activity).startsWith('Waiting for a login'))).toBe(true);

    await until(() => sdk.queries.length >= 2);
    expect(sdk.queries).toHaveLength(2);
    expect(tokenOf()).toBe('token-personal');
    expect(sdk.queries.at(-1)?.options.resumeSessionAt).toBe('end-t1');
    expect(sdk.said.at(-1)).toMatchObject({ content: 'two', query: 1 });
  });

  it('ends the wait when the turn is stopped, and starts no CLI', async () => {
    const cooldowns = new Cooldowns();
    const { session, chat } = await answeredOnce(cooldowns);
    cooldowns.mark('personal', Date.now() + 1500);
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('rate_limit'));
    await settle();
    session.cancel('t2');
    await new Promise((r) => { setTimeout(r, 1800); });
    await settle();
    expect(ofTurn(chat, 'chat/turnCancelled', 't2')).toHaveLength(1);
    expect(sdk.queries).toHaveLength(1);
  });

  it('starts no CLI for a session closed while a turn waits', async () => {
    const cooldowns = new Cooldowns();
    const { session } = await answeredOnce(cooldowns);
    cooldowns.mark('personal', Date.now() + 1500);
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('rate_limit'));
    await settle();
    await session.close();
    await new Promise((r) => { setTimeout(r, 1800); });
    await settle();
    expect(sdk.queries).toHaveLength(1);
  });

  it('moves nothing for a refusal of the sign-in itself', async () => {
    const cooldowns = new Cooldowns();
    const { session, chat } = await answeredOnce(cooldowns);
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('authentication_failed'));
    await settle();
    expect(sdk.queries).toHaveLength(1);
    expect(ofTurn(chat, 'chat/error', 't2')).toHaveLength(1);
    expect(cooldowns.cooling('work')).toBe(false);
  });

  it('cools a login refused for its billing down for 10 minutes', async () => {
    const now = 1_000_000;
    const cooldowns = new Cooldowns(() => now);
    const { session } = await answeredOnce(cooldowns);
    session.begin('t2', 'two');
    await settle();
    sdk.push(...refused('billing_error'));
    await settle();
    expect(cooldowns.until('work')).toBe(now + 10 * 60_000);
    expect(tokenOf()).toBe('token-personal');
  });
});
