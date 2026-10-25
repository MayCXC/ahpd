import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { describePlugin, pluginIdsOf, pluginLine } from '../src/plugins.js';
import { sdkVersion } from '../../sdk/src/version.js';
import type { PluginSpec } from '../../sdk/src/types/plugin.js';

/*
 * The listing: what a run would load, without loading any of it.
 *
 * Every case here is about the same promise - that a listing reads manifests
 * and never imports - so the fixtures include one that throws the moment it is
 * imported and one whose `apply` would throw. Seeing either of them listed as
 * `ready` is the proof that nothing ran.
 */

const here = import.meta.dirname;
const fixtures = join(here, './fixtures');

const listing = (spec: PluginSpec) => describePlugin(spec, { configDir: fixtures, cwd: here });

let loose: string | undefined;
afterEach(() => {
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});

describe('describePlugin', () => {
  it('reads a path, a name and a title out of an ahpd manifest', async () => {
    const row = await listing('./fixtures/plugin-hello');
    expect(row.state).toBe('ready');
    // The key is the spec as written, which is what `plugin enable` takes; what
    // the module calls itself is the row's `module`.
    expect(row.name).toBe('plugin-hello');
    expect(row.module).toBe('plugin-hello');
    expect(row.title).toBe('Hello');
    expect(row.path).toBe(join(fixtures, 'plugin-hello', 'index.ts'));
  });

  it('lists a package with no ahpd key by its package name and no title', async () => {
    const row = await listing('./fixtures/plugin-plain');
    expect(row.state).toBe('ready');
    expect(row.module).toBe('plugin-plain');
    expect(row.title).toBeUndefined();
    expect(row.path).toBe(join(fixtures, 'plugin-plain', 'index.js'));
  });

  it('lists a single file with no manifest at all as error, naming plugin.json and the entry, with no import', async () => {
    delete (globalThis as Record<string, unknown>).__pluginBareImported;
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    writeFileSync(join(loose, 'bare.js'), "globalThis.__pluginBareImported = true;\nexport function apply() {}\n");
    const row = await listing(join(loose, 'bare.js'));

    expect(row.state).toBe('error');
    // No manifest names it, so the row is keyed by the spec as written.
    expect(row.name).toBe(join(loose, 'bare.js'));
    expect(row.problem).toContain('has no manifest');
    expect(row.problem).toContain('plugin.json');
    expect(row.problem).toContain('entry');
    expect((globalThis as Record<string, unknown>).__pluginBareImported).toBeUndefined();
  });

  it('lists a single file by the plugin.json beside it, and never imports it', async () => {
    delete (globalThis as Record<string, unknown>).__pluginBesideImported;
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    writeFileSync(join(loose, 'plugin.json'), JSON.stringify({ id: 'beside', main: 'beside.js', description: 'Describes itself from beside.' }));
    writeFileSync(join(loose, 'beside.js'), "globalThis.__pluginBesideImported = true;\nexport function apply() {}\n");
    const row = await listing(join(loose, 'beside.js'));

    expect(row.state).toBe('ready');
    expect(row.name).toBe('beside');
    expect(row.manifest?.description).toBe('Describes itself from beside.');
    expect((globalThis as Record<string, unknown>).__pluginBesideImported).toBeUndefined();
  });

  it('lists a file whose nearest package.json is not a plugin\'s by its entry, unchecked by that package', async () => {
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    writeFileSync(join(loose, 'package.json'), JSON.stringify({ name: 'not-a-plugin', peerDependencies: { '@ahpd/sdk': '^99.0.0' } }));
    mkdirSync(join(loose, 'plugin-x'));
    writeFileSync(join(loose, 'plugin-x', 'index.js'), 'export const x = 1;\n');
    const row = await listing({ id: 'plugin-x', source: join(loose, 'plugin-x', 'index.js') });

    expect(row.state).toBe('ready');
    expect(row.module).toBe('plugin-x');
  });

  it('lists a fixture file by its plugin.json, not by the server package above it', async () => {
    const row = await listing('./fixtures/plugin-throws/index.ts');
    expect(row.module).toBe('throws');
    expect(row.title).toBeUndefined();
  });

  it('takes a plugin package\'s manifest for a file inside it', async () => {
    const row = await listing(join(here, '..', '..', 'agent-claude', 'src', 'index.ts'));
    expect(row.module).toBe('@ahpd/agent-claude');
    expect(row.title).toBe('Agent Claude');
  });

  it('lists a spec that does not resolve as missing, with its problem and no path', async () => {
    const row = await listing('./fixtures/nowhere-at-all');
    expect(row.state).toBe('missing');
    expect(row.path).toBeUndefined();
    expect(row.problem).toContain('nowhere-at-all');
    expect(pluginLine(row)).toContain('nowhere-at-all');
  });

  it('lists a module that throws on import as ready, because nothing imported it', async () => {
    const row = await listing('./fixtures/plugin-explodes');
    expect(row.state).toBe('ready');
    expect(row.title).toBe('Explodes');
  });

  it('describes a switched-off package plugin from its package.json, and calls it disabled', async () => {
    const row = await listing({ source: './fixtures/plugin-declared', enabled: false });

    expect(row.state).toBe('disabled');
    expect(row.path).toBe(join(fixtures, 'plugin-declared', 'index.ts'));
    expect(row.title).toBe('Declared');
    expect(row.version).toBe('1.0.0');
    expect(row.manifest).toEqual({
      description: 'Declares its manifest in its package.json.',
      categories: ['tool'],
      links: [{ title: 'Docs', url: 'https://ahpd.dev/plugins' }],
      contracts: { agents: ['declared'] },
    });
  });

  it('describes a switched-off standalone plugin from its plugin.json', async () => {
    const row = await listing({ source: './fixtures/plugin-standalone/plugin.json', enabled: false });

    expect(row.state).toBe('disabled');
    expect(row.module).toBe('standalone');
    expect(row.title).toBe('Standalone');
    expect(row.version).toBe('1.2.3');
    expect(row.manifest).toEqual({
      id: 'standalone',
      name: 'Standalone',
      version: '1.2.3',
      description: 'Describes itself from a plugin.json.',
      categories: ['tool'],
      links: [{ title: 'Docs', url: 'https://ahpd.dev/plugins' }],
      contracts: { tools: ['standalone_tool'] },
    });
  });

  it('describes a switched-off plugin whose module throws on import, and says nothing is wrong', async () => {
    const row = await listing({ source: './fixtures/plugin-explodes', enabled: false });

    expect(row.state).toBe('disabled');
    expect(row.title).toBe('Explodes');
    expect(row.version).toBe('1.0.0');
    expect(row.problem).toBeUndefined();
  });

  it('lists a manifest option the configuration does not set as unconfigured', async () => {
    const missing = await listing({ name: './fixtures/plugin-configurable' });
    expect(missing.state).toBe('unconfigured');
    expect(missing.problem).toContain('token');

    const given = await listing({ name: './fixtures/plugin-configurable', options: { token: 'shh' } });
    expect(given.state).toBe('ready');
  });

  it('lists an incompatible peer range without importing the entry', async () => {
    delete (globalThis as Record<string, unknown>).__pluginIncompatibleImported;
    const row = await listing('./fixtures/plugin-incompatible');

    expect(row.state).toBe('incompatible');
    expect(row.problem).toContain('^99.0.0');
    expect(row.problem).toContain(sdkVersion());
    expect((globalThis as Record<string, unknown>).__pluginIncompatibleImported).toBeUndefined();
  });

  it('lists a manifest that does not parse as error, naming the file', async () => {
    const row = await listing('./fixtures/plugin-bad-manifest');
    expect(row.state).toBe('error');
    expect(row.problem).toContain('package.json');
  });

  it('lists a manifest id that is not a slug as error, the way a load refuses it', async () => {
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    writeFileSync(join(loose, 'My_Plugin.js'), 'export function apply() {}\n');
    const row = await listing({ id: 'My_Plugin', source: join(loose, 'My_Plugin.js') });

    expect(row.state).toBe('error');
    expect(row.name).toBe('My_Plugin');
    expect(row.problem).toBe('its name is not a slug: lowercase letters, digits and dashes, one to forty of them, starting with a letter');
    expect(pluginLine(row)).toMatch(/^error My_Plugin /);
  });

  it('lists a manifest name that is not a slug once its scope is joined as error', async () => {
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    const long = `@acme/${'x'.repeat(40)}`;
    writeFileSync(join(loose, 'package.json'), JSON.stringify({ name: long, type: 'module', exports: { '.': './entry.js' }, ahpd: { entry: './entry.js' } }));
    writeFileSync(join(loose, 'entry.js'), 'export function apply() {}\n');
    const row = await listing(loose);

    expect(row.state).toBe('error');
    expect(row.name).toBe(`acme-${'x'.repeat(40)}`);
    expect(row.problem).toContain('not a slug');
  });

  it('lists a scoped manifest name as ready by the slug a load gives it', async () => {
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    writeFileSync(join(loose, 'package.json'), JSON.stringify({ name: '@acme/y', type: 'module', exports: { '.': './entry.js' }, ahpd: { entry: './entry.js' } }));
    writeFileSync(join(loose, 'entry.js'), 'export function apply() {}\n');
    const row = await listing(loose);

    expect(row.state).toBe('ready');
    expect(row.name).toBe('acme-y');
    expect(row.module).toBe('@acme/y');
  });

  it('lists a module that exports a name that is not a slug as error once the ids are read', async () => {
    loose = mkdtempSync(join(tmpdir(), 'ahpd-loose-'));
    mkdirSync(join(loose, 'scoped'));
    const dir = join(loose, 'scoped');
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'scoped', type: 'module', ahpd: { entry: './entry.js' } }));
    writeFileSync(join(dir, 'entry.js'), "export const name = '@acme/x';\nexport function apply() {}\n");
    await pluginIdsOf([dir], { configDir: fixtures, cwd: here });
    const row = await listing(dir);

    expect(row.state).toBe('error');
    expect(row.name).toBe('@acme/x');
    expect(row.problem).toContain('not a slug');
  });
});
