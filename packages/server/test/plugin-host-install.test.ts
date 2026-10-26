import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadPlugins } from '../src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import type { Ran, Runner } from '../src/install.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { InstallAnswer, PluginSpec } from '../../sdk/src/types/plugin.js';

/*
 * What `host.install` does for a plugin.
 *
 * A plugin with a folder of its own installs one npm package into an
 * `installed/` folder inside that folder, with flags that keep npm to the one
 * package and its own lockfile. npm is a fake here, so no test reaches the
 * registry: it records the command line, answers as the case says, and writes
 * the package.json a real npm would leave. One plugin's installs run one at a
 * time, and a plugin with no folder is answered with an error rather than a
 * folder made up for it.
 */

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-plugin-host-install-'));
  delete (globalThis as Record<string, unknown>).__pluginInstallAnswers;
  delete (globalThis as Record<string, unknown>).__pluginInstalledPath;
});
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

const base = (): HostOptions => ({ path: home, agents: [echo({ path: home })] });

const load = (specs: PluginSpec[], run: Runner) =>
  loadPlugins(specs, { base: base(), configDir: home, cwd: home, log: () => {}, run });

/** One file at an absolute path, with the folders above it. */
function writeAt(at: string, body: string): void {
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, body);
}

/** One file under the temporary home. */
const write = (rel: string, body: string): void => writeAt(join(home, rel), body);

/**
 * A plugin package in the temporary home, and the spec that loads it.
 *
 * `body` runs inside `apply` with the host in scope; the apply is async and
 * the loader awaits it, so a body may await an answer.
 */
function pkg(dir: string, body: string): string {
  write(`${dir}/package.json`, JSON.stringify({
    name: dir,
    version: '1.0.0',
    private: true,
    type: 'module',
    exports: { '.': './index.mjs' },
    ahpd: { entry: './index.mjs', description: 'One install fixture.' },
  }));
  write(`${dir}/index.mjs`,
    `export const name = '${dir}';\n`
    + 'export async function apply(host) {\n'
    + '  globalThis.__pluginInstalledPath = host.installed;\n'
    + '  globalThis.__pluginInstallAnswers = [];\n'
    + `  ${body}\n`
    + '}\n');
  return join(home, dir);
}

/** One install asked for a version, and its answer kept for the test. */
const ask = (spec: string): string =>
  `globalThis.__pluginInstallAnswers.push(await host.install(${JSON.stringify(spec)}));`;

/** What the fixture plugin's applies answered, in the order they ran. */
const answers = (): InstallAnswer[] =>
  (globalThis as Record<string, unknown>).__pluginInstallAnswers as InstallAnswer[];

/** The `installed` path the fixture plugin saw. */
const installedPath = (): string | undefined =>
  (globalThis as Record<string, unknown>).__pluginInstalledPath as string | undefined;

/** One command line a fake npm was given. */
interface Asked {
  program: string;
  argv: string[];
}

/** How one fake npm run answers: its exit status, its standard error, and the version it leaves. */
interface Said {
  code?: number;
  stderr?: string;
  version?: string;
}

interface FakeNpm {
  run: Runner;
  asked: Asked[];
  /** The most npm runs that were in flight at one time. */
  atOnce(): number;
}

/**
 * A runner that behaves like npm for one install.
 *
 * It records the command line, takes a moment, and on success writes the
 * `node_modules/<name>/package.json` a real npm leaves, because the host reads
 * the version from that file and not from the spec or from npm's output.
 */
function fakeNpm(answer: (spec: string) => Said): FakeNpm {
  const asked: Asked[] = [];
  let open = 0;
  let most = 0;
  const run: Runner = async (program, argv): Promise<Ran> => {
    asked.push({ program, argv: [...argv] });
    open += 1;
    most = Math.max(most, open);
    try {
      // Long enough that two calls overlap unless the host queues them.
      await new Promise((done) => setTimeout(done, 10));
      const prefix = argv[argv.indexOf('--prefix') + 1] ?? '';
      const spec = argv.at(-1) ?? '';
      const said = answer(spec);
      if ((said.code ?? 0) !== 0) return { code: said.code ?? 1, stdout: '', stderr: said.stderr ?? '' };
      if (said.version !== undefined) {
        const name = spec.replace(/@[^@/]*$/u, '');
        writeAt(join(prefix, 'node_modules', ...name.split('/'), 'package.json'),
          JSON.stringify({ name, version: said.version }));
      }
      return { code: 0, stdout: '', stderr: '' };
    }
    finally {
      open -= 1;
    }
  };
  return { run, asked, atOnce: () => most };
}

describe('host.install', () => {
  it('installs into the plugin\'s own installed/ folder and answers the version', async () => {
    const npm = fakeNpm(() => ({ version: '0.5.1' }));
    const dir = pkg('installs', ask('demo-piece@0.5.1'));

    const { loaded, problems } = await load([dir], npm.run);

    expect(problems).toEqual([]);
    expect(loaded.map((one) => one.name)).toEqual(['installs']);
    expect(answers()).toEqual([{ version: '0.5.1' }]);
    // The plugin is told where the folder is, and the folder is inside its own.
    expect(installedPath()).toBe(join(dir, 'installed'));
    expect(existsSync(join(dir, 'installed', 'node_modules', 'demo-piece', 'package.json'))).toBe(true);
    // Nothing is written into the plugin's own package, and npm has a manifest
    // of its own to write beside.
    expect(existsSync(join(dir, 'node_modules'))).toBe(false);
    expect(JSON.parse(readFileSync(join(dir, 'installed', 'package.json'), 'utf8')))
      .toEqual({ name: 'ahpd-installed', private: true });

    const [one] = npm.asked;
    expect(one?.program).toBe('npm');
    expect(one?.argv.slice(0, 2)).toEqual(['install', '--prefix']);
    expect(one?.argv).toContain('--ignore-scripts');
    expect(one?.argv).toContain('--no-audit');
    expect(one?.argv).toContain('--no-fund');
    expect(one?.argv.at(-1)).toBe('demo-piece@0.5.1');
    expect(one?.argv[one.argv.indexOf('--prefix') + 1]).toBe(join(dir, 'installed'));
  });

  it('answers the last line npm wrote, with a URL\'s userinfo masked', async () => {
    const npm = fakeNpm(() => ({
      code: 1,
      stderr: 'npm error something else\nnpm error 404 Not Found - GET https://user:secret@registry.example.com/demo-piece - Not found\n\n',
    }));
    const dir = pkg('fails', ask('demo-piece@9.9.9'));

    const { loaded, problems } = await load([dir], npm.run);

    // A failed install costs the plugin nothing: it is an answer, not a throw.
    expect(problems).toEqual([]);
    expect(loaded.map((one) => one.name)).toEqual(['fails']);
    expect(answers()).toEqual([{
      error: 'npm error 404 Not Found - GET https://<set>@registry.example.com/demo-piece - Not found',
    }]);
    expect(existsSync(join(dir, 'installed', 'node_modules'))).toBe(false);
  });

  it('refuses a spec npm would read as a flag or a shell would split, and runs no npm', async () => {
    const npm = fakeNpm(() => ({ version: '1.0.0' }));
    const dir = pkg('refuses', [ask('--ignore-scripts=false'), ask('demo-piece@1 & calc'), ask('demo-piece@"1"')].join('\n  '));

    const { loaded } = await load([dir], npm.run);

    expect(loaded.map((one) => one.name)).toEqual(['refuses']);
    expect(answers().map((one) => 'error' in one)).toEqual([true, true, true]);
    expect(npm.asked).toEqual([]);
  });

  it('answers the exit code when npm wrote nothing to its standard error', async () => {
    const npm = fakeNpm(() => ({ code: 1 }));
    const dir = pkg('silent', ask('demo-piece@9.9.9'));

    await load([dir], npm.run);

    expect(answers()).toEqual([{ error: 'npm ended with code 1' }]);
  });

  it('answers an error when npm leaves no version behind', async () => {
    // npm ends cleanly and leaves nothing to read the version from.
    const npm = fakeNpm(() => ({}));
    const dir = pkg('no-version', ask('demo-piece@1.0.0'));

    await load([dir], npm.run);

    expect(answers()).toEqual([{
      error: 'npm installed demo-piece@1.0.0, but its package.json answers no version',
    }]);
  });

  it('runs two installs at once one after the other', async () => {
    const npm = fakeNpm((spec) => ({ version: spec.startsWith('one-') ? '1.0.0' : '2.0.0' }));
    const dir = pkg('queued', 'globalThis.__pluginInstallAnswers.push(...await Promise.all(['
      + "host.install('one-piece@1.0.0'), host.install('two-piece@2.0.0')]));");

    const { problems } = await load([dir], npm.run);

    expect(problems).toEqual([]);
    expect(answers()).toEqual([{ version: '1.0.0' }, { version: '2.0.0' }]);
    expect(npm.asked).toHaveLength(2);
    expect(npm.atOnce()).toBe(1);
  });

  it('answers an error to a plugin with no folder of its own', async () => {
    const npm = fakeNpm(() => ({ version: '1.0.0' }));
    const source = 'data:text/javascript,' + encodeURIComponent(
      'export async function apply(host) {\n'
      + '  globalThis.__pluginInstalledPath = host.installed;\n'
      + '  globalThis.__pluginInstallAnswers = [await host.install(\'demo-piece@1.0.0\')];\n'
      + '}\n');

    const { loaded, problems } = await load([{ id: 'no-folder', source, description: 'A plugin with no folder.' }], npm.run);

    expect(problems).toEqual([]);
    expect(loaded.map((one) => one.name)).toEqual(['no-folder']);
    expect(installedPath()).toBeUndefined();
    expect(answers()).toEqual([{ error: 'plugin no-folder has no folder of its own to install into' }]);
    expect(npm.asked).toEqual([]);
  });
});
