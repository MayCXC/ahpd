import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';

/*
 * Which conversation a session picks up, by what the CLI wrote.
 *
 * The host resumes every chat it recorded by the id its conversation is under,
 * and the CLI writes a conversation only when its first message reaches it. A
 * chat nobody spoke to, or one whose CLI could not sign in, has an id with
 * nothing behind it, and the CLI ends at startup rather than resume that. So a
 * session resumes a conversation the CLI wrote, wherever it wrote it, and starts
 * any other under the id it was asked to resume.
 */

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  createSdkMcpServer: (given: Record<string, unknown>) => ({ type: 'sdk', name: given.name, tools: given.tools }),
  query: ({ options }: { options: Record<string, unknown> }) => {
    sdk.options.push(options);
    return {
      async *[Symbol.asyncIterator]() { /* nothing streamed */ },
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

const { claude } = await import('../src/claude.js');

const home = realpathSync(mkdtempSync(join(tmpdir(), 'ahpd-claude-resume-')));
const FOLDER = join(home, 'work');
const OTHER = join(home, 'elsewhere');
mkdirSync(FOLDER, { recursive: true });
mkdirSync(OTHER, { recursive: true });
const before = process.env.CLAUDE_CONFIG_DIR;
process.env.CLAUDE_CONFIG_DIR = join(home, 'config');
afterAll(() => {
  if (before === undefined) delete process.env.CLAUDE_CONFIG_DIR;
  else process.env.CLAUDE_CONFIG_DIR = before;
  rmSync(home, { recursive: true, force: true });
});

/** The transcript the CLI writes for a conversation of `folder`, with one line in it. */
const written = (id: string, folder: string): void => {
  const project = join(home, 'config', 'projects', folder.replace(/[^A-Za-z0-9]/g, '-'));
  mkdirSync(project, { recursive: true });
  writeFileSync(join(project, `${id}.jsonl`), '{}\n');
};

const settle = async (times = 8): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((done) => { setTimeout(done, 0); });
};

/** The `query()` options of a session in `FOLDER` that `create` built from these start fields. */
const started = async (start: Record<string, unknown>): Promise<Record<string, unknown>> => {
  sdk.options = [];
  claude({ paths: [FOLDER] }).create({
    uri: 'ahp-session:/resume',
    chatUri: 'ahp-chat:/resume',
    workingDirectory: FOLDER,
    settings: {},
    clientToolTimeoutMs: 0,
    schema: () => ({ type: 'object', properties: {} }),
    emit: () => {},
    ...start,
  });
  await settle();
  const one = sdk.options.at(0);
  if (one === undefined) throw new Error('no query was built');
  return one;
};

const NEVER = '0a0a0a0a-1111-4111-8111-000000000001';
const HERE = '0a0a0a0a-1111-4111-8111-000000000002';
const THERE = '0a0a0a0a-1111-4111-8111-000000000003';
const PEER = '0a0a0a0a-1111-4111-8111-000000000004';
const FORKED = '0a0a0a0a-1111-4111-8111-000000000005';

it('starts a conversation the CLI never wrote under the id it was asked to resume', async () => {
  const options = await started({ resume: NEVER });
  expect(options).not.toHaveProperty('resume');
  expect(options).toMatchObject({ sessionId: NEVER });
});

it('keeps a chat\'s own id for a conversation the CLI never wrote', async () => {
  const options = await started({ chatId: PEER, resume: PEER });
  expect(options).not.toHaveProperty('resume');
  expect(options).toMatchObject({ sessionId: PEER });
});

it('carries no fork point beside a conversation it starts, and starts it under the chat\'s own id', async () => {
  const options = await started({ chatId: FORKED, resume: NEVER, forkAt: 'entry', rewindAt: 'entry' });
  expect(options).not.toHaveProperty('resume');
  expect(options).not.toHaveProperty('forkSession');
  expect(options).not.toHaveProperty('resumeSessionAt');
  expect(options).toMatchObject({ sessionId: FORKED });
});

it('resumes a conversation the CLI wrote under the folder\'s own project', async () => {
  written(HERE, FOLDER);
  const options = await started({ resume: HERE });
  expect(options).toMatchObject({ resume: HERE });
  expect(options).not.toHaveProperty('sessionId');
});

it('resumes a conversation the CLI wrote under another folder\'s project, which its resume finds', async () => {
  written(THERE, OTHER);
  const options = await started({ resume: THERE, forkAt: 'entry' });
  expect(options).toMatchObject({ resume: THERE, forkSession: true, resumeSessionAt: 'entry' });
});
