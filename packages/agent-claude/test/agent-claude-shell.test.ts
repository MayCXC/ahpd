import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import type { BoundTool } from '@ahpd/sdk';

/*
 * The host's agent terminal tool in place of Claude's own shell.
 *
 * The host marks its `bash` as taking the place of the harness's own shell,
 * and the Agent SDK's way to do that is to disallow `Bash` and alias the name
 * to the host's tool, so a `Bash` call a skill wrote reaches the shell the
 * person can see. A host tool that is not marked leaves `Bash` alone. The
 * query's options are what the CLI is started with, and the tool's handler is
 * what the CLI calls.
 */

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  query: ({ options }: { options: Record<string, unknown> }) => {
    sdk.options.push(options);
    return {
      async *[Symbol.asyncIterator]() {},
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

const sdk = vi.hoisted(() => ({ options: [] as Record<string, unknown>[] }));

const { createSession } = await import('../src/session.js');

const settle = async (times = 8): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((done) => { setTimeout(done, 0); });
};

/** A host `bash`, marked or not, that keeps what each call told it. */
const bash = (marked: boolean, seen: unknown[] = []): BoundTool => ({
  definition: { name: 'bash', description: 'Run a command.', inputSchema: { type: 'object', properties: { command: { type: 'string' } } } },
  ...(marked ? { overridesBuiltInTool: true } : {}),
  run: (_input, call) => { seen.push(call); return 'ran'; },
});

/** One session's `query()` options, over these tools and settings. */
const queried = async (tools: BoundTool[], settings: Record<string, unknown> = {}): Promise<Record<string, unknown>> => {
  sdk.options = [];
  createSession({
    uri: 'ahp-session:/shell',
    chatUri: 'ahp-chat:/shell',
    cwd: mkdtempSync(join(tmpdir(), 'ahpd-shell-')),
    emit: () => {},
    tools,
    settings,
  });
  await settle();
  const one = sdk.options.at(0);
  if (one === undefined) throw new Error('no query was built');
  return one;
};

it('disallows its own Bash and aliases the name to the host\'s shell', async () => {
  const options = await queried([bash(true)]);
  expect(options.disallowedTools).toEqual(['Bash']);
  expect(options.toolAliases).toEqual({ Bash: 'mcp__ahp__bash' });
});

it('keeps its own Bash beside a host tool of the name that takes no place', async () => {
  const options = await queried([bash(false)]);
  expect(options.disallowedTools).toBeUndefined();
  expect(options.toolAliases).toBeUndefined();
});

it('keeps a person\'s deny list, and names Bash in it once', async () => {
  const options = await queried([bash(true)], { permissions: { deny: ['Bash', 'WebFetch'] } });
  expect(options.disallowedTools).toEqual(['Bash', 'WebFetch']);
});

it('tells the host\'s tool the call the CLI names', async () => {
  const seen: unknown[] = [];
  const options = await queried([bash(true, seen)]);
  const tools = (options.mcpServers as Record<string, { tools: { name: string; handler: (input: unknown, extra?: unknown) => Promise<unknown> }[] }>).ahp?.tools ?? [];
  const handler = tools.find((one) => one.name === 'bash')?.handler;
  await handler?.({ command: 'ls' }, { _meta: { 'claudecode/toolUseId': 'toolu_shell' } });
  await handler?.({ command: 'ls' }, {});
  expect(seen).toEqual([{ toolCallId: 'toolu_shell' }, undefined]);
});
