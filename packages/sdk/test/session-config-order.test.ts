import { beforeEach, expect, it, vi } from 'vitest';
import type { HostOptions } from '../src/types/host.js';
import type { Worktrees } from '../src/types/worktrees.js';
import { hello, peer, resetSdk, serving } from './support/host.js';

vi.mock('@anthropic-ai/claude-agent-sdk', async () => (await import('./support/claude-sdk.js')).fake);

beforeEach(resetSdk);

/*
 * The order a session's settings come in.
 *
 * A client draws the form in the order the properties arrive, so the order is
 * the form: the computer a session runs on, then where it works and from which
 * branch, then the agent's own settings. The same order is reported on a
 * running session, whose schema comes from the other fold and is drawn as the
 * chips above the box.
 */

/** A repository the form can read, without git: nothing here makes a tree. */
const repository = (): Worktrees => ({
  repository: async () => '/home/softov/project',
  branches: async () => ['main', 'release'],
  create: async () => {},
  dirty: async () => false,
  remove: async () => {},
});

/** What the computer plugin registers: the machine a session runs in. */
const COMPUTER = { computer: { type: 'string', title: 'Computer', sessionMutable: false } };

/** The keys a new session form offers, in the order it draws them. */
const form = async (over: Partial<HostOptions> = {}): Promise<string[]> => {
  const client = serving('/home/softov', [], over).accept(peer());
  await client.handle(hello(['0.9.0']));
  const cfg = await client.handle({ method: 'resolveSessionConfig', params: {} }) as {
    schema: { properties: Record<string, unknown> };
  };
  return Object.keys(cfg.schema.properties);
};

it('starts the new session form with the computer, then isolation and branch', async () => {
  const keys = await form({ worktrees: repository(), sessionConfig: COMPUTER });
  expect(keys.slice(0, 3)).toEqual(['computer', 'isolation', 'branch']);
  // The agent's own settings come after the host's, in the order it declared.
  expect(keys).toContain('permissionMode');
  expect(keys.indexOf('permissionMode')).toBeGreaterThan(keys.indexOf('branch'));
});

it('starts with isolation on a host that serves no computer plugin', async () => {
  const keys = await form({ worktrees: repository() });
  expect(keys.slice(0, 2)).toEqual(['isolation', 'branch']);
});

it('reports a running session in the same order', async () => {
  const client = serving('/home/softov', [], { worktrees: repository(), sessionConfig: COMPUTER }).accept(peer());
  await client.handle(hello(['0.9.0']));
  // A folder given, because isolation is what a session in a repository is
  // offered: a session with none has no isolation to show.
  const uri = 'ahp-session:/ordered';
  await client.handle({
    method: 'createSession',
    params: { channel: uri, provider: 'claude', workingDirectories: ['file:///home/softov/project'] },
  });
  const state = (await client.handle({ method: 'subscribe', params: { channel: uri } }) as {
    snapshot: { state: { config: { schema: { properties: Record<string, unknown> } } } };
  }).snapshot.state;
  expect(Object.keys(state.config.schema.properties).slice(0, 3)).toEqual(['computer', 'isolation', 'branch']);
});
