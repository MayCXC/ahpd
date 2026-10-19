import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flagFields, optionsFrom, serverFields } from '../src/commands/options.js';
import { commandParserFrom, parserConflict } from '../src/commands/run.js';
import { loadPlugins } from '../src/plugins.js';
import { echo } from '../../../examples/echo/agent.js';
import type { HostOptions } from '../../sdk/src/types/host.js';

/*
 * The `commandParser` key: a module whose default export reads a command line.
 *
 * The file's path is relative to the file that set it, the daemon imports the
 * module by that path, and a module with no reader refuses the start. A plugin
 * that also sets the port refuses it too, unless the plugin says `'replace'`.
 */

const here = import.meta.dirname;
const fixtures = join(here, 'fixtures');

let home: string;
let config: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'ahpd-commandparser-'));
  config = join(home, 'config.json');
});
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

const put = (value: unknown): void => { writeFileSync(config, JSON.stringify(value)); };

/** The host a load is folded into, which has a backend so it could serve. */
const base = (): HostOptions => ({ path: '/tmp/ahpd-commandparser', agents: [echo({ path: '/tmp/ahpd-commandparser' })] });

const load = (spec: string) => loadPlugins([spec], { base: base(), configDir: fixtures, cwd: here, log: () => {} });

describe('the commandParser key', () => {
  it('reads a path relative to the file that set it', () => {
    put({ commandParser: './reader.ts' });

    expect(optionsFrom({ configFile: config }).commandParser).toBe(join(home, 'reader.ts'));
  });

  it('is a key of the file and not a flag', () => {
    expect(Object.keys(serverFields)).toContain('commandParser');
    expect(Object.keys(flagFields)).not.toContain('commandParser');
  });

  it('is absent when the file names no module', () => {
    put({});

    expect(optionsFrom({ configFile: config }).commandParser).toBeUndefined();
  });

  it('refuses a value that is not text, naming the file and the key', () => {
    put({ commandParser: 5 });

    expect(() => optionsFrom({ configFile: config })).toThrow(`${config}: commandParser must be text`);
  });
});

describe('the module the key names', () => {
  it('answers its default export as the reader', async () => {
    const split = await commandParserFrom(join(fixtures, 'parser/index.ts'));

    expect(split('make test && make clean', 'bash')).toEqual({
      subCommands: ['make test && make clean'],
      writeDests: [],
      unanalyzable: false,
    });
  });

  it('refuses a module whose default export is not a function', async () => {
    await expect(commandParserFrom(join(fixtures, 'parser-none/index.ts'))).rejects.toThrow(/default export is not a function/u);
  });

  it('refuses a file that is not there', async () => {
    await expect(commandParserFrom(join(fixtures, 'no-such-parser.ts'))).rejects.toThrow(/could not be imported/u);
  });
});

describe('a plugin and the configuration both naming a reader', () => {
  it('is refused, naming the plugin and replace', async () => {
    const { contributions } = await load('./fixtures/plugin-parser/index.ts');

    expect(parserConflict(true, contributions)).toMatch(/also sets commandParser.*pass 'replace' to take it over/u);
  });

  it('is allowed when the plugin takes the port over with replace', async () => {
    const { contributions } = await load('./fixtures/plugin-parser-replace/index.ts');

    expect(parserConflict(true, contributions)).toBeUndefined();
  });

  it('is not a clash when the file named no module', async () => {
    const { contributions } = await load('./fixtures/plugin-parser/index.ts');

    expect(parserConflict(false, contributions)).toBeUndefined();
  });
});
