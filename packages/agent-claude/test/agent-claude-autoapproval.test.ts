import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { bag } from '@ahpd/sdk';
import type { Bag, Start } from '@ahpd/sdk';

/*
 * A shell command the owner's rules already allow.
 *
 * `Start.getAutoApproval` is the host's answer to "does this run without
 * asking?", and `canUseTool` is the one place this backend sits between the
 * CLI and a question. An approved command is allowed before anything is held,
 * so no client draws a confirmation; a command the check says nothing about
 * asks as it always did. The check is read from the line the model wrote: the
 * shell hook keeps it per call, so a `shellEnv` or shell init script prefix is
 * not what the owner's rules are matched against.
 */

const sdk = vi.hoisted(() => ({
  frames: [] as Record<string, unknown>[],
  options: undefined as undefined | Record<string, unknown>,
  canUseTool: undefined as undefined | ((name: string, input: Record<string, unknown>, about?: Record<string, unknown>) => Promise<unknown>),
}));

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  getSessionMessages: async () => sdk.frames,
  query: ({ options }: { options: Record<string, unknown> }) => ({
    async *[Symbol.asyncIterator]() {
      sdk.options = options;
      sdk.canUseTool = options.canUseTool as typeof sdk.canUseTool;
      for (const frame of sdk.frames) yield frame;
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
  }),
}));

const { createSession } = await import('../src/session.js');

/** What the check is asked, in one line each. */
type Asked = { kind: string; line: string; shell: string }[];

/** The host's answer to "does this run without asking?", in one line each. */
type Check = NonNullable<Start['getAutoApproval']>;

const settle = async (times = 30): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((r) => { setTimeout(r, 0); });
};

/** A session with the owner's check, and what it said on the wire. */
async function sessionWith(check?: Check, settings: Bag = {}, shellEnv?: Record<string, string>): Promise<{
  canUseTool: NonNullable<typeof sdk.canUseTool>;
  options: Bag;
  sent: Bag[];
}> {
  sdk.frames = [];
  const sent: Bag[] = [];
  createSession({
    uri: 'ahp-session:/autoapprove',
    chatUri: 'ahp-chat:/autoapprove',
    cwd: mkdtempSync(join(tmpdir(), 'ahpd-autoapprove-')),
    emit: (_channel, action) => { sent.push(action as Bag); },
    settings,
    ...(check === undefined ? {} : { getAutoApproval: check }),
    ...(shellEnv === undefined ? {} : { shellEnv }),
  });
  await settle();
  return { canUseTool: sdk.canUseTool!, options: sdk.options!, sent };
}

/** The commands a session's check approves, and what it was asked. */
const approving = (approved: string[]): { asked: Asked; check: Check } => {
  const asked: Asked = [];
  return {
    asked,
    check: (kind, line, shell) => {
      asked.push({ kind, line, shell });
      return approved.includes(line) ? 'not-needed' as NonNullable<ReturnType<Check>> : undefined;
    },
  };
};

it('runs a command the owner\'s rules allow, without asking', async () => {
  const { asked, check } = approving(['make test']);
  const { canUseTool, sent } = await sessionWith(check);

  expect(await canUseTool('Bash', { command: 'make test' }, { toolUseID: 'toolu_allowed' }))
    .toEqual({ behavior: 'allow', updatedInput: { command: 'make test' } });
  // The line is read for bash, which is the one shell the CLI's tool is.
  expect(asked).toEqual([{ kind: 'shell', line: 'make test', shell: 'bash' }]);
  // Nothing was drawn: a call nobody was asked about is not a question that
  // was answered, and a client is not left holding a confirmation for it.
  expect(sent.filter((one) => one.type === 'session/inputNeededSet')).toEqual([]);
  expect(sent.filter((one) => one.type === 'chat/toolCallReady')).toEqual([]);
});

/** The session's `PreToolUse` hook, as the SDK would call it. */
type Hook = (input: Bag) => Promise<Bag>;

it('matches the line the model wrote, not the one the shell prefix made', async () => {
  const { asked, check } = approving(['make test']);
  const { canUseTool, options } = await sessionWith(check, {}, { SAY: 'b' });
  const hook = (((options.hooks as Bag).PreToolUse as Bag[])[0]?.hooks as Hook[])[0] as Hook;

  /*
   * What the CLI does first: the hook puts the operator's environment in
   * front of the command, and the rewritten input is what `canUseTool` is
   * handed. The rules are the owner's about the command, and the command is
   * the one the model wrote.
   */
  const hooked = await hook({ hook_event_name: 'PreToolUse', tool_use_id: 'toolu_env', tool_input: { command: 'make test' } });
  const rewritten = bag(bag(hooked.hookSpecificOutput).updatedInput);
  expect(rewritten.command).toBe("export SAY='b'\nmake test");

  expect(await canUseTool('Bash', rewritten, { toolUseID: 'toolu_env' }))
    .toEqual({ behavior: 'allow', updatedInput: rewritten });
  expect(asked).toEqual([{ kind: 'shell', line: 'make test', shell: 'bash' }]);
});

it('asks for a command no rule matches', async () => {
  const { check } = approving([]);
  const { canUseTool, sent } = await sessionWith(check);

  // Nothing settles it, so the question is held and never awaited: what the
  // test reads is the entry it put on the chat.
  void canUseTool('Bash', { command: 'make test' }, { toolUseID: 'toolu_unmatched' });
  await settle();
  expect(sent.filter((one) => one.type === 'session/inputNeededSet')).toHaveLength(1);
});

it('asks for a command a rule denies', async () => {
  // A deny and a line no rule could read are the same answer here: the host
  // says nothing about a call that is not an approval, and it asks.
  const { check } = approving([]);
  const { canUseTool, sent } = await sessionWith(check);

  void canUseTool('Bash', { command: 'rm -rf /' }, { toolUseID: 'toolu_denied' });
  await settle();
  expect(sent.filter((one) => one.type === 'session/inputNeededSet')).toHaveLength(1);
});

it('asks when the host offers no check at all', async () => {
  const { canUseTool, sent } = await sessionWith();

  void canUseTool('Bash', { command: 'make test' }, { toolUseID: 'toolu_no_check' });
  await settle();
  expect(sent.filter((one) => one.type === 'session/inputNeededSet')).toHaveLength(1);
});

it('asks the check only about a shell command', async () => {
  const { asked, check } = approving(['anything']);
  const { canUseTool, sent } = await sessionWith(check);

  void canUseTool('Read', { file_path: '/tmp/one' }, { toolUseID: 'toolu_read' });
  await settle();
  expect(asked).toEqual([]);
  expect(sent.filter((one) => one.type === 'session/inputNeededSet')).toHaveLength(1);
});

it('still refuses a command the deny list names', async () => {
  const { check } = approving(['make test']);
  const { canUseTool } = await sessionWith(check, { permissions: { allow: [], deny: ['Bash'] } });

  // The rules are the window's answer about a command; a deny list is a
  // person's answer about the tool, and it wins.
  expect(await canUseTool('Bash', { command: 'make test' }, { toolUseID: 'toolu_denied_list' }))
    .toEqual({ behavior: 'deny', message: 'Bash is denied for this session' });
});

it('still answers a call the SDK has already cancelled', async () => {
  const { asked, check } = approving(['make test']);
  const { canUseTool } = await sessionWith(check);
  const signal = AbortSignal.abort();

  // An aborted call is not one to approve, so the check is never asked.
  expect(await canUseTool('Bash', { command: 'make test' }, { toolUseID: 'toolu_aborted', signal }))
    .toEqual({ behavior: 'deny', message: 'Cancelled' });
  expect(asked).toEqual([]);
});
