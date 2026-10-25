/**
 * The plugin entry: what the daemon imports when the package is named.
 *
 * `index.ts` re-exports `name`, `apply` and `optionsSchema` from here, so the
 * module the manifest names is the plugin. There is deliberately no default
 * export: the loader refuses a module without a named `apply` rather than
 * guessing which export is the plugin, and a silent guess is worse than a
 * refusal.
 *
 * The plugin registers the engine `cofold`, and each record of it is one agent
 * with its own endpoint, key and model. The plugin's own options are the
 * defaults every record starts from; nothing is registered as an agent here.
 *
 * The model adapter is not a configuration option in practice. A configuration
 * file is JSON and cannot carry a function or an object with methods, so the
 * only caller that puts one in `options` is an embedder or a test; the real
 * path is the OpenAI-compatible endpoint a record selects, and the API key for
 * it belongs in the daemon's environment or in a record's write-only field
 * rather than in a setting a client reads back.
 */

import { check } from '@cofold/commands';
import { TOOLS_SCHEMA } from '@cofold/tools';
import { join } from 'node:path';
import type { Engine, AgentView, PluginHost } from '@ahpd/sdk';
import { cofoldAgent, defaultStoreRoot } from './agent.js';
import type { CofoldOptions } from './agent.js';

/** The plugin's id, unique among the plugins one daemon loads. */
export const name = 'agent-cofold';

/**
 * What a listing prints for this package.
 *
 * The manifest's `ahpd.title` carries the same string to `ahpd plugin list`,
 * which must not import the module to read it; this export is for an embedder
 * that imports the entry directly.
 */
export const title = 'Agent Cofold';

/**
 * A search provider that takes a key.
 *
 * `writeOnly` as the daemon's own is, so a client is told the key is set and
 * never what it is. The mask answers a plugin's own option keys, so this one is
 * marked because it is a credential, not because the daemon hides it.
 */
const keyed = { type: 'object', properties: { apiKey: { type: 'string', writeOnly: true } }, required: ['apiKey'] };

/**
 * The options `apply` receives, as a JSON Schema the daemon checks them against
 * before `apply` runs.
 *
 * These are the defaults for every record of the engine: a record that names one
 * of them wins, and a record that names none runs on what is here. `apiKey`,
 * `adapter` and `policy` are also what an embedder calling `apply` passes: a
 * key function and a model adapter are things JSON cannot carry, so the schema
 * describes the configuration file's spelling of them.
 *
 * `provider`, `displayName` and `description` are deliberately not here: an
 * agent is named by its record's id, name and description, and a plugin that
 * could still set them would be describing one agent while serving many.
 */
export const optionsSchema = {
  type: 'object',
  properties: {
    model: { type: 'string', description: 'The model id a record that names none runs on.' },
    baseUrl: { type: 'string', description: 'The OpenAI-compatible endpoint a record that names none uses.' },
    instructions: { type: 'string', description: 'The system prompt a record that names none is created with.' },
    computerConfigDir: {
      anyOf: [{ type: 'string' }, { const: false }],
      description: 'The configuration directory the harness reads inside a machine. /ahpd/cofold by default; false leaves the image\'s own.',
    },
    store: { type: 'string', description: 'The folder each record\'s cofold file store lives under, one folder per record. The tool\'s own data directory by default.' },
    memory: { type: 'boolean', description: 'true to hold each record\'s store in memory, for a test.' },
    tools: {
      type: 'object',
      properties: {
        files: {
          type: ['boolean', 'object'],
          properties: { requireRead: { type: 'boolean' } },
        },
        shell: { type: 'boolean' },
        memory: { type: 'boolean' },
        web: {
          type: ['boolean', 'object'],
          properties: {
            search: {
              type: 'object',
              properties: { brave: keyed, tavily: keyed, duckduckgo: { type: 'boolean' } },
            },
          },
        },
      },
      description: 'Which capabilities a session runs, where web_search gets its providers, and whether a write needs the file read first.',
    },
    strictTools: {
      type: 'boolean',
      description: 'false holds the tools option to the loose check, so a key the harness does not know is dropped rather than refused.',
    },
    apiKey: { type: 'string', writeOnly: true, description: "The daemon's own key, for a record that names none." },
    resource: { type: 'string', description: 'The protected resource a client authenticates against.' },
    adapter: { type: 'object', description: 'A cofold ModelAdapter used instead of the HTTP one.' },
    autoCompactTokens: {
      type: 'integer',
      minimum: 1,
      description: 'The estimated history size at which a session compacts, never above 80% of the model\'s listed context, or of 32000. That 80% by default.',
    },
    policy: { type: 'object', description: 'The run-level policy a pause comes from.' },
  },
};

/**
 * The package's own options, out of values `optionsSchema` has checked.
 *
 * The `tools` option is held to cofold's own `TOOLS_SCHEMA`, which is the
 * schema the harness validates its configuration file against: a key cofold
 * does not know, or a value of the wrong type, is a person who meant something
 * else, and a session that quietly ran the default in its place would be one
 * that did not do what the file said. `strictTools: false` is the way back, for
 * a configuration written for a later cofold - the loose reading `toolsOf`
 * takes then drops what it cannot use.
 */
const optionsOf = (values: Record<string, unknown>): CofoldOptions => {
  if (values.strictTools !== false && values.tools !== undefined) {
    check(values.tools, TOOLS_SCHEMA, 'tools');
  }
  return values as CofoldOptions;
};

/**
 * The fields a record does not carry, and the two only an embedder can set.
 *
 * The channel owns an agent's id, name, description and model, so a record
 * does not name them again; `provider` is the record's id and `displayName`
 * its name. `adapter` is an object with methods and `strictTools` is how the
 * plugin forgives a configuration written for a later cofold: both are the
 * plugin's own, not something a JSON record can carry or usefully say.
 */
const NOT_A_RECORD = new Set(['provider', 'displayName', 'description', 'model', 'adapter', 'strictTools']);

/**
 * The `tools` a record may name.
 *
 * A search provider's `apiKey` is a credential, and the channel vaults a
 * record's top-level `writeOnly` fields only: a key nested under
 * `tools.web.search` would be kept in the record itself. So a record chooses
 * the capabilities and DuckDuckGo, and a keyed provider stays a plugin option,
 * which is a configuration file the daemon's own owner writes.
 */
const TOOLS_OF_RECORD = {
  type: 'object',
  additionalProperties: false,
  properties: {
    files: {
      anyOf: [
        { type: 'boolean' },
        { type: 'object', properties: { requireRead: { type: 'boolean' } }, additionalProperties: false },
      ],
    },
    shell: { type: 'boolean' },
    web: {
      anyOf: [
        { type: 'boolean' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            search: {
              type: 'object',
              additionalProperties: false,
              properties: { duckduckgo: { type: 'boolean' } },
            },
          },
        },
      ],
    },
    memory: { type: 'boolean' },
  },
};

/**
 * The engine's form: what a record may set, and nothing a second engine spells.
 *
 * Everything is closed with `additionalProperties: false`, so a field the engine
 * does not have is refused where it is written rather than kept and ignored.
 */
const kindSchema = (): Record<string, unknown> => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    ...Object.fromEntries(Object.entries(optionsSchema.properties).filter(([key]) => !NOT_A_RECORD.has(key))),
    tools: TOOLS_OF_RECORD,
  },
});

/** The fields of a record that become an option a turn runs on. */
const RECORD_FIELDS = [
  'baseUrl',
  'instructions',
  'computerConfigDir',
  'store',
  'memory',
  'tools',
  'apiKey',
  'resource',
  'autoCompactTokens',
  'policy',
] as const;

/** A non-blank string, or nothing for a blank or missing one. */
const text = (value: unknown): string | undefined =>
  (typeof value === 'string' && value.trim() !== '' ? value : undefined);

/**
 * One record's options: what the record names, over the plugin's defaults.
 *
 * Every record gets a store of its own under the plugin's folder, named by its
 * id. Two records sharing one store would list each other's sessions - a
 * backend answers `list()` from its store, not from its own sessions - so a
 * person's cofold agent would read another's transcripts. A record's model is
 * the channel's `model`, and it wins over the plugin's default the same way
 * every other field does.
 *
 * A record that cannot be built is refused with a sentence naming the field,
 * never with the value: `check` says `tools is not a field`, and the rest of
 * this says nothing about what the record holds.
 */
const optionsOfRecord = (defaults: CofoldOptions, record: AgentView): CofoldOptions => {
  const config = record.config;
  const named = Object.fromEntries(
    RECORD_FIELDS.filter((field) => config[field] !== undefined).map((field) => [field, config[field]]),
  );
  const merged: CofoldOptions = {
    ...defaults,
    ...named,
    provider: record.id,
    displayName: record.name,
    ...(record.description === undefined ? {} : { description: record.description }),
    ...(record.model === undefined ? {} : { model: record.model }),
    store: text(config.store) ?? join(defaults.store ?? defaultStoreRoot(), record.id),
  } as CofoldOptions;
  if (merged.tools !== undefined) check(merged.tools, TOOLS_SCHEMA, 'tools');
  return merged;
};

/**
 * The `cofold` engine: one record per endpoint and key, each its own agent.
 *
 * `open` builds the backend once and hands it a reader for the record, which
 * the session calls at the start of each turn. The record the reader sees is
 * the channel's own live view: an edit replaces what `config` answers, and the
 * next turn runs on it, while the turn already running ends on what it started
 * with.
 */
const engineOf = (defaults: CofoldOptions): Engine => ({
  name: 'cofold',
  title: 'Cofold',
  description: 'Cofold over an OpenAI-compatible endpoint, one record per agent with its own endpoint, key and model.',
  schema: kindSchema(),
  templates: [{
    name: 'Cofold',
    description: 'Cofold on the harness configuration at ~/.config/cofold/config.json, with nothing set here.',
    config: {},
  }],
  hostOnly: ['computerConfigDir', 'store', 'memory'],
  open: (record) => cofoldAgent({
    ...optionsOfRecord(defaults, record),
    recordOf: () => optionsOfRecord(defaults, record),
  }),
});

/**
 * Register the engine `cofold`, whose records are the agents.
 *
 * `provider`, `displayName` and `description` are refused rather than ignored:
 * a configuration that still names one is asking for the single backend this
 * plugin used to register, and a person who wrote one should be told that an
 * agent is a record now rather than run a daemon whose agents ignore half of
 * what the file says.
 */
export function apply(host: PluginHost, values: Record<string, unknown>): void {
  const perRecord: Record<string, string> = {
    provider: "the record's id",
    displayName: "the record's name",
    description: "the record's description",
  };
  for (const [key, where] of Object.entries(perRecord)) {
    if (values[key] !== undefined) throw new Error(`options.${key} is written per record now, as ${where}`);
  }
  host.registerEngine(engineOf(optionsOf(values)));
}
