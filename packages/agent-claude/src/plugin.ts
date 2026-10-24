/**
 * The plugin entry: what the daemon imports when the package is named.
 *
 * `index.ts` re-exports `name`, `apply` and `optionsSchema` from here, so the
 * module the manifest names is the plugin. There is deliberately no default
 * export: the loader refuses a module without a named `apply` rather than
 * guessing which export is the plugin.
 *
 * The daemon has no backend of its own - decision `the-daemon-bundles-no-agent`
 * - so this is how Claude Code reaches a host: one entry in `plugins`, with
 * nothing under `options` in the ordinary install.
 */

import type { ModelEntry } from './models.js';
import type { AgentKind, Plugin, PluginHost } from '@ahpd/sdk';
import { bag, eachPreset, readSecrets } from '@ahpd/sdk';
import { claude } from './claude.js';
import type { ClaudeOptions } from './claude.js';
import { sharedCatalogue as oneListing } from './catalog.js';
import { enableTasks, extraArgs, hostTasks, kindSchema, outputStyle, presetSchema, sandbox, thinking } from './options.js';

/** The plugin's id, unique among the plugins one daemon loads. */
export const name = 'agent-claude';

/**
 * What a listing prints for this package.
 *
 * The manifest's `ahpd.title` carries the same string to `ahpd plugin list`,
 * which must not import the module to read it; this export is for an embedder
 * that imports the entry directly.
 */
export const title = 'Agent Claude';

/**
 * The options `apply` receives, as a JSON Schema the daemon checks them against
 * before `apply` runs.
 */
export const optionsSchema = {
  type: 'object',
  properties: {
    paths: { type: 'array', items: { type: 'string' }, description: "The directories it catalogues, and where a session goes by default. Defaults to the host's." },
    computerExecutable: { type: 'string', description: "Where the CLI is inside a machine. claude on the image's PATH by default." },
    computerCli: {
      type: 'string',
      enum: ['part', 'host'],
      description: "Where the CLI a machine runs comes from: part, the claude part this host builds, by default; host mounts this host's own installed CLI.",
    },
    computerCliFallback: {
      type: 'string',
      enum: ['refuse', 'host'],
      description: "With computerCli part, what a machine gets when the claude part cannot be built: refuse, by default, refuses the Claude session naming the part; host mounts this host's own CLI instead and logs it.",
    },
    computerConfigDir: {
      anyOf: [{ type: 'string' }, { const: false }],
      description: "The configuration directory the CLI reads inside a machine. /ahpd/<variant> by default, /ahpd/claude for the built-in; false leaves the image's own.",
    },
    workerStop: { type: 'string', enum: ['worker', 'session'], description: "What a stop given in a subagent's chat stops. worker by default." },
    handshakeTimeoutMs: {
      type: 'integer',
      minimum: 1,
      description: 'How long the CLI has to answer its handshake before its session treats it as a CLI that died. Default 120000, and a slower machine raises it.',
    },
    presets: {
      type: 'object',
      description: 'The variants this package registers an agent for, by the id clients name. The built-in claude is here unless it is false, and each key registers an agent of its own with its own name, models and options.',
      // A preset is a bag of options by whatever name it is given, so what a
      // preset holds is the declaration below rather than `properties`. The two
      // types are one shape written two ways: `false` drops the variant, and
      // the object says what it holds.
      additionalProperties: {
        type: ['object', 'boolean'],
        properties: {
          name: { type: 'string', description: 'What a client reads instead of the id, which is this key. Defaults to the key.' },
          models: {
            type: 'array',
            description: 'The models offered: an id, { id, name }, or { fetch, match, key } reading an endpoint model list. Replaces the CLI list unless keepCliModels.',
          },
          keepCliModels: { type: 'boolean', description: 'With models, add them to the CLI model list rather than replace it.' },
          // The variables of a preset's `env` are credentials wherever the CLI
          // keeps one, so each answers `<set>` rather than what it is. Held at
          // use rather than read here, so a `{ "$secret": "host:<name>" }`
          // reaches this plugin as the name it wrote and one preset's missing
          // credential costs that preset and not this load.
          env: { type: 'object', additionalProperties: { type: ['string', 'null'], writeOnly: true, secretAtUse: true }, description: 'Environment the CLI is run with, by variable name.' },
          // Typed by `presetSchema` against their declarations rather than
          // here, so a wrongly written value costs its preset and not this load.
          sandbox: { description: sandbox.schema.description },
          thinking: { description: thinking.schema.description },
          hostTasks: { description: hostTasks.schema.description },
          enableTasks: { description: enableTasks.schema.description },
          outputStyle: { description: outputStyle.schema.description },
          extraArgs: { description: extraArgs.schema.description },
        },
      },
    },
  },
};

/** What a preset is before it is split into the agent's own fields. */
interface Variant extends Record<string, unknown> {
  /** The id clients name, which is the preset's key. */
  id: string;
  /** What a client reads instead of the id. */
  name: string;
}

/** The key of the built-in, which is registered unless a preset says otherwise. */
const BUILT_IN = 'claude';

/**
 * The variants a load registers an agent for, the built-in first.
 *
 * The built-in is `claude` as Claude Code has always run here, kept unless it is
 * written `false`, with an object under its key laid over it. Every other key is
 * a variant of its own, named after itself, in the order it was written.
 */
const variantsOf = (presets: Record<string, unknown>): Variant[] => {
  const out: Variant[] = [];
  const builtIn = bag(presets[BUILT_IN]);
  if (presets[BUILT_IN] !== false) out.push({ ...builtIn, id: BUILT_IN, name: named(builtIn, 'Claude Code') });
  for (const [id, given] of Object.entries(presets)) {
    if (id === BUILT_IN || given === false) continue;
    const variant = bag(given);
    out.push({ ...variant, id, name: named(variant, id) });
  }
  return out;
};

/** The name a variant was given, or the one it defaults to. */
const named = (variant: Record<string, unknown>, fallback: string): string =>
  typeof variant['name'] === 'string' ? variant['name'] : fallback;

/**
 * The options every agent of one load shares, and the directories it serves.
 *
 * `paths` defaults to the host's, which is the whole configuration in the
 * ordinary install: the directories the daemon was started on are the ones
 * this backend lists. A deployment that wants the catalogue narrower than the
 * host names its own.
 *
 * These are the plugin's own options rather than any one agent's, so a preset
 * is laid over them and a record takes them as they are: what a record may
 * override is what the kind's schema declares, and none of these is in it.
 */
const defaultsOf = (host: PluginHost, values: Record<string, unknown>) => {
  const said = values as Partial<ClaudeOptions> & { presets?: Record<string, unknown> };
  const paths = said.paths ?? host.paths;
  const shared = {
    log: (line: string) => host.log(line),
    // One listing for all of them, and one load's worth of it: every variant
    // below reads the same `paths` out of the same configuration directory, so
    // there is one pass over the projects directory for the lot.
    sharedCatalogue: oneListing(paths),
    ...(said.computerExecutable === undefined ? {} : { computerExecutable: said.computerExecutable }),
    ...(said.computerConfigDir === undefined ? {} : { computerConfigDir: said.computerConfigDir }),
    ...(said.computerCli === undefined ? {} : { computerCli: said.computerCli }),
    ...(said.computerCliFallback === undefined ? {} : { computerCliFallback: said.computerCliFallback }),
    ...(said.workerStop === undefined ? {} : { workerStop: said.workerStop }),
    ...(said.handshakeTimeoutMs === undefined ? {} : { handshakeTimeoutMs: said.handshakeTimeoutMs }),
  };
  return { paths, shared };
};

/**
 * One agent's options per variant, out of values `optionsSchema` has checked.
 *
 * `presets` is the one option whose contents `optionsSchema` cannot check: it
 * says a preset is an object, and what a preset holds is checked here against
 * the same declarations the session keys are made of. A failure belongs to the
 * preset it came from, so one that is wrongly written, whose `fromEnv` variable
 * is not there or whose `$secret` cannot be read is left out with one line
 * naming it and the rest of the presets register. The load fails only when
 * nothing is left to register an agent for, because a daemon with no Claude at
 * all is not a daemon somebody configured.
 */
const optionsOf = async (host: PluginHost, values: Record<string, unknown>): Promise<ClaudeOptions[]> => {
  for (const key of ['provider', 'displayName', 'models', 'keepCliModels']) {
    if (values[key] !== undefined) throw new Error(`options.${key} is written per variant, as presets.<id>.${key}`);
  }
  const said = values as Partial<ClaudeOptions> & { presets?: Record<string, unknown> };
  // The built-in, then every other key: one variant each, by its own id, which
  // is the key the loader reads a failure against.
  const variants = await eachPreset(
    host,
    name,
    variantsOf(said.presets ?? {}).map((one): [string, Variant] => [one.id, one]),
    async (id, given) => {
      const one = given as Variant;
      const { id: _key, ...preset } = one;
      const wrong = presetSchema(preset, `options.presets.${id}`);
      if (wrong !== undefined) throw new Error(wrong);
      // Read once the preset is known to hold, so a wrongly written one says so
      // rather than a name inside it being asked for first.
      const env = preset['env'] === undefined
        ? undefined
        : await readSecrets(host, preset['env'], `options.presets.${id}.env`);
      return env === undefined ? one : { ...one, env };
    },
    { noun: 'variant' },
  );
  const { paths, shared } = defaultsOf(host, values);
  return variants.map(({ id, name, models, keepCliModels, ...preset }) => ({
    ...shared,
    paths,
    provider: id,
    displayName: name,
    ...(id === BUILT_IN ? {} : { variant: true }),
    ...(models === undefined ? {} : { models: models as ModelEntry[] }),
    ...(keepCliModels === undefined ? {} : { keepCliModels: keepCliModels as boolean }),
    ...(Object.keys(preset).length === 0 ? {} : { preset }),
  }));
};

/**
 * The `claude` kind: the form a record of it fills in, and the backend each
 * record opens.
 *
 * The template is the built-in agent with nothing set, which is what a new
 * record starts from. `extraArgs` is host-only, because an argument is where a
 * command would come from; the two credential variables are key fields, so a
 * team's or a person's record may carry its own key while every other variable
 * stays the host's to set. The record is read live, so an edit reaches the
 * session at its next turn.
 *
 * The records are beside the preset agents until task 07 of host 122 migrates
 * them: `presets` still folds one agent per preset, and an id a preset already
 * serves cannot also be a record's.
 */
/** The plugin's own options, as every agent of one load is built with them. */
type Shared = ReturnType<typeof defaultsOf>['shared'];

const kindOf = (paths: string[], shared: Shared): AgentKind => ({
  name: 'claude',
  title: 'Claude Code',
  description: 'Claude Code, with one record per agent: its own directories, models and options.',
  schema: kindSchema(),
  templates: [{
    name: 'Claude Code',
    description: 'Claude Code as this host runs it, on the directories the plugin serves.',
    config: {},
  }],
  hostOnly: ['extraArgs'],
  keyVariables: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'],
  open: (record) => claude({
    ...shared,
    paths,
    provider: record.id,
    displayName: record.name,
    ...(Array.isArray(record.config['models']) ? { models: record.config['models'] as ModelEntry[] } : {}),
    ...(typeof record.config['keepCliModels'] === 'boolean' ? { keepCliModels: record.config['keepCliModels'] } : {}),
    presetOf: () => ({ ...record.config }),
  }),
});

/** Register the `claude` kind, and one agent per preset until task 07 migrates them. */
export const apply: Plugin['apply'] = async (host, options) => {
  const { paths, shared } = defaultsOf(host, options);
  host.registerAgentKind(kindOf(paths, shared));
  for (const one of await optionsOf(host, options)) host.registerAgent(claude(one));
};
