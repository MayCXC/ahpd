/*
 * The agents a setup can find, and the install lines it shows for them.
 *
 * Two things are worth a test: that every npm part of the machine images has a
 * row whose line names the package the part installs, and that a row answers a
 * system with its own line, the shared one, or nothing at all. The lines
 * themselves are the vendors' own, checked on the date in the source header;
 * this file is about the shape that keeps them findable.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { installLine, knownAgents, type KnownAgent } from '../src/agents.js';

/** One part of `versions.json`, as far as this file reads it. */
interface Part {
  id: string;
  kind: string;
  packages?: string[];
}

const parts = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../computer/images/versions.json'), 'utf8'),
) as Part[];

it('gives every npm agent part an install line that names its first package', () => {
  const npm = parts.filter((part) => part.kind === 'npm');
  // A part with no packages would make the loop below pass without asking
  // anything of the line, so the file is checked for the shape it promises.
  expect(npm.length).toBeGreaterThan(0);
  /*
   * Claude is the one npm part that is not an ACP agent: `@ahpd/agent-claude`
   * is the native backend configure asks about, so it has no row here and a
   * `claude` found on PATH is shown under "Also found". Every other npm part is
   * an ACP agent, and each of those has to have a row whose line installs the
   * package the part names.
   */
  const agents = npm.filter((part) => part.id !== 'claude');
  for (const part of agents) {
    const agent = knownAgents[part.id];
    expect(agent, `${part.id} has no row in knownAgents`).toBeDefined();
    const packageName = part.packages?.[0];
    expect(packageName, `${part.id} has no package`).toBeDefined();
    expect(installLine(agent as KnownAgent, 'linux')).toContain(packageName);
  }
});

it('gives every row a command, and an install line or a page', () => {
  for (const [id, agent] of Object.entries(knownAgents)) {
    expect(agent.command, `${id} has no command`).not.toBe('');
    const lines = (['linux', 'darwin', 'win32'] as const)
      .map((system) => installLine(agent, system))
      .filter((line): line is string => line !== undefined && line !== '');
    const page = agent.page;
    expect(
      lines.length > 0 || (page !== undefined && page !== ''),
      `${id} has neither an install line nor a page`,
    ).toBe(true);
  }
});

it('takes a system line over all, and gives nothing when a row has neither', () => {
  const row: KnownAgent = {
    id: 'one',
    name: 'One',
    command: 'one',
    install: { all: 'npm i -g one', linux: 'apt install one' },
  };
  expect(installLine(row, 'linux')).toBe('apt install one');
  expect(installLine(row, 'darwin')).toBe('npm i -g one');
  expect(installLine(row, 'win32')).toBe('npm i -g one');
  expect(installLine(row, 'freebsd')).toBe('npm i -g one');

  const pageOnly: KnownAgent = { id: 'two', name: 'Two', command: 'two', page: 'https://example.com/two' };
  expect(installLine(pageOnly, 'linux')).toBeUndefined();
  expect(installLine(pageOnly, 'win32')).toBeUndefined();
});
