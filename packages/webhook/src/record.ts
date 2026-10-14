/**
 * One webhook endpoint, as the `webhooks` collection holds it.
 *
 * An endpoint is a file a person writes by hand, so every field is checked
 * when the record is read. The `id` is the last segment of the URL a caller
 * posts to, and the `secret` names the vault secret that the caller sends as
 * its bearer token.
 */

/** What the plugin answers a caller of a bot endpoint. */
export const REPLIES = ['callback', 'sync', 'none'] as const;

export type Reply = (typeof REPLIES)[number];

/** One endpoint, checked. */
export interface Endpoint {
  /** The record's slug, and the last segment of the endpoint's URL. */
  id: string;
  /** The bot a call talks to, as `bot://<slug>`. Absent on an automation endpoint. */
  bot?: string;
  /** `true` on an endpoint whose calls fire the `webhook` trigger. Absent on a bot endpoint. */
  automation?: true;
  /** The name of the vault secret that a caller sends as `Authorization: Bearer <value>`. */
  secret: string;
  /** How a call to a bot is answered. */
  reply: Reply;
  /** What every callback URL a caller names must start with: an `http` or `https` URL whose path ends in `/`. */
  callbackPrefix?: string;
  /** How long a `sync` call waits for its turn to end, over the plugin's option. */
  syncTimeoutSeconds?: number;
}

/** A bot URI, with the slug rule of the bot plugin. */
const BOT_URI = /^bot:\/\/[a-z][a-z0-9-]{0,39}$/;

/**
 * The endpoint a record describes, or an error that says what is wrong.
 *
 * The error message is one sentence about the record, for the plugin's problem
 * line.
 */
export function checkEndpoint(said: unknown): Endpoint {
  if (typeof said !== 'object' || said === null || Array.isArray(said)) {
    throw new Error('An endpoint is a record of fields.');
  }
  const record = said as Record<string, unknown>;
  const id = record['id'];
  if (typeof id !== 'string' || id === '') throw new Error('An endpoint needs an id.');

  const bot = record['bot'];
  const automation = record['automation'];
  if (bot !== undefined && automation !== undefined) {
    throw new Error('An endpoint names a bot or an automation, not both.');
  }
  if (bot === undefined && automation === undefined) {
    throw new Error('An endpoint names a bot or automation: true.');
  }
  if (bot !== undefined && (typeof bot !== 'string' || !BOT_URI.test(bot))) {
    throw new Error('The bot field is a URI such as bot://motion.');
  }
  if (automation !== undefined && automation !== true) {
    throw new Error('The automation field is true or absent.');
  }

  const secret = record['secret'];
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('An endpoint names the vault secret that its caller sends.');
  }

  const reply = record['reply'] ?? 'callback';
  if (typeof reply !== 'string' || !(REPLIES as readonly string[]).includes(reply)) {
    throw new Error('The reply field is callback, sync or none.');
  }

  const prefix = record['callbackPrefix'];
  let callbackPrefix: string | undefined;
  if (prefix !== undefined) {
    const url = typeof prefix === 'string' ? parsed(prefix) : undefined;
    if (url === undefined || (url.protocol !== 'http:' && url.protocol !== 'https:') || !url.pathname.endsWith('/')) {
      throw new Error('The callbackPrefix field is an http or https URL whose path ends in /.');
    }
    callbackPrefix = url.href;
  }

  const timeout = record['syncTimeoutSeconds'];
  if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0)) {
    throw new Error('The syncTimeoutSeconds field is a positive number.');
  }

  return {
    id,
    ...(bot === undefined ? {} : { bot: bot as string }),
    ...(automation === undefined ? {} : { automation: true as const }),
    secret: secret.trim(),
    reply: reply as Reply,
    ...(callbackPrefix === undefined ? {} : { callbackPrefix }),
    ...(timeout === undefined ? {} : { syncTimeoutSeconds: timeout as number }),
  };
}

/** A URL, or nothing when the text is not one. */
export const parsed = (text: string): URL | undefined => {
  try {
    return new URL(text);
  }
  catch {
    return undefined;
  }
};
