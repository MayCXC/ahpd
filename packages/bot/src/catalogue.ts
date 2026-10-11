import { RpcError } from '@ahpd/sdk';
import { mayRead } from './provider.js';
import type { BotRecord } from './record.js';
import type { BotStore } from './store.js';
import type { ChannelHandle, PluginChannel, Principal } from '@ahpd/sdk';

/**
 * The `x-ahpd-bots://` channel: every bot a reader may read, kept current.
 *
 * A subscribe answers `{ bots }`, each record the same object a read of
 * `bot://<slug>` answers. Three actions follow it:
 *
 * - `x-ahpd-bots/added` `{ bot }` - a bot this client did not have, and may read now.
 * - `x-ahpd-bots/changed` `{ bot }` - a bot this client has, edited, and still readable.
 * - `x-ahpd-bots/removed` `{ id }` - a bot this client has, deleted or no longer readable.
 *
 * Each client is sent only what concerns it - decision
 * `a-plugin-channel-filters-each-action-per-subscriber` - so the catalogue
 * keeps the slugs it sent to each client. An edit that changes whether a client
 * may read the bot is `added` or `removed` to that client, never `changed`.
 */

/** The channel's scheme. */
export const CATALOGUE_SCHEME = 'x-ahpd-bots';

/** The one URI the catalogue answers on. */
export const CATALOGUE = `${CATALOGUE_SCHEME}://`;

/** What the provider tells the catalogue, after its store has the change. */
export interface BotCatalogue {
  /** A bot was made, `before` absent, or edited from `before`. */
  put(bot: BotRecord, before: BotRecord | undefined): void;
  /** A bot was deleted; `bot` is the record as it was. */
  remove(bot: BotRecord): void;
}

/** The catalogue, its channel, and the steps the plugin wires to the host. */
export interface Catalogue extends BotCatalogue {
  /** What `registerChannel` takes. */
  channel: PluginChannel;
  /** The handle `registerChannel` answered, which every publish goes through. */
  bind(handle: ChannelHandle): void;
  /** Memberships changed: send each client what it gained and lost. */
  recompute(): void;
}

/**
 * Whether this reader sees this bot in the catalogue.
 *
 * No reader is a host with no users directory, or the root connection, and
 * both see every bot - the answer `authorize` gives the `bot:` scheme.
 */
const readable = (bot: BotRecord, reader: Principal | undefined): boolean =>
  reader === undefined || mayRead(bot, reader);

export function botCatalogue(store: BotStore): Catalogue {
  /** The slugs sent to each client, by client id. */
  const sent = new Map<string, Set<string>>();
  let handle: ChannelHandle | undefined;

  /**
   * Whether this client holds this bot.
   *
   * A client with no set has had no snapshot since `left`, and is answered
   * by whether it could read the bot as it was.
   */
  const had = (client: string, reader: Principal | undefined, before: BotRecord): boolean =>
    sent.get(client)?.has(before.id) ?? readable(before, reader);

  const note = (client: string, slug: string, held: boolean): void => {
    const set = sent.get(client);
    if (set === undefined) return;
    if (held) set.add(slug);
    else set.delete(slug);
  };

  const publish = (type: 'added' | 'changed' | 'removed', body: { bot: BotRecord } | { id: string }, visible: (reader: Principal | undefined, client: string) => boolean): void => {
    handle?.publish(CATALOGUE, { type: `${CATALOGUE_SCHEME}/${type}`, ...body }, { visible });
  };

  return {
    channel: {
      grant: 'bot:read',
      describe: () => ({ title: 'Bots', description: 'Every bot the reader may read, kept current.' }),
      authorize: async (uri, reader) => uri === CATALOGUE && store.all().some((one) => mayRead(one, reader)),
      snapshot: (uri, reader, client) => {
        if (uri !== CATALOGUE) throw new RpcError(-32001, `No channel at ${uri}; the catalogue is ${CATALOGUE}`);
        const bots = store.all().filter((one) => readable(one, reader));
        sent.set(client, new Set(bots.map((one) => one.id)));
        return { bots };
      },
      left: (client) => { sent.delete(client); },
    },

    bind: (given) => { handle = given; },

    /*
     * Each publish carries a test the host asks at each send and each replay.
     * The test is also where the client's set is kept current, because it is
     * the one place that knows which client was sent what.
     */
    put: (bot, before) => {
      if (before === undefined) {
        publish('added', { bot }, (reader, client) => {
          if (!readable(bot, reader)) return false;
          note(client, bot.id, true);
          return true;
        });
        return;
      }
      publish('changed', { bot }, (reader, client) => had(client, reader, before) && readable(bot, reader));
      publish('added', { bot }, (reader, client) => {
        if (had(client, reader, before) || !readable(bot, reader)) return false;
        note(client, bot.id, true);
        return true;
      });
      publish('removed', { id: bot.id }, (reader, client) => {
        if (!had(client, reader, before) || readable(bot, reader)) return false;
        note(client, bot.id, false);
        return true;
      });
    },

    /*
     * Also to a client that could read the bot as it was. After a reconnect
     * the set is the one its snapshot made, which no longer has the bot, and a
     * replayed delete still has to reach that client.
     */
    remove: (bot) => {
      publish('removed', { id: bot.id }, (reader, client) => {
        if (!had(client, reader, bot) && !readable(bot, reader)) return false;
        note(client, bot.id, false);
        return true;
      });
    },

    /*
     * The difference is sent with `to`, to the one client it is about. A watch
     * that fires twice for one save finds nothing the second time.
     */
    recompute: () => {
      if (handle === undefined) return;
      const every = store.all();
      for (const { client, reader } of handle.subscribers(CATALOGUE)) {
        const now = new Set(every.filter((one) => readable(one, reader)).map((one) => one.id));
        const set = sent.get(client);
        sent.set(client, now);
        // A client with no set has nothing to diff against, and starts from here.
        if (set === undefined) continue;
        for (const bot of every) {
          if (now.has(bot.id) && !set.has(bot.id)) {
            handle.publish(CATALOGUE, { type: `${CATALOGUE_SCHEME}/added`, bot }, { to: client });
          }
        }
        for (const id of set) {
          if (!now.has(id)) handle.publish(CATALOGUE, { type: `${CATALOGUE_SCHEME}/removed`, id }, { to: client });
        }
      }
    },
  };
}
