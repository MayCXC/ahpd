/**
 * The presets a configuration file holds, made into agent records.
 *
 * Before an agent was a record, a plugin registered one agent for every preset
 * its options named: `presets` for `claude` and `acp`, a `provider` beside
 * `displayName` for `cofold` and `pi`. A record is now the one thing the agents
 * channel serves, and a plugin registers a kind and no agent at all, so the
 * presets a file still holds would otherwise be dropped without a word.
 *
 * This runs at the start, in two steps around the plugin load: the plan says
 * which agents the presets describe, and the write step runs once the kinds
 * have loaded, because a kind's schema is what says which fields of a record
 * are secrets. Each plaintext key is moved to the vault under the record's own
 * name, as a put of the agents channel does, and the record keeps
 * `{ "$secret": "<name>" }` in its place.
 *
 * The records are written first and the file second, so a failure leaves the
 * file as it was and the records already written, and the next start finds the
 * records and writes only the rest.
 *
 * The built-in claude a file with no presets still describes is written once: a
 * marker beside the file says so, so a record a person removed stays removed.
 *
 * The configuration file is the person's own, so it is copied beside itself
 * before it is rewritten, and the new text is written to a temporary name and
 * renamed over the old one. Nothing here logs a value: a record may hold a key,
 * and the line says the ids only.
 */

import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { bag, isRecord, isRecordSlug, knownAgents, reason, RECORD_SLUG } from '@ahpd/sdk';
import type { PluginSpec, RecordCollection, ServedAgentKind, StoredRecord, Vault } from '@ahpd/sdk';
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

/** A deep copy of a parsed value, so a move never writes to the file it read. */
const copied = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map((one) => copied(one)) as unknown as T;
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, one]) => [key, copied(one)])) as T;
  return value;
};

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
 * the same way. A `$secret` and a `fromEnv` stay as they were written: where a
 * value comes from is not read here, so no key is moved or logged.
 *
 * `builtin` is whether the built-in claude is planned when the values do not
 * name it: true while the spec still holds a `presets` key, and on the first
 * migration a file with none is found in. A `presets.claude: false` is always
 * taken as written, so a person who turned it off is answered.
 */
const plansOf = (spec: PluginSpec, kind: PresetKind, builtin: boolean): Planned[] => {
  const values = specOptions(spec);
  if (kind === 'claude') {
    const presets = bag(values['presets']);
    const plans: Planned[] = [];
    if (presets['claude'] !== false && (presets['claude'] !== undefined || builtin)) {
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

/** The file that remembers the presets were made into records once. */
const markerOf = (configFile: string): string => join(dirname(configFile), 'presets-state.json');

/** What `planPresets` is given. */
export interface PlanOptions {
  /** The plugins this run loads, as the file and the flags named them. */
  plugins: PluginSpec[];
  /** The configuration file the presets were written in. */
  configFile: string;
  /** One line per preset that cannot become a record, naming the id and no value. */
  log(message: string): void;
}

/** What the plan found, and what the write step is handed once the plugins load. */
export interface PresetPlan {
  /** The specs to hand the loader, with what a record takes out of them. */
  plugins: PluginSpec[];
  /** The configuration file the presets were written in. */
  configFile: string;
  /** The file as it was read, for the write step to rewrite; absent when there is none. */
  held?: Record<string, unknown>;
  /** The agents the presets describe. */
  plans: Planned[];
  /** The kinds this run loads, whose records are the ones written. */
  loaded: PresetKind[];
  /** Whether the file could not be read, so no preset can be taken out of it. */
  unreadable: boolean;
  /** Whether this pass marks the presets as moved, so a removed claude stays removed. */
  marker: boolean;
}

/** Read the presets this run was configured with, and say which agents they describe. */
export const planPresets = (options: PlanOptions): PresetPlan => {
  let held: Record<string, unknown> | undefined;
  let unreadable = false;
  if (existsSync(options.configFile)) {
    try {
      held = readEntry(options.configFile);
    }
    catch {
      // The parser's own words are not repeated: it quotes the text it choked
      // on, and the file may hold a key.
      unreadable = true;
    }
  }
  // The one thing that makes the built-in claude happen once: a file whose
  // presets are gone is not a file that asks for it again, and a record a
  // person removed stays removed.
  const migrated = existsSync(markerOf(options.configFile));
  const plans: Planned[] = [];
  const named = new Map<string, PresetKind>();
  const loaded: PresetKind[] = [];
  let marker = false;
  for (const spec of options.plugins) {
    if (typeof spec !== 'string' && spec.enabled === false) continue;
    const kind = kindOfSpec(spec);
    if (kind === undefined) continue;
    if (!loaded.includes(kind)) loaded.push(kind);
    // The built-in claude is planned while the spec still holds a `presets`
    // key; a spec with none is given it only on the first migration.
    const builtin = kind === 'claude' && (specOptions(spec)['presets'] !== undefined || !migrated);
    if (builtin) marker = true;
    for (const plan of plansOf(spec, kind, builtin)) {
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
  const cleaned = options.plugins.map((spec) => cleanSpec(spec, new Set(loaded)));
  return { plugins: cleaned, configFile: options.configFile, ...(held === undefined ? {} : { held }), plans, loaded, unreadable, marker };
};

/**
 * The fields a kind keeps secret: its `writeOnly` fields and its `keyVariables`.
 *
 * The same set the agents channel moves on a put, so a record this writes keeps
 * no value a listing would serve.
 */
const secretFieldsOf = (kind: ServedAgentKind): string[] => {
  const fields = new Set(Object.entries(bag(kind.schema['properties']))
    .filter(([, one]) => isRecord(one) && one['writeOnly'] === true)
    .map(([field]) => field));
  for (const variable of kind.keyVariables ?? []) fields.add(`env.${variable}`);
  return [...fields];
};

/** The value at a dotted field path. */
const readAt = (config: Record<string, unknown>, path: readonly string[]): unknown => {
  let at: unknown = config;
  for (const key of path) {
    if (!isRecord(at)) return undefined;
    at = at[key];
  }
  return at;
};

/** Set a value at a dotted field path, making the objects it needs. */
const putAt = (config: Record<string, unknown>, path: readonly string[], value: unknown): void => {
  const last = path[path.length - 1] as string;
  let at = config;
  for (const key of path.slice(0, -1)) {
    const next = at[key];
    if (isRecord(next)) { at = next; continue; }
    const made: Record<string, unknown> = {};
    at[key] = made;
    at = made;
  }
  at[last] = value;
};

/**
 * One record's config, with every secret it wrote in plaintext moved to the
 * vault.
 *
 * A record may hold no value of a secret field: the channel's own put moves it
 * under the record's name and keeps `{ "$secret": "<name>" }`, and a listing
 * serves the record as it is stored. A `$secret` or a `fromEnv` the preset wrote
 * stays as it was: both name where the value comes from and carry none of it,
 * and a host record resolves either.
 */
const withSecretsMoved = async (
  config: Record<string, unknown>,
  kind: ServedAgentKind,
  id: string,
  vault: Vault | undefined,
): Promise<Record<string, unknown>> => {
  const out = copied(config);
  for (const field of secretFieldsOf(kind)) {
    const path = field.split('.');
    const value = readAt(out, path);
    // An absent field, an empty one and every value that is not a string is
    // no secret this could leak.
    if (typeof value !== 'string' || value === '') continue;
    if (vault === undefined) throw new Error(`this host has no vault, so ${field} cannot be kept`);
    // The name a put of the agents channel gives a host record's secret.
    const name = `host:agent/${id}/${field}`;
    await vault.set(name, value);
    putAt(out, path, { $secret: name });
  }
  return out;
};

/** What `applyPresets` is given. */
export interface ApplyOptions {
  /** What the plan found, and the specs the loader was handed. */
  plan: PresetPlan;
  /** The `agents` collection, where every agent is a record now. */
  records: RecordCollection;
  /** The kinds this run loaded, by name, which is what says where a key goes. */
  kinds: Readonly<Record<string, ServedAgentKind>>;
  /** Where a secret is kept; a host with none writes no record that holds one. */
  vault: Vault | undefined;
  /** One line per thing done, naming record ids and no value. */
  log(message: string): void;
  /** The clock the backup's timestamp is taken from. */
  now?(): Date;
}

/** What `applyPresets` did. */
export interface Applied {
  /** The ids of the records this run wrote. */
  written: string[];
}

/**
 * Write the planned agents as records, take them out of the configuration file,
 * and mark the presets as moved.
 *
 * A failure at any step leaves the file as it was and the records already
 * written, and says so without a value: the next start finds the records it
 * made and writes only the rest. Nothing is done, and nothing is logged, when
 * the plan found no agent the records do not already hold - which is what a
 * second start after this one finds.
 */
export const applyPresets = async (options: ApplyOptions): Promise<Applied> => {
  const { plan } = options;
  const clock = options.now ?? (() => new Date());
  /** Whether every planned agent was settled, so the presets were really moved. */
  let complete = true;

  /** Mark the presets as moved, so a file with none never re-adds the claude. */
  const mark = (): void => {
    if (!plan.marker || !complete) return;
    try {
      writeEntry(markerOf(plan.configFile), { version: 1, at: clock().toISOString() });
    }
    catch (error) {
      options.log(`The presets were moved, but ${markerOf(plan.configFile)} could not be written: ${reason(error)}`);
    }
  };

  let present: Set<string>;
  try {
    present = new Set((await options.records.list()).map((one) => one.id));
  }
  catch (error) {
    options.log(`The presets were not moved: the agent records could not be read: ${reason(error)}`);
    return { written: [] };
  }

  // Every record first: a file rewritten before them would lose the agents if
  // one write failed.
  const written: string[] = [];
  for (const agent of plan.plans) {
    if (present.has(agent.id)) continue;
    const kind = options.kinds[agent.kind];
    if (kind === undefined) {
      // The kind did not load, so what its schema says is a secret is unknown
      // and no plugin serves the record: it stays in the file to try again, and
      // the pass is not one that can say the presets were moved.
      complete = false;
      options.log(`${agent.id} did not become a record: the kind ${agent.kind} did not load.`);
      continue;
    }
    let config: Record<string, unknown>;
    try {
      config = await withSecretsMoved(agent.config, kind, agent.id, options.vault);
    }
    catch (error) {
      options.log(`The presets were not moved: ${agent.id} could not be written as a record: ${reason(error)}`);
      return { written };
    }
    try {
      await options.records.put(recordOf({ ...agent, config }));
    }
    catch (error) {
      options.log(`The presets were not moved: ${agent.id} could not be written as a record: ${reason(error)}`);
      return { written };
    }
    present.add(agent.id);
    written.push(agent.id);
  }

  if (plan.unreadable) {
    mark();
    options.log(`The presets were not taken out of ${plan.configFile}: it could not be read, and is as it was.`);
    return { written };
  }

  let changed = false;
  let backup: string | undefined;
  if (plan.held !== undefined) {
    const taken = stripped(plan.held, new Set(plan.loaded));
    changed = taken.changed;
    if (changed) {
      // Beside the file and named after it, before anything is written over it.
      backup = `${plan.configFile}.bak-${stampOf(clock())}`;
      try {
        copyFileSync(plan.configFile, backup);
        writeEntry(plan.configFile, taken.entry);
      }
      catch (error) {
        options.log(`The presets in ${plan.configFile} were not taken out: ${reason(error)}`);
        return { written };
      }
    }
  }

  mark();

  const kept = backup === undefined ? '' : ` ${backup} holds the file as it was.`;
  if (written.length > 0) {
    options.log(`Moved ${String(written.length)} ${written.length === 1 ? 'preset' : 'presets'} to agent records owned by the host: ${written.join(', ')}.${kept}`);
  } else if (changed) {
    const ids = plan.plans.map((one) => one.id);
    options.log(ids.length === 0
      ? `The presets in ${plan.configFile} were taken out: they described no agent.${kept}`
      : `The presets in ${plan.configFile} were already agent records: ${ids.join(', ')}.${kept}`);
  }
  return { written };
};
