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
 * No model runs here either, but something answers: a turn this chat begins
 * stays open until whoever started the chat ends it, through the handle
 * `turns` answers with. The answer is the bot's own - a markdown part when its
 * session posts one, a notice when there is nothing to say, and a cancelled
 * turn when somebody stops it - and until then the turn is the chat's
 * `activeTurn`. A chat nobody is listening to is a chat with no bot behind it,
 * and its turn ends the moment it begins, which is what this backend did before
 * there was a handle.
 *
 * One turn at a time, then. A message that arrives while a turn is open waits
 * behind it, in this chat's own queue, and becomes the next turn when that one
 * ends.
 *
 * What this backend is for is the *log*: one JSON line per moment under
 * `<configDir>/bot-chats/` - a line when a turn begins, a line when it ends
 * with its response, and a line for each message steered into an open turn.
 * Nothing about a chat is kept in memory past the process that made it, so
 * `list`, `find` and `transcript` read the folder and there is no index that
 * could fall out of step with it.
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

/** How a turn can end, in the protocol's spelling. */
type Ending = ChatTurn['state'];

/**
 * One turn a chat has open, before it is a turn at all.
 *
 * `ActiveTurn` in the protocol's spelling, and without the two fields a turn
 * has only once it has ended: a state and a duration. Being open is exactly the
 * absence of those.
 */
interface OpenTurn {
  id: string;
  startedAt: string;
  message: ChatTurn['message'];
  responseParts: Bag[];
}

/**
 * One message waiting for the turn in front of it.
 *
 * What a client queued, and what a `begin` found a turn already running: the
 * same thing either way, because both are a message that has to wait and the
 * only difference between them is who chose the id - and a turn id is chosen
 * for a queued message when it is held rather than when it starts.
 */
interface Waiting {
  /** The turn it becomes, fixed when it was held. */
  turnId: string;
  /** The entry a client holds it in its queue as, which is the turn id a `begin` named. */
  id: string;
  text: string;
  /** Who said it, where anybody was named. */
  from: MessageFrom | undefined;
}

/**
 * One message in a chat: what was said, and the turn it belongs to.
 *
 * What the handle's `onMessage` is told. A turn this chat begins and a message
 * steered into the open one are told the same way, because the difference is
 * not in the telling: whoever answers is told what somebody said, and answers
 * the turn either way.
 */
export interface ChatMessage {
  /** The URI of the session the chat is in. */
  session: string;
  /** The turn that began, or the open turn the message was steered into. */
  turnId: string;
  /** What was said. */
  text: string;
}

/**
 * The handle over one chat's open turn: what ends it, and what hears about it.
 *
 * Held by whoever started the chat, which is the plugin: nothing in this
 * package knows what a bot's answer is, and nothing here would ever end a turn
 * by itself. `reply` is that answer, `notice` is something that happened
 * instead of one, and `end` is a turn that gets neither - each ends the turn it
 * finds open, and does nothing at all when there is none.
 *
 * `onMessage` is the other direction: each turn this chat begins, and each
 * message steered into the open one, is handed to it. That is how what a person
 * says to a bot reaches the session that does the work.
 */
export interface TurnHandle {
  /** End the open turn with this as its answer. */
  reply(text: string): void;
  /** End the open turn with a notice rather than an answer. */
  notice(text: string): void;
  /** End the open turn with no response at all. */
  end(): void;
  /** Who hears about each turn that begins and each message steered into one. */
  onMessage?: (message: ChatMessage) => void;
}

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
 * The ending a line's `state` names, or `complete` where it names none.
 *
 * A line a turn *began* with carries no state, and neither does one a person
 * wrote by hand. A state is what an ending is, so anything that is not one of
 * the endings reads back as a turn that finished - which is what such a turn
 * is, as far as a chat that answers again after a restart can say.
 */
const endingIn = (said: unknown): Ending => (
  said === 'cancelled' || said === 'error' ? said : 'complete'
);

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
    state: endingIn(said['state']),
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
 *
 * A turn is two lines - the one it began with and the one it ended with - and
 * what comes back is one turn: the line an ending was written on replaces the
 * line the turn opened on, because it is the same turn said again, as it
 * finished. A chat whose daemon died mid-turn has only the first of the two,
 * and that reads as the turn it was.
 */
const logAt = (path: string): { turns: ChatTurn[]; mark: Bag | undefined } | undefined => {
  let text: string;
  try { text = readFileSync(path, 'utf8'); }
  catch { return undefined; }
  const turns: ChatTurn[] = [];
  /** Where each turn read so far sits, so the line that ends it can replace it. */
  const at = new Map<string, number>();
  let mark: Bag | undefined;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    let said: unknown;
    // A line nobody can read is left out, as a bot the store cannot read is.
    try { said = JSON.parse(line); }
    catch { continue; }
    if (typeof said !== 'object' || said === null || Array.isArray(said)) continue;
    const held = said as Bag;
    /*
     * What somebody said into a turn that was already running.
     *
     * Kept, as everything said in a chat is, and not a turn: a steering message
     * is consumed by the turn it steers, and the protocol has no place on a
     * finished turn for a second message. It is still a line of this chat's, so
     * it says which bot the chat is for like any other.
     */
    if (held['steering'] === true) {
      mark ??= markIn(held);
      continue;
    }
    const one = turnOf(held);
    if (one === undefined) continue;
    mark ??= markIn(held);
    const known = at.get(one.id);
    if (known === undefined) {
      at.set(one.id, turns.length);
      turns.push(one);
    }
    else turns[known] = one;
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
 * The handles of the chats this process has open, by the URI of their session.
 *
 * A chat is started by the host, which answers with a session URI and nothing
 * else - a `Session` never leaves this package - so a URI is all the plugin
 * that started a chat has to reach the turn in it by. The URI is the one the
 * *host* made for the session, which is the one a backend is started with:
 * a client names an id and the host names the scheme, so the URI a client
 * sent is an alias of this one and not this one.
 */
const handles = new Map<string, TurnHandle>();

/**
 * The handle over one chat's open turn, by the URI of the session it is in.
 *
 * Throws for a session that is not a chat of this provider's: a URI nothing
 * here answers to names something else, which is a different thing from a chat
 * with no turn open in it.
 */
export function turns(session: string): TurnHandle {
  const held = handles.get(session);
  if (held === undefined) throw new Error(`${session} is not a chat this host is running`);
  return held;
}

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
    /**
     * The turn this chat has open, until the handle ends it.
     *
     * Not in `turns`: a turn is one of those once it has ended, and what a
     * client reading the chat is told about while it runs is `activeTurn`. A
     * chat starts with none open, even one whose log has a line a turn began
     * with and none it ended with - nothing here knows who was going to answer
     * it, and the plugin that started the chat is where that is known.
     */
    let open: OpenTurn | undefined;
    /**
     * Messages waiting for the open turn to end, in the order they will start.
     *
     * The queue is the session's rather than a client's, because nothing in a
     * client watches for a turn to end: a message held there would be one
     * nothing could ever send. A chat that is closed with messages still in it
     * loses them, as a backend gone between two turns loses everything it was
     * holding.
     */
    const waiting: Waiting[] = [];

    const touch = (): void => { modified = new Date().toISOString(); };

    /**
     * End the open turn, and keep the turn it was.
     *
     * The state and the duration are written down here rather than at the
     * beginning, which is the whole difference between a turn that is open and
     * one that is over. The line goes down before the turn is announced, as the
     * line it began with did: a turn a client watched end is a turn a restart
     * can read back.
     */
    const finish = (held: OpenTurn, state: Ending, parts: Bag[]): void => {
      open = undefined;
      const duration = Date.now() - Date.parse(held.startedAt);
      const turn: ChatTurn = {
        id: held.id,
        startedAt: held.startedAt,
        duration,
        message: held.message,
        responseParts: parts,
        state,
        usage: undefined,
      };
      // The same turn said again, as it ended: one turn, two lines, and the
      // second of them is the one a reader takes.
      append(dir, id, { ...turn, _meta: mark });
      turns.push(turn);
      touch();
      // Whatever it answered with, before the turn is said to be over: a part
      // that arrived after the end is a part of a turn nobody is holding.
      for (const part of parts) start.emit('chat', { type: 'chat/responsePart', turnId: held.id, part });
      start.emit('chat', state === 'cancelled'
        ? { type: 'chat/turnCancelled', turnId: held.id, duration }
        : { type: 'chat/turnComplete', turnId: held.id, duration });
      // Whatever was waiting behind it, now that there is nothing in front of
      // it. After the turn is said to be over, so a client reads one ending and
      // then the next beginning rather than the other way round.
      startNext();
    };

    /**
     * The handle over this chat's open turn, which the plugin that started the
     * chat holds.
     *
     * A method here that finds no open turn does nothing: the turn it was meant
     * to answer has ended, and a second ending would be a second turn.
     */
    const handle: TurnHandle = {
      reply: (text) => {
        const held = open;
        if (held === undefined) return;
        /*
         * One part, whole. Nothing streams into a chat that runs no model, so
         * there are no `chat/delta`s after it - and the id is the turn's, which
         * is what a delta would have appended to.
         */
        finish(held, 'complete', [{ id: `${held.id}:reply`, kind: 'markdown', content: text }]);
      },
      notice: (text) => {
        const held = open;
        if (held === undefined) return;
        // No id: `SystemNotificationResponsePart` has none, which is what the
        // reference harness writes for a notice of its own.
        finish(held, 'complete', [{ kind: 'systemNotification', content: text }]);
      },
      end: () => {
        const held = open;
        if (held === undefined) return;
        finish(held, 'complete', []);
      },
    };
    handles.set(start.uri, handle);

    /**
     * Say one turn, and keep the beginning of it.
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
      const held: OpenTurn = { id: turnId, startedAt, message, responseParts: [] };
      open = held;
      // No state and no duration: this is the turn as it began, and the line
      // that ends it is the one that says how it went.
      append(dir, id, { id: turnId, startedAt, message, responseParts: [], _meta: mark });
      touch();
      start.emit('chat', {
        type: 'chat/turnStarted',
        turnId,
        startedAt,
        message,
        ...(queuedMessageId === undefined ? {} : { queuedMessageId }),
      });
      /*
       * The turn is open before anybody is told about it, because what is told
       * is what answers it - and it is over at once when nobody is. That is a
       * chat with no bot behind it: one a person opened to read, or one this
       * host has just restarted and not answered again.
       */
      if (handle.onMessage === undefined) finish(held, 'complete', []);
      else handle.onMessage({ session: start.uri, turnId, text });
    };

    /**
     * Hold one message for the turn in front of it.
     *
     * Announced first, because a client draws the queue it was put in, and held
     * under the entry's own id: the same id twice edits what is waiting rather
     * than adding a second message behind the first.
     */
    const enqueue = (entry: Waiting): void => {
      const at = waiting.findIndex((held) => held.id === entry.id);
      if (at < 0) waiting.push(entry);
      else waiting[at] = entry;
      start.emit('chat', {
        type: 'chat/pendingMessageSet',
        kind: 'queued',
        id: entry.id,
        message: messageOf(entry.text, entry.from),
      });
      touch();
    };

    /**
     * Whatever was waiting, once the turn in front of it is done.
     *
     * The entry leaves the client's queue with the turn, two ways: the turn
     * names the entry it was, which is the word a client's reducer takes it out
     * on, and the entry is removed outright - because a client holding an entry
     * the turn does not name has nothing else to take it out with.
     */
    const startNext = (): void => {
      if (open !== undefined) return;
      const next = waiting.shift();
      if (next === undefined) return;
      start.emit('chat', { type: 'chat/pendingMessageRemoved', kind: 'queued', id: next.id });
      beginTurn(next.turnId, next.text, next.from, next.id);
    };

    return {
      uri: start.uri,
      chatUri: start.chatUri,

      // No model runs here, and there is nothing of this backend's own to show
      // beside the host's. Empty lists are real answers.
      models: () => [],
      agentId: () => id,
      customizations: () => start.seedCustomizations ?? [],

      // The turns that are over. One still open is not here: it is what
      // `chatState().activeTurn` is for, as it is for every other backend.
      allTurns: () => turns,
      /*
       * `SessionStatus`: an open turn is `InProgress`, because the chat is
       * waiting - on the bot's session, which is where the answer is being
       * worked out. Nothing is being waited *for* from the person, so it is not
       * `InputNeeded`.
       */
      status: () => (open === undefined ? Status.Idle : Status.InProgress),
      activity: () => undefined,
      title: () => bot.name,
      modifiedAt: () => modified,
      workingDirectories: () => [uriOf(bot.workspace)],

      sessionState: () => ({
        // No `resource`: it is declared on `SessionSummary` and not on
        // `SessionState`, and a client subscribed to this channel named it.
        provider: CHAT_PROVIDER,
        title: bot.name,
        status: open === undefined ? Status.Idle : Status.InProgress,
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
        status: open === undefined ? Status.Idle : Status.InProgress,
        modifiedAt: modified,
        turns,
        // What is waiting for the open turn to end, in the order it will start.
        // Read here rather than left to the client's own queue, so a client
        // that opens this chat while a message waits is told about it.
        queuedMessages: waiting.map((held) => ({ id: held.id, message: messageOf(held.text, held.from) })),
        // The turn that is running, in the protocol's own spelling for one:
        // no state and no duration, because it has neither until it ends. The
        // parts array is the live one, so a client that reads the state while
        // an answer is being written sees what is in it.
        ...(open === undefined ? {} : {
          activeTurn: {
            id: open.id,
            startedAt: open.startedAt,
            message: open.message,
            responseParts: open.responseParts,
            usage: undefined,
          },
        }),
        ...(draft === undefined ? {} : { draft }),
        _meta: mark,
      }),

      /**
       * The client says a turn has begun; making it true - and writing it down -
       * is this method.
       *
       * Except while one is already open: a chat runs one turn at a time, and
       * the second message is one that has to wait rather than one that takes
       * the open turn's place. The host refuses such a message before it
       * reaches here, so this is the guard behind that refusal rather than the
       * one a client meets - and it is the difference between a lost turn and a
       * queued one if the two ever disagree.
       */
      begin: (turnId, text, _model, from) => {
        if (open === undefined) {
          beginTurn(turnId, text, from);
          return;
        }
        enqueue({ turnId, id: turnId, text, from });
      },

      /**
       * A message a client held for later.
       *
       * Said at once when nothing is running, and otherwise held until the turn
       * in front of it ends. Its turn id is chosen here rather than when it
       * starts, so that the turn it becomes is the same one either way.
       */
      queue: (id, text, _model, from) => {
        enqueue({ turnId: crypto.randomUUID(), id, text, from });
        startNext();
      },

      /** Take one back, while it is still waiting. */
      unqueue: (id) => {
        const at = waiting.findIndex((held) => held.id === id);
        if (at < 0) return;
        waiting.splice(at, 1);
        start.emit('chat', { type: 'chat/pendingMessageRemoved', kind: 'queued', id });
        touch();
      },

      /** Reorder what is waiting. Anything the order does not name keeps its place behind what it does. */
      reorder: (order) => {
        const byId = new Map(waiting.map((held) => [held.id, held]));
        const named = new Set<string>();
        const moved: Waiting[] = [];
        for (const id of order) {
          const held = byId.get(id);
          if (held === undefined || named.has(id)) continue;
          named.add(id);
          moved.push(held);
        }
        for (const held of waiting) if (!named.has(held.id)) moved.push(held);
        waiting.length = 0;
        waiting.push(...moved);
        start.emit('chat', { type: 'chat/queuedMessagesReordered', order: moved.map((held) => held.id) });
        touch();
      },

      /**
       * A message put into the turn that is already running.
       *
       * Nothing here can take one: a correction halfway is read by a model, and
       * this chat runs none. What it does instead is hand the message on to
       * whoever answers the chat - which is the session doing the work, and it
       * is told mid-turn the same way a harness with steering would be - and
       * keep it, because what was said into a turn was said in this chat.
       *
       * The id the host names is the client's own entry, which is not one of
       * this chat's queue: a steer is a message the open turn takes rather than
       * one waiting for it, so the line is written against the turn it went
       * into, which is the one thing a later reader asks about.
       *
       * False where there is no open turn to put it in, which is a message the
       * host refuses rather than one it quietly turns into a turn of its own.
       */
      steer: (_pendingId, text) => {
        const held = open;
        if (held === undefined) return false;
        append(dir, id, { id: held.id, steering: true, message: messageOf(text), _meta: mark });
        touch();
        handle.onMessage?.({ session: start.uri, turnId: held.id, text });
        return true;
      },

      /**
       * Stop the turn that is running.
       *
       * There is nothing here to stop - the work is the bot's session, and
       * whether that hears the stop is the plugin's business - so the turn is
       * ended as a cancelled one, and a client watching the chat is told
       * exactly that. A stop that names neither the open turn nor nothing at
       * all is a stop for a turn this chat is not running, which is not one.
       */
      cancel: (turnId) => {
        const held = open;
        if (held === undefined) return;
        if (turnId !== '' && turnId !== held.id) return;
        finish(held, 'cancelled', []);
      },

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

      /*
       * Nothing runs between turns: no process to stop and no timer to clear.
       * What there is to let go of is the handle, which is nobody's once this
       * chat is one this host no longer runs - and a chat started again, under
       * the same URI, registers a handle of its own.
       */
      close: () => {
        if (handles.get(start.uri) === handle) handles.delete(start.uri);
      },
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
