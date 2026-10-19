import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlugins, pluginIdOf } from '../src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import { FRONTMATTER } from './fixtures/plugin-yaml/index.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { PluginHost, PluginSpec } from '../../sdk/src/types/plugin.js';

/*
 * Loading a plugin: resolve, manifest, import, apply.
 *
 * The fixtures are real modules loaded by the real loader, not mocks, because
 * the things under test are exactly the ones a mock would replace: that the
 * manifest is read before the import, that a module with no `apply` is named
 * and skipped, that a throw costs a line and not the daemon, and that the
 * fold sees what a plugin registered.
 */

const here = import.meta.dirname;
const fixtures = join(here, './fixtures');

const base = (): HostOptions => ({ path: '/tmp/plugin-load', agents: [echo({ path: '/tmp/plugin-load' })] });

const load = (specs: PluginSpec[]) => loadPlugins(specs, { base: base(), configDir: fixtures, cwd: here, log: () => {} });

describe('loadPlugins', () => {
  it('loads the hello fixture and folds its agent and tool in', async () => {
    const { loaded, options, contributions, problems } = await load(['./fixtures/plugin-hello']);

    expect(problems).toEqual([]);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe('hello');
    expect(loaded[0]?.path).toBe(join(fixtures, 'plugin-hello', 'index.ts'));
    expect(contributions).toHaveLength(1);
    expect(options.agents.map((one) => one.provider)).toEqual(['echo', 'hello']);
    expect(options.tools?.map((one) => one.definition.name)).toEqual(['hello_tool']);
  });

  it('reports a module with no apply and still loads the plugin after it', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-broken/index.ts', './fixtures/plugin-hello']);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('does not export an apply function');
    expect(loaded.map((one) => one.name)).toEqual(['hello']);
  });

  it('reports what a plugin threw and does not reject', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-throws/index.ts']);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('the throws fixture threw on purpose');
    expect(loaded).toEqual([]);
  });

  it('carries what a plugin said it skipped, beside the ones it found', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-skips/index.ts', './fixtures/plugin-throws/index.ts']);

    // The plugin that said one is loaded: an item skipped costs the item.
    expect(loaded.map((one) => one.name)).toEqual(['skips']);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toBe('presets.router reads OPENROUTER_API_KEY, which the daemon\'s environment does not have');
    expect(problems[1]).toContain('the throws fixture threw on purpose');
  });

  it('reports a provider two plugins share, naming the provider and both', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-hello', './fixtures/plugin-alike']);

    expect(loaded.map((one) => one.name)).toEqual(['hello', 'alike']);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('hello');
    expect(problems[0]).toContain('alike');
  });

  it('skips a spec that is turned off, in neither loaded nor problems', async () => {
    const { loaded, problems } = await load([{ name: './fixtures/plugin-hello', enabled: false }]);

    expect(loaded).toEqual([]);
    expect(problems).toEqual([]);
  });

  it('reports a spec that does not resolve and loads the next one', async () => {
    const { loaded, problems } = await load(['./fixtures/nowhere-at-all', './fixtures/plugin-hello']);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('nowhere-at-all');
    expect(loaded.map((one) => one.name)).toEqual(['hello']);
  });

  it('names a broken manifest and never imports its entry', async () => {
    delete (globalThis as Record<string, unknown>).__pluginBadManifestImported;
    const { loaded, problems } = await load(['./fixtures/plugin-bad-manifest']);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('package.json');
    expect(problems[0]).toContain('could not be read');
    expect(loaded).toEqual([]);
    expect((globalThis as Record<string, unknown>).__pluginBadManifestImported).toBeUndefined();
  });
});

describe('one plugin named twice', () => {
  it('refuses the second entry, whatever options it carries, and loads the first', async () => {
    const { loaded, options, problems } = await load([
      './fixtures/plugin-hello',
      { name: './fixtures/plugin-hello', options: { provider: 'second' } },
    ]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toBe('plugin hello is named 2 times, by ./fixtures/plugin-hello and ./fixtures/plugin-hello; write it once and use its options for variants');
    expect(loaded).toHaveLength(1);
    expect(options.agents.map((one) => one.provider)).toEqual(['echo', 'hello']);
  });

  it('refuses the second entry even when the first is switched off', async () => {
    // A switched-off entry still counts: root config would key it the same.
    const { problems } = await load([
      { name: './fixtures/plugin-hello', enabled: false },
      './fixtures/plugin-hello',
    ]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toBe('plugin hello is named 2 times, by ./fixtures/plugin-hello and ./fixtures/plugin-hello; write it once and use its options for variants');
  });

  it('refuses two specs that load the same plugin, and names both', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-hello', './fixtures/plugin-hello/index.ts']);

    expect(problems).toEqual(['plugin hello is named 2 times, by ./fixtures/plugin-hello and ./fixtures/plugin-hello/index.ts; write it once and use its options for variants']);
    expect(loaded).toHaveLength(1);
  });

  it('loads the one entry that is not a repeat', async () => {
    const { loaded, problems } = await load(['./fixtures/plugin-hello']);

    expect(problems).toEqual([]);
    expect(loaded).toHaveLength(1);
  });
});

describe('loadPlugins log', () => {
  /** A path as a pattern matches it: a Windows path's backslashes are escapes otherwise. */
  const literal = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const logged = async (specs: PluginSpec[]) => {
    const lines: string[] = [];
    const result = await loadPlugins(specs, { base: base(), configDir: fixtures, cwd: here, log: (line) => { lines.push(line); } });
    return { lines, ...result };
  };

  it('logs each plugin starting, then loaded with its time, one after another', async () => {
    const { lines, loaded } = await logged(['./fixtures/plugin-hello', './fixtures/plugin-alike']);

    expect(loaded.map((one) => one.name)).toEqual(['hello', 'alike']);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('plugin plugin-hello loading');
    expect(lines[1]).toMatch(new RegExp(`^plugin hello from ${literal(join(fixtures, 'plugin-hello', 'index.ts'))} in \\d+ ms$`));
    expect(lines[2]).toBe('plugin plugin-alike loading');
    expect(lines[3]).toMatch(new RegExp(`^plugin alike from ${literal(join(fixtures, 'plugin-alike', 'index.ts'))} in \\d+ ms$`));
  });

  it('logs a plugin whose apply throws starting, and says in its problem how long it took', async () => {
    const { lines, problems } = await logged(['./fixtures/plugin-configurable']);

    expect(lines).toEqual(['plugin plugin-configurable loading']);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^plugin configurable failed in \d+ ms: the configurable fixture must not be loaded without a token$/);
  });

  it('logs a plugin whose import throws starting, and says in its problem how long it took', async () => {
    const { lines, problems } = await logged(['./fixtures/plugin-explodes']);

    expect(lines).toEqual(['plugin plugin-explodes loading']);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(new RegExp(`^plugin plugin-explodes could not be imported from ${literal(join(fixtures, 'plugin-explodes', 'index.ts'))} in \\d+ ms: .*the explodes fixture throws when imported`));
  });
});

describe('what a plugin is handed when it is applied', () => {
  it('is a frozen context, with its own copy of the daemon\'s paths', async () => {
    delete (globalThis as Record<string, unknown>).__pluginContextWrite;
    const paths = ['/one', '/two'];
    const { loaded, problems } = await loadPlugins(['./fixtures/plugin-push/index.ts'], {
      base: base(), configDir: fixtures, cwd: here, paths, log: () => {},
    });

    // The context object is frozen, so the write to it was refused where it was
    // made rather than landing on the object the plugin was handed.
    expect((globalThis as Record<string, unknown>).__pluginContextWrite).toMatch(/read only property|not extensible/);
    expect(loaded).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^plugin push failed/);
    expect(problems[0]).toMatch(/not extensible|read only property/);
    // And the listing the daemon serves is the one it was given: what the plugin
    // was handed is a copy of it, and pushing onto the copy costs the plugin.
    expect(paths).toEqual(['/one', '/two']);
  });

  it('is a copy of a node the plugin reads itself, not the daemon\'s own option', async () => {
    const spec = { name: './fixtures/plugin-later/index.ts', options: { later: { $secret: 'host:orders' } } };
    const { loaded, problems } = await loadPlugins([spec], {
      base: base(), configDir: fixtures, cwd: here, log: () => {},
    });

    // A node the schema marks `secretAtUse` is handed on whole, and this one is
    // the plugin's own copy of it: the write is refused, and the load costs the
    // plugin a line.
    expect(loaded).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^plugin later failed/);
    expect(problems[0]).toMatch(/read only property|not extensible/);
    // What configuration wrote is where it was.
    expect(spec.options.later).toEqual({ $secret: 'host:orders' });
  });

  it('is the host\'s YAML functions, which read a frontmatter and write it back the same', async () => {
    delete (globalThis as Record<string, unknown>).__yamlWritten;
    const { loaded, problems } = await load(['./fixtures/plugin-yaml/index.ts']);

    expect(problems).toEqual([]);
    expect(loaded.map((one) => one.name)).toEqual(['yaml']);
    expect((globalThis as Record<string, unknown>).__yamlWritten).toEqual({
      fields: { id: 'helper', name: 'Helper: the first', labels: ['a', 'b'], count: 2 },
      text: FRONTMATTER,
    });
  });
});

describe('a plugin that reaches back in after apply returned', () => {
  it('is refused a registration, because the loader has taken its copy', async () => {
    delete (globalThis as Record<string, unknown>).__pluginAfterHost;
    const { loaded, problems } = await load(['./fixtures/plugin-after/index.ts']);

    expect(problems).toEqual([]);
    expect(loaded.map((one) => one.name)).toEqual(['after']);

    // What the plugin kept of the host is the host it was given, and the
    // loader sealed it the moment `apply` returned: a registration now would
    // land where the fold has already looked, so it is refused instead.
    const host = (globalThis as Record<string, unknown>).__pluginAfterHost as PluginHost;
    expect(() => {
      host.registerTool({ definition: { name: 'late', description: 'Too late', inputSchema: { type: 'object', properties: {} } }, run: () => '' });
    }).toThrow(/nothing may be registered after apply returned/);
  });
});

describe('a problem line a plugin says', () => {
  const logged = async (specs: PluginSpec[]) => {
    const lines: string[] = [];
    const result = await loadPlugins(specs, { base: base(), configDir: fixtures, cwd: here, log: (line) => { lines.push(line); } });
    return { lines, ...result };
  };

  it('is carried in the load\'s problems when it is said while applying, and not logged as well', async () => {
    delete (globalThis as Record<string, unknown>).__pluginLateProblemHost;
    const { lines, problems, loaded } = await logged(['./fixtures/plugin-late-problem/index.ts']);

    expect(loaded.map((one) => one.name)).toEqual(['late-problem']);
    expect(problems).toEqual(['late-problem: said while applying']);
    // The daemon writes the problems of a load itself, so the loader writing
    // this one too would put the same line in the log twice.
    expect(lines).not.toContain('late-problem: said while applying');
  });

  it('goes to the log when it is said after apply returned', async () => {
    delete (globalThis as Record<string, unknown>).__pluginLateProblemHost;
    const { lines, problems } = await logged(['./fixtures/plugin-late-problem/index.ts']);

    // The load has answered by now, which is the moment a plugin holding a
    // watch says a line - the bot store, refusing a record edited by hand.
    const host = (globalThis as Record<string, unknown>).__pluginLateProblemHost as PluginHost;
    host.problem('late-problem: said after apply returned');

    expect(lines).toContain('late-problem: said after apply returned');
    // And it joins no answer, because there is no answer left to join.
    expect(problems).toEqual(['late-problem: said while applying']);
  });
});

describe('a plugin file with no plugin manifest of its own', () => {
  it('is named by its name export, and never by the package it sits in', async () => {
    const said: string[] = [];
    const { problems } = await loadPlugins(['./fixtures/plugin-throws/index.ts'], {
      base: base(), configDir: fixtures, cwd: here, log: (line) => { said.push(line); },
    });
    expect(said).toContain('plugin plugin-throws loading');
    expect(said.join('\n')).not.toContain('@ahpd/server');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('plugin throws failed');
  });

  it('is checked against no other package\'s range, and named by its file when it exports no name', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ahpd-no-manifest-'));
    try {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'not-a-plugin', peerDependencies: { '@ahpd/sdk': '^99.0.0' } }));
      mkdirSync(join(root, 'src'));
      writeFileSync(join(root, 'src', 'loose.js'), 'export function apply() {}\n');
      const { loaded, problems } = await load([join(root, 'src', 'loose.js')]);
      expect(problems).toEqual([]);
      expect(loaded.map((one) => one.name)).toEqual(['loose']);
    }
    finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('a plugin id', () => {
  it('is the name the module exports, read from a switched-off entry without applying it', async () => {
    const { loaded, options, problems } = await load([{ name: './fixtures/plugin-hello', enabled: false }]);

    expect(problems).toEqual([]);
    expect(loaded).toEqual([]);
    expect(options.agents.map((one) => one.provider)).toEqual(['echo']);
    expect(pluginIdOf('./fixtures/plugin-hello')).toBe('hello');
  });

  it('is the manifest name for a switched-off entry whose import fails', async () => {
    const { problems } = await load([{ name: './fixtures/plugin-explodes', enabled: false }]);

    expect(problems).toEqual([]);
    expect(pluginIdOf('./fixtures/plugin-explodes')).toBe('plugin-explodes');
  });

  it('is the manifest name for a spec nothing has imported', () => {
    expect(pluginIdOf('./fixtures/plugin-alike/', { configDir: fixtures, cwd: here })).toBe('plugin-alike');
    expect(pluginIdOf('./fixtures/plugin-alike/')).toBe('./fixtures/plugin-alike/');
  });

  it('refuses a name the module exports that is not a slug, and never applies it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ahpd-not-a-slug-'));
    try {
      writeFileSync(join(root, 'scoped.js'), "export const name = '@acme/x';\nexport function apply() { throw new Error('applied'); }\n");
      writeFileSync(join(root, 'plain.js'), "export const name = 'plain';\nexport function apply() {}\n");
      const { loaded, problems } = await load([join(root, 'scoped.js'), join(root, 'plain.js')]);
      expect(problems).toEqual([
        'plugin @acme/x skipped: its name is not a slug: lowercase letters, digits and dashes, one to forty of them, starting with a letter',
      ]);
      expect(loaded.map((one) => one.name)).toEqual(['plain']);
    }
    finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is the manifest name with its scope joined by a dash when the module exports none', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ahpd-manifest-id-'));
    try {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: '@acme/y', type: 'module', exports: { '.': './entry.js' }, ahpd: { entry: './entry.js' } }));
      writeFileSync(join(root, 'entry.js'), 'export function apply() {}\n');
      const { loaded, problems } = await load([root]);
      expect(problems).toEqual([]);
      expect(loaded.map((one) => one.name)).toEqual(['acme-y']);
      expect(pluginIdOf(root)).toBe('acme-y');
    }
    finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses a manifest name that is still not a slug, and never applies it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ahpd-manifest-long-'));
    const long = `@acme/${'x'.repeat(40)}`;
    try {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: long, type: 'module', exports: { '.': './entry.js' }, ahpd: { entry: './entry.js' } }));
      writeFileSync(join(root, 'entry.js'), "export function apply() { throw new Error('applied'); }\n");
      const { loaded, problems } = await load([root]);
      expect(problems).toEqual([
        `plugin acme-${'x'.repeat(40)} skipped: its name is not a slug: lowercase letters, digits and dashes, one to forty of them, starting with a letter`,
      ]);
      expect(loaded).toEqual([]);
    }
    finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses a file name that is not a slug, when the module exports no name', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ahpd-file-id-'));
    try {
      writeFileSync(join(root, 'My_Plugin.js'), 'export function apply() {}\n');
      const { loaded, problems } = await load([join(root, 'My_Plugin.js')]);
      expect(problems).toEqual([
        'plugin My_Plugin skipped: its name is not a slug: lowercase letters, digits and dashes, one to forty of them, starting with a letter',
      ]);
      expect(loaded).toEqual([]);
    }
    finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
