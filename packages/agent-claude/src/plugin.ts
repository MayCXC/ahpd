/**
 * The plugin entry: what the daemon imports when the package is named.
 *
 * `index.ts` re-exports `name`, `apply` and `title` from here, so the module
 * the manifest names is the plugin. There is deliberately no default export:
 * the loader refuses a module without a named `apply` rather than guessing
 * which export is the plugin.
 *
 * The options schema is in this package's package.json, at `ahpd.optionsSchema`,
 * and is read from there rather than exported: the daemon reads it without
 * importing the module, so a plugin switched off still has a form.
 *
 * The daemon has no backend of its own - decision `the-daemon-bundles-no-agent`
 * - so this is how Claude Code reaches a host: one entry in `plugins`, with
 * nothing under `options` in the ordinary install.
 */

import type { ModelEntry } from './models.js';
import type { Engine, Plugin, PluginHost } from '@ahpd/sdk';
import { claude } from './claude.js';
import type { ClaudeOptions } from './claude.js';
import { sharedCatalogue as oneListing } from './catalog.js';
import { kindSchema } from './options.js';

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
 *
 * The schema is written in this package's package.json, at `ahpd.optionsSchema`,
 * so a listing reads it without importing this module and a plugin switched off
 * still has a form a client draws. These are the plugin's own answers for every
 * record of the engine. What one agent runs on - its directories, models and
 * options - is the record's, and the engine's schema is where that is written.
 */

/**
 * The options every agent of one load shares, and the directories it serves.
 *
 * `paths` defaults to the host's, which is the whole configuration in the
 * ordinary install: the directories the daemon was started on are the ones
 * this backend lists. A deployment that wants the catalogue narrower than the
 * host names its own.
 *
 * These are the plugin's own options rather than any one agent's, and a record
 * takes them as they are: what a record may override is what the engine's schema
 * declares, and none of these is in it.
 */
const defaultsOf = (host: PluginHost, values: Record<string, unknown>) => {
  const said = values as Partial<ClaudeOptions>;
  const paths = said.paths ?? host.paths;
  const shared = {
    log: (line: string) => host.log(line),
    // One listing for all of them, and one load's worth of it: every record
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
 * The `claude` engine: the form a record of it fills in, and the backend each
 * record opens.
 *
 * The template is the built-in agent with nothing set, which is what a new
 * record starts from. `extraArgs` is host-only, because an argument is where a
 * command would come from; the two credential variables are key fields, so a
 * team's or a person's record may carry its own key while every other variable
 * stays the host's to set. The record is read live, so an edit reaches the
 * session at its next turn.
 */
/** The plugin's own options, as every agent of one load is built with them. */
type Shared = ReturnType<typeof defaultsOf>['shared'];

const engineOf = (paths: string[], shared: Shared): Engine => ({
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

/**
 * Register the `claude` engine.
 *
 * The agents are records of it: one load serves every Claude Code variant, and
 * each record says which one it runs.
 */
export const apply: Plugin['apply'] = (host, options) => {
  const { paths, shared } = defaultsOf(host, options);
  host.registerEngine(engineOf(paths, shared));
};
