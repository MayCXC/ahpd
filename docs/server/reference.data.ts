/**
 * The tables of `REFERENCE.md`, read from the built server when the site is built.
 *
 * The commands are the ones `ahpd --help` lists: the `Program` that `main.ts`
 * builds, made here from the same `cliRegistry()` and `programGlobals`, so the
 * built-in `completion` command and the terminal's own global options are in it
 * too. A daemon option is spelled by `commandFor`, which is how a run's flags
 * are spelled from `serverFields`. Nothing is parsed out of help text.
 *
 * The modules are imported from `packages/server/dist`, so `pnpm -s build` runs
 * before the site is built.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** One option as a table shows it: each spelling, and what it does. */
export interface OptionRow {
  flags: string[];
  short?: string;
  env?: string;
  description: string;
  notes: string[];
}

/** One argument of a command. */
export interface ArgumentRow {
  name: string;
  description: string;
}

/** One command as `--help` lists it. */
export interface CommandRow {
  usage: string;
  arguments: ArgumentRow[];
  summary: string;
  /** Whether it also takes every daemon option, which are not repeated in its row. */
  daemonOptions: boolean;
  options: OptionRow[];
}

/** One field of `serverFields`. */
export interface DaemonRow {
  /** The `config.json` key, or none when only the flag sets it. */
  key?: string;
  /** The flag spellings, or none when only the file sets it. */
  flags: string[];
  value?: string;
  env?: string;
  type: string;
  description: string;
}

export interface Reference {
  commands: CommandRow[];
  daemon: DaemonRow[];
  globals: OptionRow[];
}

export declare const data: Reference;

/** Sorts by a name, ignoring case and leading dashes. */
const byName = <T>(name: (row: T) => string) => (a: T, b: T): number =>
  name(a).replace(/^-+/u, '').localeCompare(name(b).replace(/^-+/u, ''), 'en', { sensitivity: 'base' });

const SERVER = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/server');

/** A module of the built server, or of a package it depends on, imported where it lives. */
const load = (path: string): Promise<any> => import(pathToFileURL(resolve(SERVER, path)).href);

/** Every spelling a flag answers to, as the parser builds its table. */
const spellings = (option: { name: string; value?: string; negatable?: boolean }): string[] => {
  const flag = option.value === undefined;
  if (option.negatable === true || (flag && option.name.startsWith('--no-') && option.negatable !== false)) {
    const inverse = option.name.startsWith('--no-') ? `--${option.name.slice(5)}` : `--no-${option.name.slice(2)}`;
    return [option.name, inverse];
  }
  return [option.name];
};

/** A schema's type in a few words: `string`, `string[]`, `hidden | delete`. */
const typeOf = (schema: Record<string, any>): string => {
  if (Array.isArray(schema.enum)) return schema.enum.join(' | ');
  if (schema.type === 'array') return `${typeOf(schema.items ?? { type: 'string' })}[]`;
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  return String(schema.type ?? 'any');
};

export default {
  watch: ['../../packages/server/dist/commands/*.js'],
  async load(): Promise<Reference> {
    const { cliRegistry } = await load('dist/commands/registry.js');
    const { programGlobals, serverFields, flagFields, configSchema } = await load('dist/commands/options.js');
    const { Program } = await load('node_modules/@cofold/terminal/dist/index.js');
    const { commandFor, commandPattern, optionNotes, visible } = await load('node_modules/@cofold/commands/dist/index.js');

    const note = (one: any): string => {
      switch (one.kind) {
        case 'required': return 'required';
        case 'repeatable': return 'repeatable';
        case 'env': return `env ${one.name}`;
        case 'default': return `default ${JSON.stringify(one.value)}`;
        case 'candidates': return one.values.join(' | ');
        default: return '';
      }
    };
    const optionRow = (option: any): OptionRow => ({
      flags: spellings(option).map((name) => option.value === undefined ? name : `${name} ${option.value}`),
      ...(option.short === undefined ? {} : { short: option.short }),
      ...(option.env === undefined ? {} : { env: option.env }),
      description: option.description,
      notes: optionNotes(option).filter((one: any) => one.kind !== 'env').map(note).filter(Boolean),
    });

    const program = new Program({ name: 'ahpd', registry: cliRegistry(), globals: programGlobals });
    const daemonFlags = new Set(Object.keys(flagFields).map((key) => (serverFields[key].cli?.flag as string | undefined) ?? `--${key.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`));

    const commands = visible(program.commands).map((command: any): CommandRow => {
      const own = visible(command.options ?? []);
      const all = [...daemonFlags].every((flag) => own.some((option: any) => option.name === flag));
      return {
        usage: `ahpd ${commandPattern(command)}`,
        arguments: Object.entries(command.arguments ?? {}).map(([name, spec]: [string, any]) => ({ name, description: spec.description ?? '' })),
        summary: command.summary,
        daemonOptions: all,
        options: own.filter((option: any) => !all || !daemonFlags.has(option.name)).map(optionRow),
      };
    });

    // The run's own flags, spelled as the run spells them.
    const spelled = commandFor({ id: 'reference', summary: '', surfaces: { cli: { pattern: ['reference'] } }, input: flagFields, run: () => {} });
    const flagOf = new Map<string, any>((spelled.options ?? []).map((option: any) => [option.field, option]));
    const keys = new Set(Object.keys(configSchema.properties));
    const daemon = Object.entries(serverFields as Record<string, any>).map(([key, field]): DaemonRow => {
      const option = flagOf.get(key);
      const { cli: _cli, env, ...schema } = field;
      return {
        ...(keys.has(key) ? { key } : {}),
        flags: option === undefined ? [] : spellings(option),
        ...(option?.value === undefined ? {} : { value: option.value }),
        ...(env === undefined ? {} : { env }),
        type: typeOf(schema),
        description: schema.description ?? '',
      };
    });

    return {
      commands: commands.sort(byName((row) => row.usage)),
      daemon: daemon.sort(byName((row) => row.key ?? row.flags[0] ?? '')),
      globals: visible(program.globals).map(optionRow).sort(byName((row: OptionRow) => row.flags[0])),
    };
  },
};
