/*
 * Every plugin this repository ships loads under its own contracts.
 *
 * The contracts are in the `ahpd` field of the package.json the loader reads,
 * and the check runs at the moment the plugin registers: a name the list does
 * not cover fails that plugin's load, so a load with no contract problem is
 * the list being complete.
 *
 * Each package is loaded by its directory, with the entry its own manifest
 * names - the built `dist`, which `pnpm -s build` produces before the tests.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlugins } from '../src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { PluginSpec } from '../../sdk/src/types/plugin.js';

const here = import.meta.dirname;
const repo = join(here, '../../..');

/** Every plugin package in this repository, by the directory it is. */
const SHIPPED = [
  'agent-acp',
  'agent-claude',
  'agent-cofold',
  'agent-pi',
  'bot',
  'computer',
  'push',
  'tasks',
  'tunnel-devtunnel',
  'webhook',
];

/**
 * What a plugin needs to apply with nothing of a person's configuration.
 *
 * ACP has no agent to register without a preset, and a preset of its own with
 * a command reaches no vendor's environment; cofold's store is held in memory
 * rather than written under the temporary configuration directory.
 */
const OPTIONS: Record<string, Record<string, unknown>> = {
  'agent-acp': { presets: { 'acp-probe': { command: 'acp-probe' } } },
  'agent-cofold': { memory: true },
};

const base = (configDir: string): HostOptions => ({ path: configDir, agents: [echo({ path: configDir })] });

describe('every shipped plugin declares its contracts', () => {
  it.each(SHIPPED)('%s loads with no contract problem', async (packageName) => {
    const configDir = mkdtempSync(join(tmpdir(), 'ahpd-contracts-'));
    try {
      const options = OPTIONS[packageName];
      const spec: PluginSpec = {
        name: join(repo, 'packages', packageName),
        ...(options === undefined ? {} : { options }),
      };
      const { loaded, problems } = await loadPlugins([spec], {
        base: base(configDir),
        configDir,
        cwd: repo,
        log: () => {},
      });

      expect(problems.filter((line) => line.includes('contracts'))).toEqual([]);
      expect(loaded).toHaveLength(1);
      // The list the check ran against is the package.json's, so a package whose
      // contracts were dropped is a failure here rather than a quiet pass.
      expect(loaded[0]?.manifest?.contracts).toBeDefined();
    }
    finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
