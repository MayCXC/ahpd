/**
 * `x-ahpd-plugins`: the plugins the configuration names, and the commands that
 * change them.
 *
 * A row is one configured plugin, described without running it - `describePlugin`
 * resolves the spec, reads the manifest and imports nothing - with the manifest
 * the daemon loaded when it started. The row's id is the plugin's id, which is
 * what each command here takes and what root config keys the entry by.
 *
 * A change writes the same file the command line writes, through the same writer
 * and the same one-at-a-time turn, so a person at a terminal and a client are
 * never two writers reading the file and then writing it back. A change that
 * writes also applies: the daemon loads, unloads or reapplies what the file now
 * says, and only a plugin with a port or a URI scheme answers `restart`.
 */

import { check } from '@cofold/commands';
import type { JsonSchema } from '@cofold/commands';
import { recordsChannel, RpcError, scopeOf, secretRef } from '@ahpd/sdk';
import type { Grant, Loaded, PluginMethod, PluginSpec, RecordsChannel, RecordsSource } from '@ahpd/sdk';
import type { Applied } from './applyplugins.js';
import { maskOption, SET, withoutSpecSecrets, withoutUserinfoIn } from './commands/config.js';
import { oneAtATime, setPluginEnabled, setPluginOption, specsIn } from './install.js';
import { describePlugin, nameOf, optionsSchemaLoaded, optionsSchemaOf, pluginIdOf, schemaOf } from './plugins.js';

/** The channel, and the domain its commands are named after. */
const SCHEME = 'x-ahpd-plugins';
const DOMAIN = 'x-ahpd/plugins';

/** The code a wrong param is refused with, which the protocol calls `INVALID_PARAMS`. */
const INVALID_PARAMS = -32602;

/** The message of a throw, whatever was thrown. */
const reason = (error: unknown): string => error instanceof Error ? error.message : String(error);

/** A value that is one object, or `undefined` for anything else. */
const object = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

/**
 * The values among a spec's options that its schema marks `writeOnly`.
 *
 * A plugin's own error can quote what it was handed, and a write-only option is
 * a credential. Each such value is collected here so a served load problem can
 * take it out: a reference is a name rather than a value, so it is not one.
 */
const secretsOf = (schema: Record<string, unknown> | undefined, value: unknown, found: string[]): void => {
  if (schema === undefined || secretRef(value) !== undefined) return;
  if (Array.isArray(value)) {
    const items = object(schema['items']);
    for (const one of value) secretsOf(items, one, found);
    return;
  }
  const held = object(value);
  if (held !== undefined) {
    for (const [key, one] of Object.entries(held)) secretsOf(schemaOf(schema, key), one, found);
    return;
  }
  if (schema['writeOnly'] === true && typeof value === 'string' && value !== '') found.push(value);
};

/**
 * A load problem as a client may read it.
 *
 * Masked as every other answer is: the userinfo of any URL in the sentence, and
 * each write-only option value the plugin's own error quoted.
 */
const loadProblemOf = (line: string, spec: PluginSpec, schema: Record<string, unknown> | undefined): string => {
  const found: string[] = [];
  if (typeof spec !== 'string') secretsOf(schema, spec.options, found);
  let text = line;
  for (const secret of found) text = text.split(secret).join(SET);
  return withoutUserinfoIn(text);
};

/** What the channel and its commands are built from. */
export interface PluginsChannelOptions {
  /** The configuration file whose `plugins` are listed and edited. */
  configFile: string;
  /** What a spec is resolved against, as `describePlugin` takes it. */
  where: { configDir: string; cwd: string };
  /**
   * The plugins the daemon loaded, once it has.
   *
   * The channel is built before `loadPlugins` runs, because the host is built
   * over the channels and the fold is built over the host, so what loaded is
   * read through this on each listing rather than handed in.
   */
  loaded(): Loaded[];
  /**
   * The plugins the daemon could not load, by id, once it has.
   *
   * The same fact as `loaded()`, the other way: a row says `loaded: false` when
   * its id is absent here and when it is present with the line that says why.
   */
  failures(): Record<string, string>;
  /**
   * Load, unload or reconfigure what the file now says, in the daemon behind
   * this channel.
   *
   * Called after a command writes and inside the same turn, so what it applies
   * is exactly what the file now holds and no second writer can get between
   * the two. It answers whether the change needed a restart, and it sends the
   * rows, adapters and connectors it changed itself.
   *
   * Absent when a channel is built with no daemon behind it: a write then
   * refreshes the rows and answers `restart: true`, as every write did before
   * a change could apply while the daemon ran.
   *
   * A reload names the plugins to import again. Their entries did not change,
   * so the apply reads them here instead of finding them by comparing specs.
   */
  apply?(reload?: string[]): Promise<Applied>;
  /**
   * Mark that the running host is behind the file a command just wrote.
   *
   * Called after a command writes, and never when it is refused: a refusal
   * changed nothing, so there is nothing for a restart to apply.
   */
  restartNeeded(): void;
  /** Where a listing or an edit that could not be read or written is said. */
  onProblem?(message: string): void;
}

/** The plugin channel and its five commands, as the daemon hands them to `servedRecords`. */
export interface PluginsChannel {
  /** `x-ahpd-plugins`. */
  channel: RecordsChannel;
  /** `x-ahpd/plugins/enable`, `disable`, `options`, `apply` and `reload`, by name. */
  methods: Record<string, PluginMethod>;
  /** Refresh the channel. */
  refresh(): Promise<void>;
}

/**
 * The configured plugins as a channel, and the commands that change them.
 *
 * Reading needs `config:read`. Every command needs `config:write`, which is what
 * `ahpd plugin enable` and `ahpd plugin config set` need, and every one is run
 * one at a time with the command line's writers.
 */
export const pluginsChannel = (options: PluginsChannelOptions): PluginsChannel => {
  const { configFile, where } = options;

  /** The specs the file names, in its order. */
  const specs = (): PluginSpec[] => specsIn(configFile);

  /**
   * The schema a plugin's options are masked and checked by.
   *
   * The copy the daemon loaded comes first, because it is the plugin that is
   * running; a plugin that did not load is read from the module a load would
   * import, as `plugin config` reads it. A module that cannot be imported, and
   * one that is switched off, answer `undefined`, which marks every value.
   */
  const schemaFor = async (spec: PluginSpec, id: string): Promise<Record<string, unknown> | undefined> => {
    const held = optionsSchemaLoaded(id);
    if (held !== undefined) return held;
    if (typeof spec !== 'string' && spec.enabled === false) return undefined;
    try {
      return await optionsSchemaOf(spec, where);
    }
    catch {
      return undefined;
    }
  };

  /** One configured plugin, as a client lists it. */
  const rowOf = async (spec: PluginSpec): Promise<{ id: string; record: Record<string, unknown> }> => {
    // The id read before the row, because the schema the options are masked
    // with is the one the daemon holds under that id.
    const id = pluginIdOf(spec, where);
    const schema = await schemaFor(spec, id);
    const row = await describePlugin(spec, where);
    const loaded = options.loaded().find((one) => one.name === row.name);
    const manifest = loaded?.manifest;
    // What the daemon said when this plugin did not run, if it said anything.
    const failure = options.failures()[row.name];
    return {
      id: withoutUserinfoIn(row.name),
      record: {
        // Both places a spec can hold a credential: the userinfo of a URL it
        // installs from, and an option its schema marks `writeOnly`.
        spec: withoutSpecSecrets(row.spec, schema),
        name: withoutUserinfoIn(row.name),
        state: row.state,
        ...(row.version === undefined ? {} : { version: withoutUserinfoIn(row.version) }),
        ...(row.module === undefined ? {} : { module: withoutUserinfoIn(row.module) }),
        ...(row.url === undefined ? {} : { url: withoutUserinfoIn(row.url) }),
        ...(row.path === undefined ? {} : { path: withoutUserinfoIn(row.path) }),
        ...(row.title === undefined ? {} : { title: withoutUserinfoIn(row.title) }),
        ...(row.problem === undefined ? {} : { problem: withoutUserinfoIn(row.problem) }),
        // What the running daemon did, which the state does not say: a plugin
        // may be configured and yet not be running.
        loaded: loaded !== undefined,
        ...(failure === undefined ? {} : { loadProblem: loadProblemOf(failure, row.spec, schema) }),
        // The form a client draws, from the daemon's copy or the module it
        // would import; absent for one switched off, which is never imported.
        ...(schema === undefined ? {} : { optionsSchema: schema }),
        ...(manifest === undefined ? {} : { manifest }),
        // A plugin with no contracts is listed all the same, and said to be
        // undeclared: it is the listing's only way to tell the two apart.
        ...(loaded !== undefined && manifest?.contracts === undefined ? { undeclared: true } : {}),
      },
    };
  };

  /**
   * The id a spec is listed under, which is the one the spec is keyed by.
   *
   * A spec that does not resolve is its own id, so the userinfo of a URL it
   * names is masked here as it is in the row.
   */
  const idOf = (spec: PluginSpec): string => withoutUserinfoIn(pluginIdOf(spec, where));

  /** The entry a command names, by its id or by the spec as written. */
  const specOf = (id: string): PluginSpec | undefined => specs().find((one) => idOf(one) === id || nameOf(one) === id);

  const source: RecordsSource = {
    ids: async () => {
      const seen = new Set<string>();
      for (const spec of specs()) {
        const id = idOf(spec);
        if (seen.has(id)) {
          // A plugin configured twice is one row: the loader refuses the second
          // entry, so listing it twice would list one row the daemon does not
          // have. The first entry is the one kept, as the loader keeps it.
          options.onProblem?.(`plugins: ${id} is configured twice; its first entry is listed`);
          continue;
        }
        seen.add(id);
      }
      return [...seen];
    },
    find: async (id) => {
      const spec = specOf(id);
      return spec === undefined ? undefined : (await rowOf(spec)).record;
    },
  };

  const channel = recordsChannel(SCHEME, source, {
    grant: 'plugin:list' as Grant,
    describe: () => ({ title: 'Plugins', description: 'What the configuration names, and what a run would load.' }),
    ...(options.onProblem === undefined ? {} : { onProblem: options.onProblem }),
  });

  /** The id one command was given, or the refusal that says what it needs. */
  const idParam = (command: string, params: Record<string, unknown>): string => {
    const id = params.id;
    if (typeof id !== 'string' || id === '' || /[/?]/u.test(id)) {
      throw new RpcError(INVALID_PARAMS, `${command} needs id, the plugin's id as a row answers it, with no / or ?`);
    }
    return id;
  };

  /**
   * One turn at the configuration file and the daemon that serves it.
   *
   * The write and the load are one turn, so a second command cannot write
   * between them and a plugin is never applied over a file that moved under
   * it. With no daemon behind this channel, the write refreshes the rows here
   * and answers the restart every write used to mean.
   *
   * `reload` names the plugins the apply must import again, and is passed on
   * as given; every other change finds what moved by comparing the file.
   */
  const changed = async (work: () => Promise<Record<string, unknown>>, reload?: string[]): Promise<Record<string, unknown>> => oneAtATime(async () => {
    const answer = await work();
    if (options.apply === undefined) {
      await channel.refresh();
      options.restartNeeded();
      return { ...answer, restart: true };
    }
    const applied = await options.apply(reload);
    if (applied.restart) options.restartNeeded();
    return { ...answer, restart: applied.restart };
  });

  const toggle = (enabled: boolean): PluginMethod => ({
    grant: `plugin:${enabled ? 'enable' : 'disable'}` as Grant,
    describe: () => ({
      title: `${enabled ? 'Enable' : 'Disable'} a plugin`,
      description: `Turns a configured plugin ${enabled ? 'on' : 'off'}, keeping its entry and its options. The daemon loads or unloads it at once, unless it holds a port or a URI scheme.`,
    }),
    handle: (params) => changed(async () => {
      const id = idParam(`${DOMAIN}/${enabled ? 'enable' : 'disable'}`, params);
      try {
        setPluginEnabled(configFile, id, enabled);
      }
      catch (error) {
        throw new RpcError(INVALID_PARAMS, reason(error));
      }
      /*
       * The daemon loads or unloads it before this answers, and `changed` fills
       * in whether that needed a restart, so a plugin with a port is the only
       * one a client is told to restart for.
       */
      return { id, enabled, restart: true };
    }),
  });

  const optionsMethod: PluginMethod = {
    grant: 'plugin:options' as Grant,
    describe: () => ({
      title: "Write one of a plugin's options",
      description: 'Takes `id`, `key` and a `value` checked against the plugin\'s own schema, and writes it as `ahpd plugin config set` does. The daemon applies it at once, unless the plugin holds a port or a URI scheme. A `value` left out takes the option out, as `unset` does.',
    }),
    handle: (params) => changed(async () => {
      const name = `${DOMAIN}/options`;
      const id = idParam(name, params);
      const key = params.key;
      if (typeof key !== 'string' || key === '') {
        throw new RpcError(INVALID_PARAMS, `${name} needs key, the name of one of the plugin's options`);
      }
      const spec = specOf(id);
      if (spec === undefined) throw new RpcError(INVALID_PARAMS, `${id} is not in plugins in ${configFile}.`);
      const value = params.value;
      const disabled = typeof spec !== 'string' && spec.enabled === false;

      if (value !== undefined && !disabled) {
        /*
         * The same check `plugin config set` runs: a value the plugin's schema
         * refuses is not written, and a reference is held to the name rule
         * rather than to the option's schema, since what it resolves to is the
         * plugin's business. A plugin switched off, or one whose module does
         * not import, is written unchecked and checked when it loads.
         */
        const schema = await schemaFor(spec, id);
        const properties = schema?.['properties'];
        const known = typeof properties === 'object' && properties !== null && !Array.isArray(properties)
          ? properties as Record<string, unknown>
          : undefined;
        if (known !== undefined && Object.hasOwn(known, key)) {
          try {
            const ref = secretRef(value);
            if (ref === undefined) check(value, known[key] as JsonSchema, `plugins.${id}.options.${key}`);
            else scopeOf(ref);
          }
          catch (error) {
            throw new RpcError(INVALID_PARAMS, reason(error));
          }
        }
      }

      let written: boolean;
      try {
        written = setPluginOption(configFile, id, key, value);
      }
      catch (error) {
        throw new RpcError(INVALID_PARAMS, reason(error));
      }
      // Nothing written is nothing for the daemon to apply; `changed` sends the
      // rows either way and answers what the apply said.
      /*
       * `<set>` for a value the schema marks, as every answer about an option
       * says: a write is not the place a secret is handed back.
       */
      const masked = written && value !== undefined ? maskOption(await schemaFor(spec, id), key, value) : undefined;
      return {
        id,
        key,
        ...(value === undefined || !written ? {} : { value: masked }),
        restart: true,
      };
    }),
  };

  /**
   * Load what the file now names, without writing anything to it.
   *
   * This is the method the command line asks for after it writes the file
   * itself - `plugin install`, `remove` and `update` run npm or a filesystem
   * change and write the entry, then ask the daemon that serves this channel to
   * load what it wrote. A client that edits the file over root config or over
   * `enable` and `disable` does not need it: those apply as they write.
   */
  const applyMethod: PluginMethod = {
    grant: 'plugin:apply' as Grant,
    describe: () => ({
      title: 'Load what the configuration file now names',
      description: 'Loads, unloads or reconfigures the plugins to match the file, and answers `restart: true` only when a plugin with a port or a URI scheme is in the way.',
    }),
    handle: () => changed(async () => ({})),
  };

  /**
   * Import a plugin again, because the code it points at moved.
   *
   * Nothing in the file says so: the entry and its options are as they were,
   * and only the module behind them changed. The apply does the unload and the
   * load; this method is the way to say which plugin, since comparing specs
   * would find nothing to do. A plugin with a port or a URI scheme cannot be
   * swapped, and answers `restart: true` as the other changes do.
   */
  const reloadMethod: PluginMethod = {
    grant: 'plugin:reload' as Grant,
    describe: () => ({
      title: 'Import a plugin again',
      description: 'Takes `id`, the plugin whose code changed, and loads it from its module as it is now. Its closers run first, so what it opened is closed before the new code applies. A plugin with a port or a URI scheme answers `restart: true`.',
    }),
    handle: (params) => {
      const name = `${DOMAIN}/reload`;
      const id = idParam(name, params);
      return changed(async () => ({ id }), [id]);
    },
  };

  return {
    channel,
    methods: {
      [`${DOMAIN}/enable`]: toggle(true),
      [`${DOMAIN}/disable`]: toggle(false),
      [`${DOMAIN}/options`]: optionsMethod,
      [`${DOMAIN}/apply`]: applyMethod,
      [`${DOMAIN}/reload`]: reloadMethod,
    },
    refresh: channel.refresh,
  };
};
