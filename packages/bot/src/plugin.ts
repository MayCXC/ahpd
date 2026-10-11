import { expandHome } from '@ahpd/sdk';
import { botCatalogue, CATALOGUE_SCHEME } from './catalogue.js';
import { botProvider } from './provider.js';
import { botStore } from './store.js';
import type { Plugin } from '@ahpd/sdk';

/**
 * The package as a plugin.
 *
 * One provider for the `bot:` scheme, the `x-ahpd-bots://` catalogue of the
 * bots each reader may read, and the folder bots work in as its one option.
 * The records are kept in the host's own record store rather than under the
 * option: what a bot *is* belongs to the host, and where it works is the
 * operator's to choose.
 *
 * `instructions` is the collection's body, so it is the Markdown half of the
 * file a person edits, and every other field is frontmatter above it.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = '@ahpd/bot';

/** What a listing prints. */
export const title = 'Bot';

/** What an option falls back to. */
export const defaults = {
  root: '~/.bots',
} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    root: { type: 'string', description: "The folder a bot's own workspace is under, as <root>/<slug>." },
  },
};

export const apply: Plugin['apply'] = (host, options) => {
  const asked = options.root as string | undefined;
  const root = expandHome(asked === undefined || asked.trim() === '' ? defaults.root : asked);
  const store = botStore(
    host.records('bots', { body: 'instructions' }),
    host.records('bots-gone'),
    (line) => { host.problem(`${name}: ${line}`); },
  );
  const catalogue = botCatalogue(store);
  catalogue.bind(host.registerChannel(CATALOGUE_SCHEME, catalogue.channel));
  host.on('users_changed', () => { catalogue.recompute(); });
  host.registerResourceProvider('bot', botProvider({
    root,
    store,
    catalogue,
    hostName: host.hostName,
    sessions: {
      owner: (uri) => host.sessionOwner(uri),
      start: (wanted) => host.startSession(wanted),
    },
  }));
};
