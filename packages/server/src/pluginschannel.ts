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
 * never two writers reading the file and then writing it back. A daemon loads a
 * change at its next start, so every answer says `restart`.
 */

import { check } from '@cofold/commands';
import type { JsonSchema } from '@cofold/commands';
import { recordsChannel, RpcError, scopeOf, secretRef } from '@ahpd/sdk';
import type { Grant, Loaded, PluginMethod, PluginSpec, RecordsChannel, RecordsSource } from '@ahpd/sdk';
import { maskOption, withoutSpecSecrets, withoutUserinfoIn } from './commands/config.js';
import { oneAtATime, setPluginEnabled, setPluginOption, specsIn } from './install.js';
import { describePlugin, nameOf, optionsSchemaLoaded, optionsSchemaOf, pluginIdOf } from './plugins.js';

/** The channel, and the domain its commands are named after. */
const SCHEME = 'x-ahpd-plugins';
const DOMAIN = 'x-ahpd/plugins';

/** The code a wrong param is refused with, which the protocol calls `INVALID_PARAMS`. */
const INVALID_PARAMS = -32602;

/** The message of a throw, whatever was thrown. */
const reason = (error: unknown): string => error instanceof Error ? error.message : String(error);

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
  /** Where a listing or an edit that could not be read or written is said. */
  onProblem?(message: string): void;
}

/** The plugin channel and its three commands, as the daemon hands them to `servedRecords`. */
export interface PluginsChannel {
  /** `x-ahpd-plugins`. */
  channel: RecordsChannel;
  /** `x-ahpd/plugins/enable`, `disable` and `options`, by name. */
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
    return {
      id: withoutUserinfoIn(row.name),
      record: {
        // Both places a spec can hold a credential: the userinfo of a URL it
        // installs from, and an option its schema marks `writeOnly`.
        spec: withoutSpecSecrets(row.spec, schema),
        name: withoutUserinfoIn(row.name),
        state: row.state,
        ...(row.module === undefined ? {} : { module: withoutUserinfoIn(row.module) }),
        ...(row.url === undefined ? {} : { url: withoutUserinfoIn(row.url) }),
        ...(row.path === undefined ? {} : { path: withoutUserinfoIn(row.path) }),
        ...(row.title === undefined ? {} : { title: withoutUserinfoIn(row.title) }),
        ...(row.problem === undefined ? {} : { problem: withoutUserinfoIn(row.problem) }),
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
    grant: 'config:read' as Grant,
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

  /** One turn at the configuration file, which every command here shares with the command line. */
  const changed = async (work: () => Promise<Record<string, unknown>>): Promise<Record<string, unknown>> => oneAtATime(async () => {
    const answer = await work();
    // Every row this wrote is sent to every reader that holds one.
    await channel.refresh();
    return answer;
  });

  const toggle = (enabled: boolean): PluginMethod => ({
    grant: 'config:write' as Grant,
    describe: () => ({
      title: `${enabled ? 'Enable' : 'Disable'} a plugin`,
      description: `Turns a configured plugin ${enabled ? 'on' : 'off'}, keeping its entry and its options. The daemon loads the change at its next start.`,
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
       * A change is loaded by the next start, and this channel is only served
       * by a daemon that is running now, so the command line's served answer
       * and this one say the same thing.
       */
      return { id, enabled, restart: true };
    }),
  });

  const optionsMethod: PluginMethod = {
    grant: 'config:write' as Grant,
    describe: () => ({
      title: "Write one of a plugin's options",
      description: 'Takes `id`, `key` and a `value` checked against the plugin\'s own schema, and writes it as `ahpd plugin config set` does. A `value` left out takes the option out, as `unset` does.',
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

  return {
    channel,
    methods: {
      [`${DOMAIN}/enable`]: toggle(true),
      [`${DOMAIN}/disable`]: toggle(false),
      [`${DOMAIN}/options`]: optionsMethod,
    },
    refresh: channel.refresh,
  };
};
