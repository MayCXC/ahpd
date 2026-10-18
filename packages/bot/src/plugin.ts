import { expandHome, reason, Status } from '@ahpd/sdk';
import { botAsk } from './ask.js';
import { botCatalogue, CATALOGUE_SCHEME } from './catalogue.js';
import { botChatAgent } from './chat.js';
import { prepareAgentsTemplate } from './folder.js';
import { backSessions, SESSIONS } from './names.js';
import { postMessage } from './post.js';
import { botProvider, CHATS } from './provider.js';
import { isSlug } from './record.js';
import { botStore } from './store.js';
import { agentsTextOf, LAST_CHATS } from './template.js';
import { botWake, isMainTurnAbsence } from './wake.js';
import type { MainTurnAbsence } from './wake.js';
import type { Bag, Plugin, PluginPeer } from '@ahpd/sdk';
import type { BotSessions } from './provider.js';

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
 * The default `AGENTS.md` template is a file of its own, under
 * `<configDir>/templates/bots/`: this writes it at load when it is absent, and
 * a person may edit it after. It is not a record, because it is the one text
 * every bot starts from rather than a named one, and the `templates`
 * collection reads only the `.md` records directly in its folder.
 *
 * A message said to a bot wakes the back session its record names, which is
 * `wake.ts` - and the connection that sends it is here, because a plugin
 * reaching the sessions of its own host has to arrive as a client does. It is
 * opened on the first message that needs it, so a daemon nobody talks to opens
 * none.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = 'bot';

/** What a listing prints. */
export const title = 'Bot';

/** What an option falls back to. */
export const defaults = {
  root: '~/.bots',
  lastChats: LAST_CHATS,
  mainTurnPostMessageAbsent: 'post',
} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    root: { type: 'string', description: "The folder a bot's own workspace is under, as <root>/<slug>." },
    lastChats: { type: 'integer', minimum: 1, description: 'How many chats a template lists for {{chats}}.' },
    mainTurnPostMessageAbsent: {
      type: 'string',
      description: "What a main turn does when the back session's turn ends without post_message: post (the default), notice, silence or postNotice.",
    },
  },
};

/** What the plugin's connection to the host calls itself, which is how it knows its own frames. */
const CLIENT = 'ahpd-bot';

/** How long a dispatch waits for the host's echo before it goes on as taken, in milliseconds. */
const ECHO_MS = 10_000;

/** Dispatches actions on the plugin's connection, and hears whether the host took each one. */
interface Dispatcher {
  /** Dispatch one action, and give the host's refusal reason, or `undefined` when the host took it or said nothing. */
  dispatch(channel: string, action: Record<string, unknown>): Promise<string | undefined>;
}

/**
 * The dispatcher over the plugin's connection, which sets its one `onMessage`
 * handler.
 *
 * Each dispatch carries the next `clientSeq`, and the host answers an action it
 * applied with an `action` frame naming that `clientId` and that `clientSeq` -
 * with a `rejectionReason` when it refused it, and without one when it took it.
 * The host echoes a taken action only to the subscribers of its channel, so a
 * caller subscribes first. A dispatch that hears nothing in `waitMs` gives
 * `undefined` and calls `silent`: only a refusal the host sent is a refusal,
 * since an action a host is still holding can still be applied.
 */
function dispatcher(conn: PluginPeer, clientId: string, waitMs: number, silent?: (channel: string) => void): Dispatcher {
  let seq = 0;
  const waiting = new Map<number, (refused: string | undefined) => void>();
  conn.onMessage((message) => {
    if (message.method !== 'action') return;
    const params = message.params as { origin?: { clientId?: unknown; clientSeq?: unknown }; rejectionReason?: unknown } | undefined;
    const origin = params?.origin;
    if (origin?.clientId !== clientId || typeof origin.clientSeq !== 'number') return;
    const done = waiting.get(origin.clientSeq);
    if (done === undefined) return;
    waiting.delete(origin.clientSeq);
    done(typeof params?.rejectionReason === 'string' ? params.rejectionReason : undefined);
  });
  return {
    dispatch: (channel, action) => {
      seq += 1;
      const clientSeq = seq;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiting.delete(clientSeq);
          silent?.(channel);
          resolve(undefined);
        }, waitMs);
        timer.unref?.();
        waiting.set(clientSeq, (refused) => {
          clearTimeout(timer);
          resolve(refused);
        });
        conn.notify('dispatchAction', { channel, clientSeq, action });
      });
    },
  };
}

/** The plugin's connection to the host, and the dispatcher over it. */
interface Opened {
  conn: PluginPeer;
  sender: Dispatcher;
}

/**
 * The text of one turn in a chat's state: its `markdown` response parts, joined.
 *
 * Read off the chat rather than off `turn_end`, which names a turn but not what
 * it said. The parts are the answer a client draws, and the markdown ones are
 * the answer a person reads.
 */
const textOf = (state: unknown, turn: string): string => {
  const turns = (state as { turns?: unknown } | undefined)?.turns;
  if (!Array.isArray(turns)) return '';
  const found = turns.find((one: unknown) => (one as { id?: unknown }).id === turn) as { responseParts?: unknown } | undefined;
  const parts = Array.isArray(found?.responseParts) ? found.responseParts as { kind?: unknown; content?: unknown }[] : [];
  return parts.filter((part) => part.kind === 'markdown').map((part) => String(part.content ?? '')).join('');
};

export const apply: Plugin['apply'] = (host, options) => {
  const asked = options.root as string | undefined;
  const root = expandHome(asked === undefined || asked.trim() === '' ? defaults.root : asked);
  /*
   * The default `AGENTS.md` template, written once where there is none.
   *
   * A person edits it by hand, so it is written only when it is absent and
   * never over: an update to ahpd does not replace what they wrote. A failure
   * to write it costs the file and not the plugin - a wake falls back to the
   * text ahpd ships - so the operator is told and the daemon goes on.
   */
  try {
    prepareAgentsTemplate(host.configDir);
  }
  catch (error) {
    host.problem(`${name}: the default AGENTS.md template was not written: ${reason(error)}`);
  }
  const store = botStore(
    host.records('bots', { body: 'instructions' }),
    host.records('bots-gone'),
    (line) => { host.problem(`${name}: ${line}`); },
  );
  const asked_ = options.lastChats;
  const lastChats = typeof asked_ === 'number' && Number.isInteger(asked_) && asked_ >= 1 ? asked_ : defaults.lastChats;
  /*
   * What a main turn does when a back session's turn ends without a post.
   *
   * The schema checks that the option is a string and not which one, so a value
   * outside the table is reported here and `post` is used: a person waiting on
   * a reply is owed the bot's last words, not an empty turn caused by a typo in
   * the daemon's configuration.
   */
  const askedAbsent = options.mainTurnPostMessageAbsent;
  const absent: MainTurnAbsence = isMainTurnAbsence(askedAbsent) ? askedAbsent : defaults.mainTurnPostMessageAbsent;
  if (askedAbsent !== undefined && !isMainTurnAbsence(askedAbsent)) {
    host.problem(`${name}: mainTurnPostMessageAbsent is ${JSON.stringify(askedAbsent)}, which is not one of post, notice, silence or postNotice; using post`);
  }
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
  /*
   * One row per back session: the bot, the person and the name a message
   * addresses, and the session that name is on. What makes a name a session a
   * person can come back to, rather than one started again every time.
   */
  const backs = backSessions(host.records(SESSIONS));
  /*
   * The plugin's own connection to this host, opened by the first message that
   * needs one.
   *
   * A bot's work runs in a session of its own and a message reaches it as a
   * turn, which is a client action: a plugin is a client of its own host, and
   * `connect` is the only door onto one - there is no plugin-side "send a
   * turn". Opened here rather than when the daemon listens, because nothing
   * this plugin does needs it before somebody says something to a bot; a
   * connection that failed is dropped, so the next message tries again.
   */
  let opened: Promise<Opened> | undefined;
  const connection = (): Promise<Opened> => {
    opened ??= (async () => {
      const conn = host.connect();
      const sender = dispatcher(conn, CLIENT, ECHO_MS, (channel) => {
        host.problem(`${name}: the host did not echo an action in ${channel} in ${ECHO_MS / 1000} seconds`);
      });
      await conn.request('initialize', { clientId: CLIENT, protocolVersions: ['0.9.0'] });
      return { conn, sender };
    })();
    const failed = (): void => { opened = undefined; };
    opened.catch(failed);
    return opened;
  };
  /** This host's own sessions, where a chat and a back session are started, and read for the one a bot has. */
  const sessions: BotSessions = {
    owner: (uri) => host.sessionOwner(uri),
    start: (wanted) => host.startSession(wanted),
  };
  /**
   * One action sent on a chat of this host, as a client sends one.
   *
   * The host echoes a taken action only to the subscribers of its channel, so
   * the chat is subscribed first. Shared by the wake, which sends a person's
   * message, and the asking, which sends their answer back.
   */
  const send = async (chat: string, action: Bag): Promise<string | undefined> => {
    const { conn, sender } = await connection();
    await conn.request('subscribe', { channel: chat });
    return await sender.dispatch(chat, action);
  };
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
    backSessions: backs,
    sessions,
  }));
  /*
   * The wake: every turn one of those chats begins, and every message steered
   * into an open one, goes to the back session the bot's record names. A chat
   * this plugin did not open - one a client started by itself - names no bot
   * in the rows and is left as it was.
   */
  const wake = botWake({
    store,
    chats,
    backs,
    sessions,
    /*
     * The bot's `AGENTS.md`, made when its folder is first prepared: the
     * template record it names, or the default file under the configuration
     * folder, filled with its words. Read per wake rather than kept, because a
     * template is a file a person edits.
     */
    agents: (bot) => agentsTextOf(bot, templates, host.configDir),
    /*
     * A back session's chat, and whether a turn is running in it: the two
     * things a message needs, both read off the session's own state, which is
     * what a subscribe answers. Idle means the message begins a turn, and
     * working means it steers the one that is running.
     */
    look: async (session) => {
      const { conn } = await connection();
      const answered = await conn.request('subscribe', { channel: session }) as { snapshot?: { state?: Bag } };
      const state = answered.snapshot?.state ?? {};
      const chat = state['defaultChat'];
      if (typeof chat !== 'string' || chat === '') {
        throw new Error(`${session} names no chat to say a message in`);
      }
      const status = typeof state['status'] === 'number' ? state['status'] : Status.Idle;
      return { chat, working: (status & Status.InProgress) !== 0 };
    },
    send,
    problem: (line) => { host.problem(`${name}: ${line}`); },
  }, absent);
  /*
   * A back session's question, asked in the main turn that woke it.
   *
   * The request is read off the session's own state, which is what the event
   * names but does not carry, and the answer is sent to the chat it was asked
   * in. A session no main chat is waiting on is left alone: it may be a
   * session of another plugin's, or one whose person's turn has ended.
   */
  const ask = botAsk({
    main: (backSession) => wake.main(backSession),
    request: async (session, id) => {
      const { conn } = await connection();
      const answered = await conn.request('subscribe', { channel: session }) as { snapshot?: { state?: Bag } };
      const list = answered.snapshot?.state?.['inputNeeded'];
      if (!Array.isArray(list)) return undefined;
      const found = list.find((one: unknown) => (
        typeof one === 'object' && one !== null && (one as Bag)['id'] === id
      ));
      return found === undefined ? undefined : found as Bag;
    },
    send,
    problem: (line) => { host.problem(`${name}: ${line}`); },
  });
  host.on('input_needed_set', (event) => {
    void ask.asked(event.session, event.id).catch((error: unknown) => {
      host.problem(`${name}: the request ${event.id} in ${event.session} was not shown: ${reason(error)}`);
    });
  });
  host.on('input_needed_removed', (event) => { ask.withdrawn(event.session, event.id); });
  /*
   * How a main turn ends, the two ways a back session has of ending it: the
   * `post_message` tool, which answers it with what the session says, and the
   * end of the session's own turn, which answers it as the option
   * `mainTurnPostMessageAbsent` says. The tool finds the chat from the calling
   * session, and the event names the session that ended a turn - neither can
   * name somebody else's.
   */
  host.registerTool(postMessage(wake));
  /*
   * The end of a turn: the words it ended with, read off the session's chat.
   *
   * Every turn of the daemon raises the event, so one no main chat is waiting
   * on is left alone rather than read. The session is asked again after the
   * read, because a message that arrived meanwhile woke it again and holds a
   * turn of its own: answering that turn with these words would answer a
   * message nobody sent. A read that fails is reported and the main turn ends
   * with no text, so a person waiting on it is not left waiting on an error
   * they cannot see.
   */
  host.on('turn_end', (event) => {
    const held = wake.main(event.session);
    if (held === undefined) return;
    /*
     * Whether this is still the main turn waiting when the read comes back: a
     * message that arrived meanwhile holds its own turn in the same chat, and
     * these words are not its answer. The handle is the chat's and is the same
     * for every turn in it, so the turn is compared as well.
     */
    const still = (): boolean => {
      const now = wake.main(event.session);
      return now !== undefined && now.handle === held.handle && now.turnId === held.turnId;
    };
    const read = (async (): Promise<string> => {
      const { conn } = await connection();
      const answered = await conn.request('subscribe', { channel: event.chat }) as { snapshot?: { state?: unknown } };
      return textOf(answered.snapshot?.state, event.turn);
    })();
    read.then((text) => {
      if (!still()) return;
      wake.finished(event.session, text);
    }, (error: unknown) => {
      host.problem(`${name}: the end of turn ${event.turn} in ${event.chat} was not read: ${reason(error)}`);
      if (!still()) return;
      wake.finished(event.session, '');
    });
  });
  /*
   * A chat with a bot: a session of its own that runs no model, one JSON line
   * per turn under the daemon's configuration folder. Every message in one,
   * new or resumed, goes to the wake. See `chat.ts`.
   */
  host.registerAgent(botChatAgent(host.configDir, store, (message, handle) => {
    wake.woken(message, handle).catch((error: unknown) => {
      host.problem(`${name}: a message in ${message.session} was not woken: ${reason(error)}`);
    });
  }));
};
