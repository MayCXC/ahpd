import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { echo } from '../../../examples/echo/agent.js';
import { loadPlugins } from '../../server/src/plugins.js';
import type { AgentKind, AgentView, Bag, Start } from '@ahpd/sdk';

/*
 * The `claude` kind: one record per agent.
 *
 * A record is opened by the kind rather than registered as an agent of its own,
 * so the cases here are what `open` builds and when it reads the record:
 *
 * - the kind a load registers, its form, its template, its host-only field and
 *   its key variables - and the preset agents it still registers beside it;
 * - two records opening two backends, each with its own id, name and values;
 * - an edit to a record, which the next turn reads rather than the turn that is
 *   already running, applied by restarting the CLI on the same conversation.
 */

const sdk = vi.hoisted(() => {
  interface Stream { held: Record<string, unknown>[]; wake: (() => void) | undefined; closed: boolean }
  /*
   * One stream per query, so a CLI this session put away ends where it stood
   * rather than taking the next command's frames with it. Closing is what the
   * real handle does, and a shared stream would make a restart read as one
   * session receiving everything twice.
   */
  const streams: Stream[] = [];
  return {
    options: [] as Record<string, unknown>[],
    streams,
    reset() {
      streams.length = 0;
      sdk.options = [];
    },
    open(): Stream {
      const one: Stream = { held: [], wake: undefined, closed: false };
      streams.push(one);
      return one;
    },
    /** Say a frame on the CLI that is running now. */
    push(...frames: Record<string, unknown>[]) {
      const one = streams.at(-1);
      if (one === undefined) throw new Error('no query was built');
      one.held.push(...frames);
      one.wake?.();
      one.wake = undefined;
    },
    async next(one: Stream): Promise<Record<string, unknown> | undefined> {
      while (!one.closed && one.held.length === 0) await new Promise<void>((resolve) => { one.wake = resolve; });
      return one.closed ? undefined : one.held.shift();
    },
    close(one: Stream) {
      one.closed = true;
      one.wake?.();
      one.wake = undefined;
    },
  };
});

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  query: (given: { options: Record<string, unknown> }) => {
    sdk.options.push(given.options);
    const stream = sdk.open();
    return {
      async *[Symbol.asyncIterator]() {
        for (;;) {
          const frame = await sdk.next(stream);
          if (frame === undefined) return;
          yield frame;
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
      close: () => sdk.close(stream),
    };
  },
}));

const REPO = join(import.meta.dirname, '../../..');
const SOURCE = './packages/agent-claude/src/index.ts';
const DIR = mkdtempSync(join(tmpdir(), 'ahpd-kind-'));

const settle = async (times = 30): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((done) => { setTimeout(done, 0); });
};

/** The frame a turn ends with, carrying the id the CLI knows the conversation by. */
const ended = (sessionId = 'aaaaaaaa-1111-4111-8111-111111111111'): Record<string, unknown> =>
  ({ type: 'result', subtype: 'success', is_error: false, duration_ms: 1, session_id: sessionId });

/** One load of the plugin, and the agent kinds and agents it served. */
const load = async (options: Record<string, unknown> = {}) => {
  const { loaded, problems, options: served } = await loadPlugins([{ name: SOURCE, options }], {
    base: { path: DIR, agents: [echo({ path: DIR })] },
    configDir: REPO,
    cwd: REPO,
    log: () => {},
  });
  return { loaded, problems, served };
};

/** The `claude` kind one load registered. */
const kindOf = async (): Promise<AgentKind> => {
  const { problems, served } = await load();
  expect(problems).toEqual([]);
  const kind = served.agentKinds?.['claude'];
  if (kind === undefined) throw new Error('no claude kind was registered');
  return kind;
};

/** One record, as a kind is handed it: every field read at each call. */
const viewOf = (id: string, held: () => Bag, name = id): AgentView => ({
  id,
  kind: 'claude',
  owner: 'host',
  name,
  description: undefined,
  icon: undefined,
  model: undefined,
  get config() { return held(); },
});

/** How a client asks a backend for a session of one record. */
const startOf = (id: string): Start => ({
  uri: `ahp-session:/${id}`,
  chatUri: `ahp-chat:/${id}`,
  settings: {},
  clientToolTimeoutMs: 60_000,
  schema: () => ({ type: 'object', properties: {} }),
  emit: () => {},
  workingDirectory: DIR,
});

it('registers the claude kind, its template and host-only field, and its preset agents beside it', async () => {
  const { problems, served } = await load();
  expect(problems).toEqual([]);
  const kind = served.agentKinds?.['claude'];
  expect(kind).toMatchObject({
    name: 'claude',
    title: 'Claude Code',
    hostOnly: ['extraArgs'],
    keyVariables: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'],
  });
  expect(kind?.templates?.[0]?.name).toBe('Claude Code');
  expect(typeof kind?.open).toBe('function');

  // The fields of this backend, without the four the agents channel owns: a
  // record's config is what this kind runs and nothing a second kind spells.
  const fields = Object.keys((kind?.schema.properties ?? {}) as Bag).sort();
  expect(fields).toEqual([
    'enableTasks', 'env', 'extraArgs', 'hostTasks', 'keepCliModels', 'models', 'outputStyle', 'sandbox', 'thinking',
  ]);
  for (const owned of ['name', 'description', 'icon', 'model']) expect(fields).not.toContain(owned);

  // Presets are still folded into agents of their own until task 07 migrates
  // them, so the built-in is served here as both the kind and an agent.
  expect((served.agents ?? []).slice(1).map((one) => one.provider)).toEqual(['claude']);
});

it('opens one backend per record, with the record\'s own id, name and values', async () => {
  const kind = await kindOf();
  sdk.reset();
  const one = kind.open(viewOf('claude-one', () => ({ thinking: 'disabled' }), 'One'));
  const two = kind.open(viewOf('claude-two', () => ({ sandbox: 'on' }), 'Two'));
  expect([one.provider, one.displayName]).toEqual(['claude-one', 'One']);
  expect([two.provider, two.displayName]).toEqual(['claude-two', 'Two']);

  one.create(startOf('one'));
  await settle();
  two.create(startOf('two'));
  await settle();

  // Each query is built from its own record: the first has thinking off, the
  // second the fallback and its own sandbox.
  expect(sdk.options.map((held) => held['thinking'])).toEqual([{ type: 'disabled' }, { type: 'adaptive' }]);
  expect(sdk.options.map((held) => held['settings'])).toEqual([undefined, { sandbox: { enabled: true } }]);
});

it('applies an edit at the next turn, restarting the CLI on the conversation it had', async () => {
  const kind = await kindOf();
  let held: Bag = { thinking: 'disabled' };
  sdk.reset();
  const agent = kind.open(viewOf('claude-live', () => held));
  const session = agent.create(startOf('live'));
  await settle();
  expect(sdk.options.map((one) => one['thinking'])).toEqual([{ type: 'disabled' }]);

  session.begin('t1', 'first');
  await settle();
  // The turn already running stays on the CLI it started on, even after the
  // record changes under it.
  held = { thinking: 'adaptive' };
  sdk.push(ended('s1'));
  await settle();
  expect(sdk.options).toHaveLength(1);

  session.begin('t2', 'second');
  await settle();

  // A second CLI, built from what the record says now, resumed onto the
  // conversation the first one was answering.
  expect(sdk.options.map((one) => one['thinking'])).toEqual([{ type: 'disabled' }, { type: 'adaptive' }]);
  expect(sdk.options[1]?.['resume']).toBe('s1');
});
