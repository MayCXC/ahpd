/**
 * The presets a configuration file holds, made into agent records.
 *
 * Before an agent was a record, a plugin registered one agent for every preset
 * its options named: `presets` for `claude` and `acp`, a `provider` beside
 * `displayName` for `cofold` and `pi`. A record is now the one thing the agents
 * channel serves, and a plugin registers a kind and no agent at all, so the
 * presets a file still holds would otherwise be dropped without a word.
 *
 * This runs once, at the start and before the plugins load: every preset
 * becomes a record owned by the host, which is who owned the agents a preset
 * registered. The records are written first and the file second, so a failure
 * leaves the file as it was and the records already written, and the next start
 * finds the records and nothing left to move.
 *
 * The configuration file is the person's own, so it is copied beside itself
 * before it is rewritten, and the new text is written to a temporary name and
 * renamed over the old one. Nothing here logs a value: a record may hold a key,
 * and the line says the ids only.
 */

import { copyFileSync, existsSync } from 'node:fs';
import { bag, isRecord, isRecordSlug, knownAgents, reason, RECORD_SLUG } from '@ahpd/sdk';
import type { PluginSpec, RecordCollection, StoredRecord } from '@ahpd/sdk';
import { nameOf } from '../plugins.js';
import { readEntry, writeEntry } from '../install.js';

/** The agent kinds whose presets this moves, and the package each ships as. */
const PRESET_KINDS = [
  ['claude', 'agent-claude'],
  ['acp', 'agent-acp'],
  ['cofold', 'agent-cofold'],
  ['pi', 'agent-pi'],
] as const;

/** One of the kinds whose presets this moves. */
type PresetKind = (typeof PRESET_KINDS)[number][0];

/**
 * What a spec of each kind carries per agent, and a record carries instead.
 *
 * `claude` and `acp` name all of them under `presets`; the other two wrote one
 * agent's identity as options of their own.
 */
const PER_AGENT: Record<PresetKind, readonly string[]> = {
  claude: ['presets'],
  acp: ['presets'],
  cofold: ['provider', 'displayName', 'description'],
  pi: ['provider', 'displayName', 'description'],
};

/** The package matching one kind, as the segment a spec names it by. */
const PACKAGE_OF: Record<PresetKind, RegExp> = Object.fromEntries(PRESET_KINDS.map(([kind, pkg]) => [
  kind,
  // A package may be scoped and a spec may be a path or a URL, so the package
  // is a segment of what was written: `@ahpd/agent-acp` and
  // `.../agent-acp/index.ts` are `acp`, and `agent-acp-extra` is neither.
  new RegExp(`(^|[/\\\\])${pkg}([/\\\\]|$)`),
])) as Record<PresetKind, RegExp>;

/** The kind a name of a plugin points at, or nothing when it names none of them. */
const kindOfName = (name: string): PresetKind | undefined =>
  (Object.keys(PACKAGE_OF) as PresetKind[]).find((kind) => PACKAGE_OF[kind].test(name));

/** The kind a spec points at. */
const kindOfSpec = (spec: PluginSpec): PresetKind | undefined => kindOfName(nameOf(spec));

/** A non-blank string, or nothing for a blank or missing one. */
const text = (value: unknown): string | undefined =>
  (typeof value === 'string' && value !== '' ? value : undefined);

/** One object without the given keys, as a new object. */
const without = (value: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

/** The options a spec names, as an object. */
const specOptions = (spec: PluginSpec): Record<string, unknown> => (typeof spec === 'string' ? {} : bag(spec.options));

/** One agent a preset described, as the record it becomes. */
interface Planned {
  kind: PresetKind;
  id: string;
  name: string;
  config: Record<string, unknown>;
  description?: string;
  model?: string;
}

/**
 * The agents one spec's options describe.
 *
 * A preset is the values the plugin used to open an agent with, so the record
 * takes them all but the three the channel owns: `name`, `description` and
 * `model` are the record's own fields and not part of its `config`. An ACP
 * preset keeps its `base`, because a record takes the shipped row it may name
 * the same way. A `$secret` and a `fromEnv` stay as they were written: a value
 * is never read here, so no key is moved or logged.
 */
const plansOf = (spec: PluginSpec, kind: PresetKind): Planned[] => {
  const values = specOptions(spec);
  if (kind === 'claude') {
    const presets = bag(values['presets']);
    const plans: Planned[] = [];
    // The built-in claude is registered unless a preset turns it off, which is
    // what `presets.claude: false` said: an install with no presets at all is
    // still an install whose Claude Code works.
    if (presets['claude'] !== false) {
      const given = bag(presets['claude']);
      plans.push({ kind, id: 'claude', name: text(given['name']) ?? 'Claude Code', config: without(given, ['name']) });
    }
    for (const [id, one] of Object.entries(presets)) {
      if (id === 'claude' || one === false) continue;
      const given = bag(one);
      plans.push({ kind, id, name: text(given['name']) ?? id, config: without(given, ['name']) });
    }
    return plans;
  }
  if (kind === 'acp') {
    const presets = bag(values['presets']);
    const plans: Planned[] = [];
    for (const [id, one] of Object.entries(presets)) {
      if (one === false) continue;
      const given = bag(one);
      const base = text(given['base']);
      // The name the plugin would have given the agent: what the preset said,
      // then the shipped row's own name, then the key.
      const known = knownAgents[id] ?? (base === undefined ? undefined : knownAgents[base]);
      const description = text(given['description']);
      const model = text(given['model']);
      plans.push({
        kind,
        id,
        name: text(given['name']) ?? known?.name ?? id,
        config: without(given, ['name', 'description', 'model']),
        ...(description === undefined ? {} : { description }),
        ...(model === undefined ? {} : { model }),
      });
    }
    return plans;
  }
  // cofold and pi wrote one agent as their own options, and every other option
  // was that agent's: it stays as the plugin's defaults, which a record that
  // names nothing runs on, so the record itself carries nothing.
  const provider = text(values['provider']);
  if (provider === undefined) return [];
  const description = text(values['description']);
  return [{
    kind,
    id: provider,
    name: text(values['displayName']) ?? provider,
    config: {},
    ...(description === undefined ? {} : { description }),
  }];
};

/** One planned agent as the record the channel keeps. */
const recordOf = (plan: Planned): StoredRecord => ({
  id: plan.id,
  kind: plan.kind,
  // The host owned the agents a preset registered, and it owns the records they
  // become: a record with no owner is one nobody is served.
  owner: 'host',
  name: plan.name,
  ...(plan.description === undefined ? {} : { description: plan.description }),
  ...(plan.model === undefined ? {} : { model: plan.model }),
  config: plan.config,
});

/**
 * One spec with what a record now holds taken out of its options.
 *
 * The values are the record's now, so a plugin that read them would be reading
 * a second copy. An entry left with no options at all loses the key, which is
 * how a person would have written it. A kind this run does not load is left
 * alone, because its records were not written either.
 */
const cleanSpec = (spec: PluginSpec, loaded: ReadonlySet<PresetKind>): PluginSpec => {
  if (typeof spec === 'string') return spec;
  // A switched-off entry is one this run does not load, so its presets were not
  // written either and are the only copy of its agents.
  if (spec.enabled === false) return spec;
  const kind = kindOfSpec(spec);
  if (kind === undefined || !loaded.has(kind) || spec.options === undefined) return spec;
  const held = bag(spec.options);
  const keys = PER_AGENT[kind];
  if (!keys.some((key) => held[key] !== undefined)) return spec;
  const kept = without(held, keys);
  const { options: _options, ...rest } = spec;
  return Object.keys(kept).length === 0 ? rest : { ...rest, options: kept };
};

/**
 * The configuration file without the presets a record now holds.
 *
 * Only the entries of a kind this run loads are touched: a file may list a
 * plugin this run does not, and its presets are still the only copy of its
 * agents. A string entry has no options to take out.
 */
const stripped = (
  held: Record<string, unknown>,
  loaded: ReadonlySet<PresetKind>,
): { entry: Record<string, unknown>; changed: boolean } => {
  const plugins = held['plugins'];
  if (!Array.isArray(plugins)) return { entry: held, changed: false };
  let changed = false;
  const next = plugins.map((one) => {
    if (!isRecord(one) || one['enabled'] === false) return one;
    const kind = typeof one['name'] === 'string' ? kindOfName(one['name']) : undefined;
    if (kind === undefined || !loaded.has(kind)) return one;
    const options = one['options'];
    if (!isRecord(options)) return one;
    const keys = PER_AGENT[kind];
    if (!keys.some((key) => options[key] !== undefined)) return one;
    changed = true;
    const kept = without(options, keys);
    const { options: _options, ...rest } = one;
    return Object.keys(kept).length === 0 ? rest : { ...rest, options: kept };
  });
  return { entry: changed ? { ...held, plugins: next } : held, changed };
};

/** A moment as a file name carries it: no colon or dot a name cannot hold. */
const stampOf = (when: Date): string => when.toISOString().replaceAll(/[:.]/g, '-');

/** What `migratePresets` is given. */
export interface MigrateOptions {
  /** The plugins this run loads, as the file and the flags named them. */
  plugins: PluginSpec[];
  /** The `agents` collection, where every agent is a record now. */
  records: RecordCollection;
  /** The configuration file the presets were written in. */
  configFile: string;
  /** One line per thing done, naming record ids and no value. */
  log(message: string): void;
  /** The clock the backup's timestamp is taken from. */
  now?(): Date;
}

/** What `migratePresets` did. */
export interface Migrated {
  /** The specs with what a record now holds taken out of them. */
  plugins: PluginSpec[];
  /** The ids of the records this run wrote. */
  written: string[];
}

/**
 * Make the presets this run was configured with into records, and take them out
 * of the configuration file.
 *
 * A failure at any step leaves the file as it was and the records already
 * written, and says so without a value: the next start finds the records it
 * made and writes only the rest. Nothing is done, and nothing is logged, when
 * the run was configured with no preset the records do not already hold - which
 * is what a second start after this one finds.
 */
export const migratePresets = async (options: MigrateOptions): Promise<Migrated> => {
  const plans: Planned[] = [];
  const named = new Map<string, PresetKind>();
  const loaded = new Set<PresetKind>();
  for (const spec of options.plugins) {
    if (typeof spec !== 'string' && spec.enabled === false) continue;
    const kind = kindOfSpec(spec);
    if (kind === undefined) continue;
    loaded.add(kind);
    for (const plan of plansOf(spec, kind)) {
      if (!isRecordSlug(plan.id)) {
        options.log(`The ${kind} preset ${plan.id} did not become a record: its id is not a slug: ${RECORD_SLUG}`);
        continue;
      }
      const other = named.get(plan.id);
      if (other !== undefined) {
        options.log(`The ${kind} preset ${plan.id} did not become a record: ${other} already names an agent of that id.`);
        continue;
      }
      named.set(plan.id, kind);
      plans.push(plan);
    }
  }
  const cleaned = options.plugins.map((spec) => cleanSpec(spec, loaded));

  let present: Set<string>;
  try {
    present = new Set((await options.records.list()).map((one) => one.id));
  }
  catch (error) {
    options.log(`The presets were not moved: the agent records could not be read: ${reason(error)}`);
    return { plugins: options.plugins, written: [] };
  }

  // Every record first: a file rewritten before them would lose the agents if
  // one write failed.
  const written: string[] = [];
  for (const plan of plans) {
    if (present.has(plan.id)) continue;
    try {
      await options.records.put(recordOf(plan));
    }
    catch (error) {
      options.log(`The presets were not moved: ${plan.id} could not be written as a record: ${reason(error)}`);
      return { plugins: options.plugins, written };
    }
    present.add(plan.id);
    written.push(plan.id);
  }

  let changed = false;
  let backup: string | undefined;
  if (existsSync(options.configFile)) {
    let held: Record<string, unknown>;
    try {
      held = readEntry(options.configFile);
    }
    catch {
      // Not the parser's own words: a parser quotes the text it choked on, and
      // the file may hold a key. The records are written; the file is as it was.
      options.log(`The presets were not taken out of ${options.configFile}: it could not be read, and is as it was.`);
      return { plugins: cleaned, written };
    }
    const taken = stripped(held, loaded);
    changed = taken.changed;
    if (changed) {
      // Beside the file and named after it, before anything is written over it.
      backup = `${options.configFile}.bak-${stampOf((options.now ?? (() => new Date()))())}`;
      try {
        copyFileSync(options.configFile, backup);
        writeEntry(options.configFile, taken.entry);
      }
      catch (error) {
        options.log(`The presets in ${options.configFile} were not taken out: ${reason(error)}`);
        return { plugins: cleaned, written };
      }
    }
  }

  const kept = backup === undefined ? '' : ` ${backup} holds the file as it was.`;
  if (written.length > 0) {
    options.log(`Moved ${String(written.length)} ${written.length === 1 ? 'preset' : 'presets'} to agent records owned by the host: ${written.join(', ')}.${kept}`);
  } else if (changed) {
    const ids = plans.map((one) => one.id);
    options.log(ids.length === 0
      ? `The presets in ${options.configFile} were taken out: they described no agent.${kept}`
      : `The presets in ${options.configFile} were already agent records: ${ids.join(', ')}.${kept}`);
  }
  return { plugins: cleaned, written };
};
