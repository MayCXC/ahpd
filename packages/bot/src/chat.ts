import { appendFileSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Status, idOf, uriOf } from '@ahpd/sdk';
import type { Agent, Bag, Listed, MessageFrom, Session, Start } from '@ahpd/sdk';
import type { BotRecord } from './record.js';
import type { BotStore } from './store.js';

/**
 * A chat with a bot: a session of its own that runs no model.
 *
 * A bot is a record on `bot://` and the work it does runs in a session of its
 * own, so what a person says *to* it needs a place to be said. That place is a
 * chat: one session of this provider per bot and person, started by a read of
 * the bot (see `provider.ts`), titled with the bot's name, working in the bot's
 * folder.
 *
 * Nothing runs here. A turn ends in the same call it starts in, with no
 * response part and no model behind it - the answer arrives later, as the bot's
 * own session posts into this one. What this backend is for is the *log*: one
 * JSON line per turn under `<configDir>/bot-chats/`, which is what lets a
 * daemon that restarts list a chat, open it, and show what was said in it.
 *
 * The log is the whole of the state. Nothing about a chat is kept in memory
 * past the process that made it, so `list`, `find` and `transcript` read the
 * folder and there is no index that could fall out of step with it.
 */

/**
 * One turn, as `Agent.transcript` answers with it.
 *
 * Named by query rather than imported from the protocol package: an agent
 * backend states its protocol shapes through `@ahpd/sdk`, and taking a second
 * dependency to repeat the same type would be a boundary this package does not
 * declare.
 */
type Transcript = NonNullable<Awaited<ReturnType<NonNullable<Agent['transcript']>>>>;
type ChatTurn = Transcript[number];

/** The provider id a chat is registered and named under. */
export const CHAT_PROVIDER = 'bot-chat';

/** The folder the chats are kept in, under the daemon's own configuration. */
export const CHATS_DIR = 'bot-chats';

/** What a chat's log file is named with. */
const LOG = '.jsonl';

/** The file one chat's log is in. */
const fileOf = (dir: string, id: string): string => join(dir, `${encodeURIComponent(id)}${LOG}`);

/**
 * The id a log file's name holds, or nothing when the name is not one.
 *
 * A log is named by a session id, which is a client's to choose, so the name is
 * escaped on the way out and read back here. A file a person put in the folder
 * by hand, and one whose name is not readable text, are both left out.
 */
const idOfFile = (name: string): string | undefined => {
  if (!name.endsWith(LOG)) return undefined;
  try {
    const id = decodeURIComponent(name.slice(0, -LOG.length));
    return id === '' ? undefined : id;
  }
  catch { return undefined; }
};

/**
 * The bot's mark, as the `_meta` of a chat and of its session.
 *
 * What says which bot a chat is for. `kind` is `direct` because that is what
 * this is: one person, one bot, nobody else in it.
 */
const markOf = (bot: BotRecord): Bag => ({
  bot: bot.id,
  name: bot.name,
  color: bot.color,
  labels: bot.labels,
  body: bot.body,
  kind: 'direct',
});

/** The `_meta` one log line or one chat state carries, where it carries one. */
const markIn = (said: Bag): Bag | undefined => {
  const meta = said['_meta'];
  return typeof meta === 'object' && meta !== null && !Array.isArray(meta) ? meta as Bag : undefined;
};

/** The message a turn carries: what was said, and who said it. */
const messageOf = (text: string, from?: MessageFrom): ChatTurn['message'] => ({
  text,
  origin: from?.origin ?? { kind: 'user' },
  ...(from?._meta === undefined ? {} : { _meta: from._meta }),
});

/**
 * One turn read back off a log line, or nothing when the line is not one.
 *
 * A log a person has edited by hand can say anything, so what comes back is
 * built here rather than trusted: a line with no turn id and no text is left
 * out, and the rest is read for the fields the protocol requires. The mark the
 * line carries stays behind - it is there for `list` and `find`, and a turn
 * served to a client is the turn alone.
 */
const turnOf = (said: Bag): ChatTurn | undefined => {
  const id = said['id'];
  const message = said['message'];
  if (typeof id !== 'string' || id === '') return undefined;
  if (typeof message !== 'object' || message === null || Array.isArray(message)) return undefined;
  const held = message as Bag;
  if (typeof held['text'] !== 'string') return undefined;
  const origin = held['origin'];
  return {
    id,
    ...(typeof said['startedAt'] === 'string' ? { startedAt: said['startedAt'] } : {}),
    ...(typeof said['duration'] === 'number' ? { duration: said['duration'] } : {}),
    message: {
      text: held['text'],
      // The protocol requires an origin, and a line with none was written by a
      // person: every turn in a chat here is.
      origin: (typeof origin === 'object' && origin !== null ? origin : { kind: 'user' }) as ChatTurn['message']['origin'],
      ...(typeof held['_meta'] === 'object' && held['_meta'] !== null ? { _meta: held['_meta'] as Bag } : {}),
    },
    responseParts: Array.isArray(said['responseParts']) ? said['responseParts'] as Bag[] : [],
    state: 'complete',
    usage: undefined,
  };
};

/**
 * What one chat's log holds: its turns, and the mark its lines carry.
 *
 * Nothing when there is no log for the id, which is a chat this host does not
 * have - a different answer from a log with no turns in it, which is one
 * nothing has been said to yet.
 *
 * Every line carries the mark, and not only the first: a line is a turn, two
 * turns are two lines, and a file whose first line is unreadable still says
 * which chat it is. It is what tells a listing which bot a chat is for, since
 * the file is named by a session id and says nothing else.
 */
const logAt = (path: string): { turns: ChatTurn[]; mark: Bag | undefined } | undefined => {
  let text: string;
  try { text = readFileSync(path, 'utf8'); }
  catch { return undefined; }
  const turns: ChatTurn[] = [];
  let mark: Bag | undefined;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    let said: unknown;
    // A line nobody can read is left out, as a bot the store cannot read is.
    try { said = JSON.parse(line); }
    catch { continue; }
    if (typeof said !== 'object' || said === null || Array.isArray(said)) continue;
    const one = turnOf(said as Bag);
    if (one === undefined) continue;
    mark ??= markIn(said as Bag);
    turns.push(one);
  }
  return { turns, mark };
};

/** Add one turn to a chat's log, making the folder the first time. */
const append = (dir: string, id: string, said: Bag): void => {
  mkdirSync(dir, { recursive: true });
  appendFileSync(fileOf(dir, id), `${JSON.stringify(said)}\n`, 'utf8');
};

/**
 * One chat's row, read off its log, or nothing when there is no log.
 *
 * The name and the folder are the bot's as it is now, read from the store; the
 * mark is what says which bot a chat is for, and it is the whole answer for a
 * chat whose bot has since been deleted.
 */
const rowOf = (dir: string, id: string, store: BotStore): Listed | undefined => {
  const path = fileOf(dir, id);
  let born: Date;
  let touched: Date;
  try {
    const stat = statSync(path);
    born = stat.birthtime;
    touched = stat.mtime;
  }
  catch { return undefined; }
  const log = logAt(path);
  if (log === undefined) return undefined;
  const slug = typeof log.mark?.['bot'] === 'string' ? log.mark['bot'] : '';
  const bot = store.get(slug);
  const named = log.mark?.['name'];
  return {
    id,
    title: bot?.name ?? (typeof named === 'string' && named !== '' ? named : id),
    createdAt: born.toISOString(),
    modifiedAt: touched.toISOString(),
    workingDirectories: bot === undefined ? [] : [uriOf(bot.workspace)],
  };
};

/**
 * The `bot-chat` agent, over one daemon's configuration folder and its bots.
 *
 * `store` is read rather than a file of its own, because a chat is a chat
 * *with a bot*: which bot it is for is checked at `create`, and a slug no bot
 * has is refused there rather than opening a session nothing can answer.
 */
export function botChatAgent(configDir: string, store: BotStore): Agent {
  /** The folder every chat of this daemon is under. */
  const dir = join(configDir, CHATS_DIR);

  /**
   * One chat: the turns it holds and the bot it is a chat with.
   *
   * The turns are read off the log whole, so a chat the host starts again -
   * after a restart, or because a client opened a row it was not holding -
   * opens on what was said in it rather than on an empty conversation.
   */
  function chat(start: Start, bot: BotRecord, id: string, mark: Bag): Session {
    const turns: ChatTurn[] = logAt(fileOf(dir, id))?.turns ?? [];
    let modified = new Date().toISOString();
    let draft: Bag | undefined;

    const touch = (): void => { modified = new Date().toISOString(); };

    /**
     * Say one turn, and keep it.
     *
     * The line goes down before the turn is announced, so a log that could not
     * be written is a turn that did not happen rather than one a client watched
     * and a restart cannot read back.
     *
     * `queuedMessageId` names what a queued message was waiting as. A client's
     * reducer takes that entry out of its queue on the turn naming it, which is
     * how the queue empties as its turns start.
     */
    const beginTurn = (turnId: string, text: string, from?: MessageFrom, queuedMessageId?: string): void => {
      const startedAt = new Date().toISOString();
      const message = messageOf(text, from);
      /*
       * Read before the write rather than after: a turn's duration is the
       * turn's, and the two actions below carry the number the log does.
       */
      const duration = Date.now() - Date.parse(startedAt);
      const turn: ChatTurn = {
        id: turnId,
        startedAt,
        duration,
        message,
        responseParts: [],
        state: 'complete',
        usage: undefined,
      };
      append(dir, id, { ...turn, _meta: mark });
      turns.push(turn);
      touch();
      start.emit('chat', {
        type: 'chat/turnStarted',
        turnId,
        startedAt,
        message,
        ...(queuedMessageId === undefined ? {} : { queuedMessageId }),
      });
      start.emit('chat', { type: 'chat/turnComplete', turnId, duration });
    };

    return {
      uri: start.uri,
      chatUri: start.chatUri,

      // No model runs here, and there is nothing of this backend's own to show
      // beside the host's. Empty lists are real answers.
      models: () => [],
      agentId: () => id,
      customizations: () => start.seedCustomizations ?? [],

      allTurns: () => turns,
      // `SessionStatus`: a turn ends in the call that starts it, so there is
      // never one running here to report.
      status: () => Status.Idle,
      activity: () => undefined,
      title: () => bot.name,
      modifiedAt: () => modified,
      workingDirectories: () => [uriOf(bot.workspace)],

      sessionState: () => ({
        // No `resource`: it is declared on `SessionSummary` and not on
        // `SessionState`, and a client subscribed to this channel named it.
        provider: CHAT_PROVIDER,
        title: bot.name,
        status: Status.Idle,
        lifecycle: 'ready',
        defaultChat: start.chatUri,
        chats: [{ resource: start.chatUri, title: bot.name }],
        workingDirectories: [uriOf(bot.workspace)],
        customizations: start.seedCustomizations ?? [],
        // The schema *and* what is in force: a client reads
        // `config.schema.properties` to know which controls to draw and
        // `config.values` to know where each one sits.
        config: { schema: start.schema(), values: { ...start.settings } },
        _meta: mark,
      }),

      chatState: () => ({
        resource: start.chatUri,
        title: bot.name,
        status: Status.Idle,
        modifiedAt: modified,
        turns,
        ...(draft === undefined ? {} : { draft }),
        _meta: mark,
      }),

      // The client says a turn has begun; making it true - and writing it down -
      // is this method.
      begin: (turnId, text, _model, from) => { beginTurn(turnId, text, from); },

      /**
       * A message a client held for later.
       *
       * Nothing ever waits behind anything here, so it is said at once, under a
       * turn id of its own and naming the entry it was: it is announced first
       * because a client draws the queue it was put in.
       */
      queue: (id, text, _model, from) => {
        start.emit('chat', { type: 'chat/pendingMessageSet', kind: 'queued', id, message: messageOf(text, from) });
        beginTurn(crypto.randomUUID(), text, from, id);
      },

      // Nothing waits and nothing runs, so there is nothing for either of these
      // to move or stop. A turn here is over before a client could ask.
      unqueue: () => {},
      reorder: () => {},
      cancel: () => {},

      // Held by the session, so two people on one chat see each other's - which
      // is the whole of what a draft is for.
      setDraft: (next) => {
        if (JSON.stringify(next) === JSON.stringify(draft)) return;
        draft = next;
        // The key is left off to clear it, which is what the action's
        // `undefined` means and the only way JSON can say it.
        start.emit('chat', { type: 'chat/draftChanged', ...(next !== undefined ? { draft: next } : {}) });
      },

      // Nothing here ever asks, so there is never anything to answer.
      confirm: () => {},
      answer: () => false,

      // No runtime switch and no MCP servers, so all three refuse. False is a
      // real answer: a control that reported success and changed nothing would
      // be worse than one that says no.
      setCustomizationEnabled: async () => false,
      startMcpServer: async () => false,
      stopMcpServer: async () => false,

      settings: () => ({ ...start.settings }),

      // Nothing runs between turns: no process to stop and no timer to clear.
      close: () => {},
    };
  }

  return {
    provider: CHAT_PROVIDER,
    displayName: 'Bot chat',
    description: 'A chat with a bot. What you say is kept here; the bot answers through the work it is doing.',

    // The one key is the bot, and it cannot move: a chat is with the bot it was
    // started for, which is also the bot whose folder it works in.
    schema: () => ({
      properties: {
        bot: {
          type: 'string',
          title: 'Bot',
          description: 'The bot this chat is with, by its slug.',
          sessionMutable: false,
        },
      },
    }),
    defaults: () => ({}),

    /** Every chat this daemon has a log for, read off the folder. */
    list: async (): Promise<Listed[]> => {
      // The records first, as a read of `bot://` does: a row's name and folder
      // are the bot's, and the cache holding them is filled by this.
      await store.ready();
      let names: string[];
      try { names = readdirSync(dir); }
      catch { return []; }
      const rows: Listed[] = [];
      for (const name of names.sort()) {
        const id = idOfFile(name);
        if (id === undefined) continue;
        const row = rowOf(dir, id, store);
        if (row !== undefined) rows.push(row);
      }
      return rows;
    },

    find: async (id) => {
      await store.ready();
      return rowOf(dir, id, store);
    },

    /**
     * A chat's turns, read without starting anything.
     *
     * What makes a row openable. Undefined is a real answer: it is a chat this
     * host has no log for.
     */
    transcript: async (id) => logAt(fileOf(dir, id))?.turns,

    create: (start) => {
      const asked = start.settings['bot'];
      const slug = typeof asked === 'string' ? asked.trim() : '';
      // The store's cache, which is what a read of `bot://` answers from too.
      // A chat is started by one of those reads, so the bot is here by then.
      const bot = slug === '' ? undefined : store.get(slug);
      // A plain sentence rather than a coded refusal: the host answers whatever
      // a backend throws out of `create` as its own `INVALID_PARAMS`, keeping
      // the words and dropping the code, so a code here would be one no client
      // could ever see.
      if (bot === undefined) throw new Error(`There is no bot ${slug}.`);
      // The id the conversation is kept under: the one this chat was resumed
      // by, which is how a chat opens on its own log again.
      return chat(start, bot, start.resume ?? idOf(start.uri), markOf(bot));
    },
  };
}
