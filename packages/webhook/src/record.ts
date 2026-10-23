/**
 * One webhook endpoint, as a `webhook` connector describes it.
 *
 * A person makes an endpoint from a client, and every field is checked again
 * when the connector is opened. The `id` is the connector's id and the last
 * segment of the URL a caller posts to, and the `secret` is the value that the
 * caller sends as its bearer token, kept in the vault under the owner.
 */

import type { ConnectorOwner } from '@ahpd/sdk';

/** What the plugin answers a caller of a bot endpoint. */
export const REPLIES = ['callback', 'sync', 'none'] as const;

/** The ways a caller can prove itself, named by the sender's own method where one sender owns it. */
export const AUTH_SCHEMES = ['bearer', 'header', 'query', 'hmac', 'github', 'stripe', 'slack', 'standard', 'meta', 'graph'] as const;

export type AuthScheme = (typeof AUTH_SCHEMES)[number];

/** The hashes a generic hmac may use. */
export const ALGORITHMS = ['sha256', 'sha1', 'sha512'] as const;

/** How a generic hmac value is written. */
export const ENCODINGS = ['hex', 'base64'] as const;

export type Algorithm = (typeof ALGORITHMS)[number];

export type Encoding = (typeof ENCODINGS)[number];

export type Reply = (typeof REPLIES)[number];

/** One endpoint, checked. */
export interface Endpoint {
  /** The connector's slug, and the last segment of the endpoint's URL. */
  id: string;
  /** The bot a call talks to, as `bot://<slug>`. Absent on an endpoint with no bot. */
  bot?: string;
  /** The automation a call starts, by id. Absent on an endpoint that starts none. */
  automation?: string;
  /** The value a caller sends as `Authorization: Bearer <value>`, held in the vault. */
  secret: string;
  /** How a caller proves itself. Absent on a record written before schemes, which takes a bearer. */
  auth?: AuthScheme;
  /** The header the proof is in, for the `header` and `hmac` schemes. */
  header?: string;
  /** The hash a generic hmac uses. Required for `hmac`. */
  algorithm?: Algorithm;
  /** How a generic hmac value is written. Required for `hmac`. */
  encoding?: Encoding;
  /** Text before a generic hmac value, such as `sha256=`. */
  prefix?: string;
  /** The token Meta must send as `hub.verify_token` when it checks the URL. Required for `meta`. */
  verifyToken?: string;
  /** How a call to a bot is answered. Absent on an endpoint with no bot. */
  reply?: Reply;
  /** What every callback URL a caller names must start with: an `http` or `https` URL whose path ends in `/`. */
  callbackPrefix?: string;
  /** How long a `sync` call waits for its turn to end, over the plugin's option. */
  syncTimeoutSeconds?: number;
  /** Which calls this connector takes: a dotted path of the event data, each to the values it accepts. */
  match?: Record<string, string | string[]>;
  /** Whose connector this is, as the host hands it to `open`. Absent on a record written by hand. */
  owner?: ConnectorOwner;
}

/** A bot URI, with the slug rule of the bot plugin. */
const BOT_URI = /^bot:\/\/[a-z][a-z0-9-]{0,39}$/;

/**
 * The endpoint a connector's config describes, or an error that says what is
 * wrong.
 *
 * The error message is one sentence about the config, for the line the host
 * reports when the connector cannot be opened.
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
  if (bot !== undefined && (typeof bot !== 'string' || !BOT_URI.test(bot))) {
    throw new Error('The bot field is a URI such as bot://motion.');
  }
  if (automation !== undefined && (typeof automation !== 'string' || automation.trim() === '')) {
    throw new Error('The automation field is the id of the automation a call starts.');
  }
  /*
   * The reply fields belong to an endpoint that names a bot: a connector with
   * no bot can never use them, so it is refused when it is saved rather than
   * when a call arrives.
   */
  if (bot === undefined) {
    for (const field of ['reply', 'callbackPrefix', 'syncTimeoutSeconds'] as const) {
      if (record[field] !== undefined) {
        throw new Error(`An endpoint with no bot names no ${field}.`);
      }
    }
  }

  const secret = record['secret'];
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('An endpoint names the secret that its caller sends.');
  }

  const auth = record['auth'];
  if (auth !== undefined && (typeof auth !== 'string' || !(AUTH_SCHEMES as readonly string[]).includes(auth))) {
    throw new Error('The auth field is bearer, header, query, hmac, github, stripe, slack, standard, meta or graph.');
  }
  const scheme = (auth ?? 'bearer') as AuthScheme;

  const header = record['header'];
  if (header !== undefined && (typeof header !== 'string' || header.trim() === '')) {
    throw new Error('The header field names the header the proof is in.');
  }
  if ((scheme === 'header' || scheme === 'hmac') && header === undefined) {
    throw new Error('The header and hmac schemes name the header the proof is in.');
  }

  const algorithm = record['algorithm'];
  if (algorithm !== undefined && (typeof algorithm !== 'string' || !(ALGORITHMS as readonly string[]).includes(algorithm))) {
    throw new Error('The algorithm field is sha256, sha1 or sha512.');
  }
  const encoding = record['encoding'];
  if (encoding !== undefined && (typeof encoding !== 'string' || !(ENCODINGS as readonly string[]).includes(encoding))) {
    throw new Error('The encoding field is hex or base64.');
  }
  if (scheme === 'hmac' && (algorithm === undefined || encoding === undefined)) {
    throw new Error('The hmac scheme names its algorithm and its encoding.');
  }

  const authPrefix = record['prefix'];
  if (authPrefix !== undefined && typeof authPrefix !== 'string') {
    throw new Error('The prefix field is text before the hmac value.');
  }

  const verifyToken = record['verifyToken'];
  if (verifyToken !== undefined && (typeof verifyToken !== 'string' || verifyToken.trim() === '')) {
    throw new Error('The verifyToken field is the token Meta sends in its URL check.');
  }
  if (scheme === 'meta' && verifyToken === undefined) {
    throw new Error('The meta scheme names the verifyToken its URL check must send.');
  }

  const reply = record['reply'] ?? 'none';
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
  if (reply === 'callback' && callbackPrefix === undefined) {
    throw new Error('The callback reply names the callbackPrefix its callbacks are under.');
  }

  const timeout = record['syncTimeoutSeconds'];
  if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0)) {
    throw new Error('The syncTimeoutSeconds field is a positive number.');
  }

  const match = record['match'];
  let wanted: Record<string, string | string[]> | undefined;
  if (match !== undefined) {
    if (typeof match !== 'object' || match === null || Array.isArray(match)) {
      throw new Error('The match field is a record of paths to the values they take.');
    }
    wanted = {};
    for (const [path, value] of Object.entries(match as Record<string, unknown>)) {
      if (path.trim() === '') throw new Error('A match path is a dotted field name such as headers.x-github-event.');
      if (typeof value === 'string') {
        wanted[path] = value;
        continue;
      }
      if (!Array.isArray(value) || !value.every((one) => typeof one === 'string')) {
        throw new Error(`The match path ${path} is a string or a list of strings.`);
      }
      wanted[path] = value as string[];
    }
  }

  return {
    id,
    ...(bot === undefined ? {} : { bot: bot as string }),
    ...(automation === undefined ? {} : { automation: automation as string }),
    secret: secret.trim(),
    ...(auth === undefined ? {} : { auth: scheme }),
    ...(header === undefined ? {} : { header: header as string }),
    ...(algorithm === undefined ? {} : { algorithm: algorithm as Algorithm }),
    ...(encoding === undefined ? {} : { encoding: encoding as Encoding }),
    ...(authPrefix === undefined ? {} : { prefix: authPrefix }),
    ...(verifyToken === undefined ? {} : { verifyToken: (verifyToken as string).trim() }),
    ...(bot === undefined ? {} : { reply: reply as Reply }),
    ...(callbackPrefix === undefined ? {} : { callbackPrefix }),
    ...(timeout === undefined ? {} : { syncTimeoutSeconds: timeout as number }),
    ...(wanted === undefined ? {} : { match: wanted }),
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
