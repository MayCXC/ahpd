import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { posix } from '../../../tools/posix.ts';
import { WAIT_MS } from '../../../tools/wait.ts';
import { ROOT } from '../src/host.js';
import { uriOf } from '../src/resources/fileuri.js';
import { Status } from '../src/sessions/catalog.js';
import type { Agent, Listed, Start } from '../src/types/agent.js';
import type { Bag } from '../src/types/common.js';
import type { Host } from '../src/types/host.js';
import type { Peer } from '../src/types/rpc.js';
import type { Session, SubagentChat } from '../src/types/session.js';

/*
 * The terminal a call of the agent terminal tool shows.
 *
 * The reference host puts the shell's terminal on the call's own content when
 * the call is given its shell, so a client draws the call as that terminal
 * while the command runs (VS Code `copilotAgentSession.ts#L2261-L2280` at
 * `122ec4fe4431`), and keeps it on the call it completes (`#L9417-L9422`).
 * Here the backend writes its calls and the host writes the terminal, so each
 * case runs a call the way a backend does: it starts the call, runs the host's
 * `bash` with the call's id, and completes the call with the answer.
 */

const { createHost } = await import('../src/host.js');
const { shellTerminals } = await import('../src/machines/terminals.js');
const { hostTools } = await import('../src/tools/index.js');

/** Every frame the host put on the wire, in order. */
const wire: { method: string; params: Record<string, unknown> }[] = [];

function peer(): Peer {
  return {
    send: () => {},
    notify: (method, params) => { wire.push({ method, params: params as Record<string, unknown> }); },
    request: async () => ({}),
    answered: () => {},
    close: () => {},
  };
}

/** Every action dispatched on one channel, in order. */
const on = (channel: string): Bag[] => wire
  .filter((one) => one.method === 'action' && one.params.channel === channel)
  .map((one) => one.params.action as Bag);

/** Wait for something to become true, by the clock. */
const until = async (check: () => boolean): Promise<void> => {
  for (const end = Date.now() + WAIT_MS; Date.now() < end;) {
    if (check()) return;
    await new Promise((resolve) => { setTimeout(resolve, 25); });
  }
  throw new Error('waited too long');
};

/** What one turn of the backend does with its one call. */
interface Script {
  /** The input the backend hands the host's `bash`. */
  input: Record<string, unknown>;
  /** Content the backend writes on the call itself while the command runs. */
  own?: Bag[];
  /** Whether the call is a subagent's, made in a worker chat the turn opens. */
  worker?: boolean;
}

/**
 * The worker chat the last turn opened, when it opened one, and the gate its
 * call waits at, which a test opens once it has subscribed to the worker's
 * channel: a channel nobody watches is sent nothing.
 */
const seen: { worker?: string; open?: () => void } = {};

/** The gate, read when asked: the backend sets it while a test waits. */
const gate = (): (() => void) | undefined => seen.open;

/** The call every turn makes. */
const CALL = 'tc-1';

/**
 * A backend whose every turn makes one call of the host's `bash`.
 *
 * It keeps its own chat state the way the protocol's reducer would, which is
 * what a snapshot is served from, and writes nothing about the terminal: that
 * is the host's.
 */
function shelling(script: Script): Agent {
  return {
    provider: 'fake',
    displayName: 'Fake',
    schema: () => ({ type: 'object', properties: {} }),
    defaults: () => ({}),
    list: async (): Promise<Listed[]> => [],
    create: (start: Start): Session => {
      const turns: Bag[] = [];
      let active: Bag | undefined;
      // The folder a new shell opens in, as the session reports it.
      const folders = start.workingDirectory === undefined ? [] : [uriOf(start.workingDirectory)];
      return {
        uri: start.uri,
        chatUri: start.chatUri,
        models: () => [],
        agentId: () => start.uri,
        customizations: () => [],
        allTurns: () => turns,
        activity: () => (active ? 'Working' : undefined),
        status: () => (active ? Status.InProgress : Status.Idle),
        title: () => 'Shell',
        modifiedAt: () => new Date().toISOString(),
        workingDirectories: () => folders,
        settings: () => ({}),
        sessionState: () => ({
          resource: start.uri, provider: 'fake', title: 'Shell', status: active ? Status.InProgress : Status.Idle,
          lifecycle: 'ready', defaultChat: start.chatUri, chats: [{ resource: start.chatUri, title: 'Shell' }],
          workingDirectories: folders, customizations: [], config: { schema: start.schema(), values: {} },
        }),
        chatState: () => ({
          resource: start.chatUri, title: 'Shell', status: active ? Status.InProgress : Status.Idle,
          modifiedAt: new Date().toISOString(), turns,
          ...(active ? { activeTurn: active } : {}), queuedMessages: [], interactivity: 'full',
        }),
        begin: (turnId, text) => {
          const startedAt = new Date().toISOString();
          const turn: Bag = { id: turnId, startedAt, message: { text, origin: { kind: 'user' } }, responseParts: [] };
          active = turn;
          start.emit('chat', { type: 'chat/turnStarted', turnId, startedAt, message: turn.message });
          void (async () => {
            /*
             * Where the call is drawn: the session's chat, or a worker chat
             * the turn opens from a spawning call of its own, the way a
             * harness's subagent makes its calls in the worker's chat while
             * the host's tools stay bound to the session's.
             */
            let worker: SubagentChat | undefined;
            if (script.worker === true) {
              start.emit('chat', {
                type: 'chat/toolCallStart', turnId, toolCallId: 'toolu_task', toolName: 'Task', displayName: 'Task',
                _meta: { toolKind: 'subagent' },
              });
              start.emit('chat', { type: 'chat/toolCallReady', turnId, toolCallId: 'toolu_task', invocationMessage: 'Task', confirmed: 'not-needed' });
              worker = start.subagent?.('toolu_task', { title: 'Explore', prompt: 'run it' });
              if (worker === undefined) throw new Error('the host opened no worker');
              const opened = new Promise<void>((resolve) => { seen.open = resolve; });
              seen.worker = worker.uri;
              await opened;
            }
            const callTurn = worker?.turnId ?? turnId;
            const emit = (action: Bag): void => {
              if (worker === undefined) start.emit('chat', action);
              else worker.emit(action);
            };
            const call: Bag = {
              toolCallId: CALL, toolName: 'bash', displayName: 'Run command', status: 'running',
              confirmed: 'not-needed', invocationMessage: 'Run command', content: [],
            };
            if (worker === undefined) (turn.responseParts as Bag[]).push({ kind: 'toolCall', toolCall: call });
            emit({ type: 'chat/toolCallStart', turnId: callTurn, toolCallId: CALL, toolName: 'bash', displayName: 'Run command' });
            emit({ type: 'chat/toolCallReady', turnId: callTurn, toolCallId: CALL, invocationMessage: 'Run command', confirmed: 'not-needed' });
            const bash = start.tools?.find((one) => one.definition.name === 'bash');
            if (bash?.run === undefined) throw new Error('the host offered no bash');
            // Started before it is awaited: the call is given its shell at once.
            const running = Promise.resolve(bash.run(script.input, { toolCallId: CALL }));
            if (script.own !== undefined) {
              call.content = script.own;
              emit({ type: 'chat/toolCallContentChanged', turnId: callTurn, toolCallId: CALL, content: script.own });
            }
            let success = true;
            let answer: string;
            try {
              answer = await running;
            }
            catch (error) {
              success = false;
              answer = (error as Error).message;
            }
            const result = { success, pastTenseMessage: 'Ran command', content: [{ type: 'text', text: answer }] };
            Object.assign(call, { status: 'completed', ...result });
            emit({ type: 'chat/toolCallComplete', turnId: callTurn, toolCallId: CALL, result });
            if (worker !== undefined) {
              worker.end('complete');
              start.emit('chat', {
                type: 'chat/toolCallComplete', turnId, toolCallId: 'toolu_task',
                result: { success: true, pastTenseMessage: 'Task', content: [{ type: 'text', text: 'done' }] },
              });
            }
            turns.push(turn);
            active = undefined;
            start.emit('chat', { type: 'chat/turnComplete', turnId, duration: 1 });
          })();
        },
        cancel: () => {},
        queue: () => {},
        unqueue: () => {},
        setDraft: () => {},
        reorder: () => {},
        confirm: () => {},
        answer: () => false,
        setCustomizationEnabled: async () => false,
        startMcpServer: async () => false,
        stopMcpServer: async () => false,
        close: () => {},
      };
    },
  };
}

/** Every host a case opened, closed after it so no shell outlives the case. */
const opened: Host[] = [];
afterEach(async () => {
  await Promise.all(opened.splice(0).map(async (host) => { await host.close(); }));
});

const asking = (client: { handle(r: { method: string; params: unknown }): Promise<unknown> }) =>
  async (method: string, params: Record<string, unknown> = {}): Promise<unknown> => await client.handle({ method, params });

/**
 * A host with the agent terminal tool on, one session of the scripted backend
 * in a folder of its own, and one turn sent and finished.
 */
async function ran(script: Script) {
  wire.length = 0;
  delete seen.worker;
  delete seen.open;
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ahpd-call-terminal-')));
  const host = createHost({ path: dir, agents: [shelling(script)], terminals: shellTerminals(), tools: hostTools() });
  opened.push(host);
  const client = host.accept(peer());
  const ask = asking(client);
  await ask('initialize', { channel: ROOT, clientId: 'calls', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] });
  await ask('dispatchAction', { channel: ROOT, action: { type: 'root/configChanged', config: { enableCustomTerminalTool: true } } });
  await ask('createSession', { channel: 'ahp-session:/shell', provider: 'fake', workingDirectories: [uriOf(dir)] });
  const session = await ask('subscribe', { channel: 'ahp-session:/shell' }) as { snapshot: { state: { defaultChat: string } } };
  const chat = session.snapshot.state.defaultChat;
  await ask('subscribe', { channel: chat });
  void client.handle({
    method: 'dispatchAction',
    params: { channel: chat, action: { type: 'chat/turnStarted', turnId: 't1', message: { text: 'run it' } } },
  });
  if (script.worker === true) {
    await until(() => seen.worker !== undefined && gate() !== undefined);
    await ask('subscribe', { channel: seen.worker });
    gate()?.();
  }
  await until(() => on(chat).some((one) => one.type === 'chat/turnComplete'));
  const root = await ask('subscribe', { channel: ROOT }) as { snapshot: { state: { terminals?: { resource: string; claim: Bag }[] } } };
  const terminal = (root.snapshot.state.terminals ?? []).find((one) => one.claim.toolCallId === CALL)?.resource;
  return { ask, chat, terminal };
}

/** The call's content changes on the wire, in order. */
const changes = (chat: string): Bag[][] => on(chat)
  .filter((one) => one.type === 'chat/toolCallContentChanged' && one.toolCallId === CALL)
  .map((one) => one.content as Bag[]);

/** The call's completion on the wire. */
const completion = (chat: string): Bag => on(chat).find((one) => one.type === 'chat/toolCallComplete' && one.toolCallId === CALL) as Bag;

// A shell on pipes reads its commands from a pipe, which a POSIX shell does.
describe.skipIf(!posix)('the terminal of an agent terminal tool call', () => {
  it('is on the call while its command runs, and on the call it completes with the exit', async () => {
    const { ask, chat, terminal } = await ran({ input: { command: 'echo hello' } });
    expect(terminal).toMatch(/^ahp-terminal:/u);
    // The store was handed no pseudoterminal, so the shell runs on pipes.
    const block = { type: 'terminal', resource: terminal, title: 'Bash', isPty: false };
    expect(changes(chat)).toEqual([[block]]);
    const result = completion(chat).result as Bag;
    expect(result.success).toBe(true);
    expect(result.content).toEqual([
      { type: 'text', text: expect.stringMatching(/^Shell ID: \S+\nExit code: 0\nhello$/u) as unknown },
      { ...block, result: { exitCode: 0 } },
    ]);
    // A client that subscribes after reads the call as the wire left it.
    const late = await ask('subscribe', { channel: chat }) as { snapshot: { state: { turns: Bag[] } } };
    const part = (late.snapshot.state.turns[0]?.responseParts as Bag[]).find((one) => one.kind === 'toolCall') as Bag;
    expect((part.toolCall as Bag).content).toEqual(result.content);
  });

  it('names the code of a command that failed', async () => {
    const { chat, terminal } = await ran({ input: { command: 'false' } });
    const result = completion(chat).result as Bag;
    expect(result.success).toBe(false);
    expect((result.content as Bag[]).at(-1)).toEqual({ type: 'terminal', resource: terminal, title: 'Bash', isPty: false, result: { exitCode: 1 } });
  });

  it('stays on the call when the backend writes the call content of its own', async () => {
    const own = [{ type: 'text', text: 'working' }];
    const { chat, terminal } = await ran({ input: { command: 'echo hello' }, own });
    const block = { type: 'terminal', resource: terminal, title: 'Bash', isPty: false };
    // The host's, then the backend's with the terminal kept after it.
    expect(changes(chat)).toEqual([[block], [...own, block]]);
  });

  it('is on the call a subagent makes once the call completes, on the wire and in the worker chat', async () => {
    const { ask, chat, terminal } = await ran({ input: { command: 'echo hello' }, worker: true });
    const worker = seen.worker;
    if (worker === undefined) throw new Error('the turn opened no worker');
    const block = { type: 'terminal', resource: terminal, title: 'Bash', isPty: false };
    // While the command runs the terminal is written on the chat the tool is
    // bound to, as the reference writes it on its session's chat, and names no
    // call there; the worker's call shows it once its completion carries it.
    expect(changes(chat)).toEqual([[block]]);
    expect(changes(worker)).toEqual([]);
    const result = completion(worker).result as Bag;
    expect(result.content).toEqual([
      { type: 'text', text: expect.stringMatching(/^Shell ID: \S+\nExit code: 0\nhello$/u) as unknown },
      { ...block, result: { exitCode: 0 } },
    ]);
    // A client that subscribes to the worker after reads the call as the wire left it.
    const late = await ask('subscribe', { channel: worker }) as { snapshot: { state: { turns?: Bag[]; activeTurn?: Bag } } };
    const state = late.snapshot.state;
    const parts = [...(state.turns ?? []), ...(state.activeTurn === undefined ? [] : [state.activeTurn])]
      .flatMap((one) => one.responseParts as Bag[]);
    const part = parts.find((one) => one.kind === 'toolCall' && (one.toolCall as Bag).toolCallId === CALL) as Bag;
    expect((part.toolCall as Bag).content).toEqual(result.content);
  });

  it('carries no exit for a command still running when its call ends', async () => {
    const { chat, terminal } = await ran({ input: { command: 'sleep 5', timeout: 200 } });
    const result = completion(chat).result as Bag;
    expect(result.success).toBe(false);
    expect((result.content as Bag[]).at(-1)).toEqual({ type: 'terminal', resource: terminal, title: 'Bash', isPty: false });
  });
});
