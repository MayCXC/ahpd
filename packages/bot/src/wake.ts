import { randomUUID } from 'node:crypto';
import { reason } from '@ahpd/sdk';
import { userOf } from './names.js';
import { isFilledName, TURN_WORD } from './record.js';
import type { Bag, Owner, RecordCollection, SessionRequest } from '@ahpd/sdk';
import type { ChatMessage, TurnHandle } from './chat.js';
import type { BackSessions } from './names.js';
import type { BotRecord } from './record.js';
import type { BotSessions } from './provider.js';
import type { BotStore } from './store.js';

/**
 * What a message said to a bot wakes.
 *
 * A person talks to a bot in its main chat, which is a `bot-chat` session that
 * runs no model (see `chat.ts`), and the work is done by a back session behind
 * it, on the bot's own harness. This is the road between the two: the name the
 * bot's record gives its back session, the session that name is on, the turn or
 * the steer the message becomes in it, and the main turn left open while it is
 * answered.
 *
 * The name is the bot's `session`, which is `work` unless somebody chose
 * another, and it may hold `{turn}`: the turn id of the message takes that
 * word's place, so a bot whose name holds it starts a session per message
 * instead of continuing one. The name is looked up in the `bot-sessions` rows
 * of task 01, and a row whose session this host no longer has - a daemon that
 * restarted - is a back session started again and written over.
 *
 * The message is sent by the plugin's own connection to its host, which is the
 * only door onto `chat/turnStarted`, and whether the back session is idle or
 * working is read off the session's own state. Both are seams rather than calls
 * made from here: this file decides *what* a message becomes, and `plugin.ts`
 * is where the connection that carries it lives, the way the webhook package
 * keeps its own seams beside its route.
 *
 * A message that reached a back session leaves its main turn open until one of
 * two things happens: the session posts an answer with `post_message`, which is
 * `post.ts`, or its turn ends without one and the person is given a notice
 * saying so. Both are said through `answering` - the map from a back session to
 * the turn that woke it - which is also what lets the turn go. A message that
 * never reached a session is the one ending this file makes itself, with a
 * notice naming the cause.
 */

/** One back session's chat, as the host answers it. */
export interface Looked {
  /** The session's own default chat: where a turn, or a steer, is sent. */
  chat: string;
  /** Whether a turn is running in it. A message into a working session steers rather than begins. */
  working: boolean;
}

/** What the wake reads and sends through. */
export interface WakeSeams {
  /** The bots, whose record names the back session. */
  store: BotStore;
  /** The `bot-chats` rows, which say which bot a main chat is with and whose it is. */
  chats: RecordCollection;
  /** The `bot-sessions` rows, which say which session a name is on. */
  backs: BackSessions;
  /** This host's sessions, where a back session is looked for and started. */
  sessions: BotSessions;
  /**
   * One session's chat and whether it is working, or the failure of asking.
   *
   * Throws where the session cannot be read, and the sentence it throws is what
   * the person is told: the reader is the plugin's own connection, so what
   * fails here - a grant it was not given among them - is an operator's to fix
   * and nobody else's to see.
   */
  look(session: string): Promise<Looked>;
  /** Send one action on a chat, and give the host's reason where it refused it, or `undefined` where it took it. */
  send(chat: string, action: Bag): Promise<string | undefined>;
  /** Say what went wrong, for the operator to read. */
  problem(line: string): void;
}

/** The main chat's open turn that one back session is answering. */
export interface Answering {
  /** The session of the main chat, which is the key of the map this is held in. */
  session: string;
  /** The turn in it that stays open until the work is answered. */
  turnId: string;
  /** The handle over that turn: what the answer is said through, and what ends it. */
  handle: TurnHandle;
  /** The bot's name, which the notice a session that finishes without an answer is said in. */
  bot: string;
}

/** What the plugin holds of the wake: the waking itself, and the turns it left open. */
export interface Wake {
  /**
   * Wake the back session this message names, and send the message into it.
   *
   * A message that cannot be sent - a start the host refused, a name no session
   * can have, a session this host does not answer - ends the main turn with a
   * notice naming the cause, because the person is waiting on it and nothing
   * else is coming.
   */
  woken(message: ChatMessage, handle: TurnHandle): Promise<void>;
  /**
   * The main turn one back session is answering, or nothing where none is.
   *
   * By session and never by a name a caller sent: what a back session posts,
   * asks or answers arrives naming its own session, which is the one thing
   * about it a caller cannot choose.
   */
  main(backSession: string): Answering | undefined;
  /**
   * Answer the main turn one back session is answering, and let it go.
   *
   * False where no main turn is waiting on this session - it is not a back
   * session this wake started, or the turn it woke has already ended - so a
   * caller that posted into nothing says so rather than answering a turn twice.
   */
  posted(backSession: string, text: string): boolean;
  /**
   * End the main turn one back session was answering, with a notice, because
   * the session's turn is over and nothing was posted.
   *
   * Nothing where no main turn is waiting on this session, which is a session
   * that posted already and one this wake never woke.
   */
  finished(backSession: string): void;
}

/**
 * The session one bot is started as.
 *
 * The bot's preset, harness and model, in the bot's own folder, owned by the
 * person of the main chat that woke it - a back session works for somebody, and
 * that somebody started the conversation.
 *
 * A preset wins over the harness and the model, because a preset *is* a session
 * whose backend and settings are already decided: naming a model beside it
 * would write over the one it asked for. What decides the owner is the main
 * chat rather than the bot, since a bot owned by a team is chatted with by a
 * person, and the work is charged to them.
 */
export const sessionFor = (bot: BotRecord, owner: Owner): SessionRequest => {
  const provider = bot.preset ?? bot.harness;
  return {
    owner,
    ...(provider === undefined ? {} : { provider }),
    workingDirectory: bot.workspace,
    ...(bot.preset !== undefined || bot.model === undefined ? {} : { model: { id: bot.model } }),
    ...(bot.computer === undefined ? {} : { config: { computer: bot.computer } }),
    title: bot.name,
  };
};

/**
 * The wake over one daemon: its bots, its rows and its own connection.
 *
 * Every case a test cares about is one call of `woken` with the seams it was
 * given, so this takes seams rather than a host: what starts a session, what a
 * name is looked up in and what a message is sent with are all somebody else's,
 * and the wake is what decides the order they happen in.
 */
export function botWake(seams: WakeSeams): Wake {
  /** The main turn each back session is answering, by that session's URI. */
  const answering = new Map<string, Answering>();
  /** The back sessions being started right now, by the name each is started for. */
  const starting = new Map<string, Promise<string>>();

  /** The name this message's back session has: the bot's, with the turn id in place of `{turn}`. */
  const nameFor = (bot: BotRecord, message: ChatMessage): string =>
    bot.session.replaceAll(TURN_WORD, message.turnId.toLowerCase());

  /**
   * The bot a main chat is with, and whose the chat is.
   *
   * The `bot-chats` row is what answers both, and it is found by the session the
   * message was said in rather than by anything the message carries: a message
   * is text a person typed, and only the chat it was typed in says who they are
   * talking to. A chat with no row is a chat this plugin did not open - one a
   * client started by itself - and nothing about it says which bot it is for.
   */
  const chatOf = async (session: string): Promise<{ bot: BotRecord; owner: Owner } | undefined> => {
    await seams.store.ready();
    const row = (await seams.chats.find({ chat: session }))[0];
    if (row === undefined) return undefined;
    const slug = typeof row['bot'] === 'string' ? row['bot'] : '';
    const held = row['owner'];
    const bot = seams.store.get(slug);
    if (bot === undefined || typeof held !== 'string') return undefined;
    return { bot, owner: held as Owner };
  };

  /**
   * The session one name is on.
   *
   * The row first, and then the session it names: a name this host still has a
   * session for is what a person comes back to, and one whose session has gone
   * is started afresh and the row written over. Two messages that arrive
   * together for one name start one session, which is the same guard `chatOf` in
   * the provider keeps over the main chats.
   */
  const sessionNamed = async (bot: BotRecord, owner: Owner, user: string, name: string): Promise<string> => {
    const held = await seams.backs.get(bot.id, user, name);
    if (held !== undefined && await seams.sessions.owner(held) !== undefined) return held;
    const key = `${bot.id}\n${user}\n${name}`;
    const running = starting.get(key);
    if (running !== undefined) return running;
    const begun = seams.sessions.start(sessionFor(bot, owner)).then(async (session) => {
      // Written down before the message is sent, so a back session that is
      // working is one a later message finds rather than one started again.
      await seams.backs.put(bot.id, user, name, session);
      return session;
    });
    starting.set(key, begun);
    // Held only while it is being started, whether it answers or refuses.
    const done = (): void => { if (starting.get(key) === begun) starting.delete(key); };
    begun.then(done, done);
    return begun;
  };

  /** The action that begins a turn in a chat, as a client sends one. */
  const turn = (text: string): Bag => ({ type: 'chat/turnStarted', turnId: randomUUID(), message: { text } });

  /**
   * The action that puts a message into the turn already running.
   *
   * `id` is the sender's own entry rather than the running turn's id, which is
   * what the protocol asks for: a steer is a message the open turn takes, and
   * the client holding it names it. The host hands the id to the backend and
   * the backends that can steer ignore it.
   */
  const steer = (text: string): Bag => ({
    type: 'chat/pendingMessageSet',
    kind: 'steering',
    id: randomUUID(),
    message: { text },
  });

  return {
    main: (backSession) => answering.get(backSession),

    posted: (backSession, text) => {
      const held = answering.get(backSession);
      if (held === undefined) return false;
      /*
       * Let go before the answer is said: ending the turn starts whatever was
       * queued behind it in the main chat, and that message wakes a session
       * which may be this one - a turn left in the map here would be answered
       * by the next message's turn as well.
       */
      answering.delete(backSession);
      held.handle.reply(text);
      return true;
    },

    finished: (backSession) => {
      const held = answering.get(backSession);
      if (held === undefined) return;
      // Let go first, for the reason `posted` says.
      answering.delete(backSession);
      held.handle.notice(`${held.bot} finished without a reply`);
    },

    woken: async (message, handle) => {
      const chat = await chatOf(message.session);
      if (chat === undefined) {
        /*
         * A chat no read of a bot opened, so nothing says which bot the person
         * is talking to. The turn ends here rather than staying open: there is
         * nothing behind this chat to answer it, which is what a chat with no
         * bot was before there was a wake at all.
         */
        seams.problem(`${message.session} is a chat no bot on this host opened`);
        handle.end();
        return;
      }
      const { bot, owner } = chat;
      const name = nameFor(bot, message);
      if (!isFilledName(name)) {
        handle.notice(`${name} is not a name a back session can have: lowercase letters, digits and a dash, at most eighty`);
        return;
      }
      let session: string;
      let looked: Looked;
      try {
        session = await sessionNamed(bot, owner, userOf(owner), name);
        looked = await seams.look(session);
      }
      catch (error) {
        handle.notice(`${bot.name} was not woken: ${reason(error)}`);
        return;
      }
      /*
       * Held before the message is sent, so a back session that answers and
       * ends inside the send still finds the turn that is waiting on it.
       */
      answering.set(session, { session: message.session, turnId: message.turnId, handle, bot: bot.name });
      let refused: string | undefined;
      try {
        refused = await seams.send(looked.chat, looked.working ? steer(message.text) : turn(message.text));
      }
      catch (error) {
        // A send that could not be made at all - the connection's own refusal,
        // rather than the host's answer to the action: the message reached
        // nobody, which the person is owed in the same words.
        refused = reason(error);
      }
      if (refused !== undefined) {
        // Nothing was said, so nothing is coming: the turn ends here rather
        // than waiting for an answer this session never received.
        answering.delete(session);
        handle.notice(`${bot.name} was not woken: ${refused}`);
      }
    },
  };
}
