import { expandHome } from '@ahpd/sdk';
import { botCatalogue, CATALOGUE_SCHEME } from './catalogue.js';
import { botChatAgent } from './chat.js';
import { botProvider, CHATS } from './provider.js';
import { isSlug } from './record.js';
import { botStore } from './store.js';
import { LAST_CHATS } from './template.js';
import type { Plugin } from '@ahpd/sdk';

/**
 * The package as a plugin.
 *
 * One provider for the `bot:` scheme, the `x-ahpd-bots://` catalogue of the
 * bots each reader may read, the `bot-chat` agent a chat with a bot runs as,
 * and the folder bots work in as its one option. The records are kept in the
 * host's own record store rather than under the option: what a bot *is* belongs
 * to the host, and where it works is the operator's to choose.
 *
 * `instructions` is the collection's body, so it is the Markdown half of the
 * file a person edits, and every other field is frontmatter above it. A
 * template is a record of the `templates` collection, whose body is `text`.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = 'bot';

/** What a listing prints. */
export const title = 'Bot';

/** What an option falls back to. */
export const defaults = {
  root: '~/.bots',
  lastChats: LAST_CHATS,
} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    root: { type: 'string', description: "The folder a bot's own workspace is under, as <root>/<slug>." },
    lastChats: { type: 'integer', minimum: 1, description: 'How many chats a template lists for {{chats}}.' },
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
  const asked_ = options.lastChats;
  const lastChats = typeof asked_ === 'number' && Number.isInteger(asked_) && asked_ >= 1 ? asked_ : defaults.lastChats;
  const kept = host.records('templates', { body: 'text' });
  const templates = {
    // A bot file is edited by hand too, so a name is checked again here.
    text: async (name: string): Promise<string | undefined> => {
      if (!isSlug(name)) return undefined;
      const text = (await kept.get(name))?.['text'];
      return typeof text === 'string' ? text : undefined;
    },
    lastChats,
  };
  /*
   * One row per bot and person, holding the chat they talk in. What makes a
   * read of `bot://` answer the same chat the second time as the first.
   */
  const chats = host.records(CHATS);
  const catalogue = botCatalogue(store);
  catalogue.bind(host.registerChannel(CATALOGUE_SCHEME, catalogue.channel));
  host.on('users_changed', () => { catalogue.recompute(); });
  host.registerResourceProvider('bot', botProvider({
    root,
    store,
    catalogue,
    hostName: host.hostName,
    templates,
    chats,
    sessions: {
      owner: (uri) => host.sessionOwner(uri),
      start: (wanted) => host.startSession(wanted),
    },
  }));
  /*
   * A chat with a bot: a session of its own that runs no model, one JSON line
   * per turn under the daemon's own configuration. What a read of `bot://`
   * starts, and where a person and their bot talk. See `chat.ts`.
   */
  host.registerAgent(botChatAgent(host.configDir, store));
};
