import { randomUUID } from 'node:crypto';
import { reason } from '@ahpd/sdk';
import { parsed } from './record.js';
import { answer } from './route.js';
import { findThread, threadId } from './thread.js';
import type { RecordCollection } from '@ahpd/sdk';
import type { Endpoint } from './record.js';
import type { Target } from './route.js';
import type { Thread } from './thread.js';

/** How one turn ended, and what the bot said in it. */
export interface TurnEnd {
  status: 'complete' | 'cancelled';
  /** The turn's `markdown` response parts, joined. */
  text: string;
}

/** What the bot target reads and calls, so a test gives each one. */
export interface BotSeams {
  /** The `webhook-threads` collection. */
  threads: RecordCollection;
  /** The session a bot is linked to, or nothing when it has none. */
  session(bot: string): Promise<string | undefined>;
  /** Make a new chat in a session, and give its URI. */
  chat(session: string): Promise<string>;
  /** Send one turn in a chat. */
  send(chat: string, turn: string, text: string): Promise<void>;
  /** Wait for one turn to end. Asked before the turn is sent, so no end is missed. */
  ended(chat: string, turn: string): Promise<TurnEnd>;
  /** POST a JSON body to a callback URL. */
  post(url: string, body: Record<string, unknown>): Promise<void>;
  /** How long a `sync` call waits when its endpoint names no time. */
  syncTimeoutSeconds: number;
  /** Say what went wrong, for the operator to read. */
  problem(line: string): void;
}

/** What one call asks for, read from its body and its query. */
interface Asked {
  thread?: string;
  text?: string;
  callback?: string;
}

/** A non-empty string, or nothing. */
const text = (said: unknown): string | undefined => (typeof said === 'string' && said !== '' ? said : undefined);

/**
 * The thread, text and callback of one call.
 *
 * A JSON object with a string `text` is `{ thread, text, callback }`. Any other
 * body is the text as it came. The query gives `thread` and `callback` where
 * the body does not.
 */
async function asked(request: Request): Promise<Asked> {
  const query = new URL(request.url).searchParams;
  const raw = await request.text();
  let body: Record<string, unknown> | undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)
      && typeof (value as Record<string, unknown>)['text'] === 'string') {
      body = value as Record<string, unknown>;
    }
  }
  catch {
    body = undefined;
  }
  const thread = text(body?.['thread']) ?? text(query.get('thread'));
  const callback = text(body?.['callback']) ?? text(query.get('callback'));
  const said = body === undefined ? text(raw) : text(body['text']);
  return {
    ...(thread === undefined ? {} : { thread }),
    ...(said === undefined ? {} : { text: said }),
    ...(callback === undefined ? {} : { callback }),
  };
}

/**
 * The callback URL a call may use, or the sentence that refuses it.
 *
 * The URL is compared in the form `new URL` gives it, so a URL whose host only
 * begins with the prefix's host does not pass.
 */
function checkCallback(endpoint: Endpoint, callback: string | undefined): { url: string } | { refused: string } {
  if (endpoint.callbackPrefix === undefined) return { refused: 'This endpoint has no callbackPrefix, so it cannot call back.' };
  if (callback === undefined) return { refused: 'The call needs a callback URL.' };
  const url = parsed(callback);
  if (url === undefined || !url.href.startsWith(endpoint.callbackPrefix)) {
    return { refused: 'The callback URL is outside the endpoint callbackPrefix.' };
  }
  return { url: url.href };
}

/**
 * Waits for the end of the turns a webhook sent.
 *
 * `heard` takes every `turn_end` the host raises, and `wait` gives the end of
 * one turn by chat and turn id. A wait is made before its turn is sent.
 */
export function turnEnds() {
  const waiting = new Map<string, (status: TurnEnd['status']) => void>();
  const key = (chat: string, turn: string): string => `${chat}\n${turn}`;
  return {
    heard(event: { chat: string; turn: string; status: TurnEnd['status'] }): void {
      const done = waiting.get(key(event.chat, event.turn));
      if (done === undefined) return;
      waiting.delete(key(event.chat, event.turn));
      done(event.status);
    },
    wait(chat: string, turn: string): Promise<TurnEnd['status']> {
      return new Promise((resolve) => { waiting.set(key(chat, turn), resolve); });
    },
  };
}

/**
 * The target of a bot endpoint.
 *
 * A call's text is a turn in one chat of the bot's session. The chat is the
 * one the call's thread already has, or a new one. The endpoint's `reply`
 * decides what the call is answered with.
 */
export function botTarget(seams: BotSeams): Target {
  /** The last lookup of each thread, so the lookups of one thread run one after another and make one chat. */
  const queued = new Map<string, Promise<Thread>>();

  const lookOrMake = async (endpoint: Endpoint, thread: string, session: string): Promise<Thread> => {
    const kept = await findThread(seams.threads, endpoint.id, thread);
    if (kept !== undefined && kept.session === session) return kept;
    const chat = await seams.chat(session);
    const record: Thread = { id: kept?.id ?? threadId(), endpoint: endpoint.id, thread, session, chat };
    await seams.threads.put({ ...record });
    return record;
  };

  const threadOf = (endpoint: Endpoint, thread: string, session: string): Promise<Thread> => {
    const key = `${endpoint.id}\n${thread}`;
    const before = queued.get(key) ?? Promise.resolve(undefined);
    const next = before.catch(() => undefined).then(() => lookOrMake(endpoint, thread, session));
    queued.set(key, next);
    const forget = (): void => { if (queued.get(key) === next) queued.delete(key); };
    next.then(forget, forget);
    return next;
  };

  return async (endpoint, request) => {
    const call = await asked(request);
    if (call.thread === undefined) return answer(400, { message: 'The call needs a thread id.' });
    if (call.text === undefined) return answer(400, { message: 'The call needs a text.' });

    let callback: string | undefined;
    if (endpoint.reply === 'callback') {
      const checked = checkCallback(endpoint, call.callback);
      if ('refused' in checked) return answer(400, { message: checked.refused });
      callback = checked.url;
    }

    const bot = endpoint.bot ?? '';
    const session = await seams.session(bot);
    if (session === undefined) return answer(409, { message: 'The bot has no session.' });

    const thread = await threadOf(endpoint, call.thread, session);
    const turn = randomUUID();
    const end = seams.ended(thread.chat, turn);
    end.catch((error: unknown) => { seams.problem(`webhooks/${endpoint.id} lost the end of turn ${turn}: ${reason(error)}`); });
    await seams.send(thread.chat, turn, call.text);
    const said = { thread: call.thread, turn };

    if (endpoint.reply === 'sync') {
      const seconds = endpoint.syncTimeoutSeconds ?? seams.syncTimeoutSeconds;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<undefined>((resolve) => { timer = setTimeout(() => { resolve(undefined); }, seconds * 1000); });
      const done = await Promise.race([end, late]);
      clearTimeout(timer);
      if (done === undefined) return answer(202, { ...said, status: 'running' });
      return answer(200, { ...said, status: done.status, text: done.text });
    }

    if (callback !== undefined) {
      const url = callback;
      end.then(async (done) => {
        try {
          await seams.post(url, { ...said, status: done.status, text: done.text });
        }
        catch (error) {
          seams.problem(`webhooks/${endpoint.id} could not call back ${url}: ${reason(error)}`);
        }
      }, () => undefined);
    }
    return answer(202, said);
  };
}
