import { ALGORITHMS, AUTH_SCHEMES, checkEndpoint, ENCODINGS, REPLIES } from './record.js';
import type { Endpoint } from './record.js';
import type { Adapter, Capability, Connector } from '@ahpd/sdk';

/**
 * The `webhook` adapter.
 *
 * A connector of this adapter is one endpoint: a bot, an automation, or the
 * `webhook` trigger, the calls it takes, the reply a call gets, and the secret
 * its caller sends. The schema is what a client draws the form from, and
 * `open` is where the plugin starts answering for a connector that was made or
 * was stored when the daemon started.
 *
 * `secret` and `verifyToken` are the fields a schema marks `writeOnly`, so the
 * host keeps their values in the vault and the connector's record holds a
 * reference to them. Every other field is the endpoint's own and stays in the
 * record.
 */

/** The adapter's name, which is the `adapter` every endpoint's record carries. */
export const ADAPTER = 'webhook';

/**
 * The fields of a webhook endpoint, as a client draws them.
 *
 * A connector talks to a bot, starts the automation it names, or - with
 * neither - fires the `webhook` trigger for every automation watching it.
 * `match` selects the calls that reach whichever target it has.
 */
const FIELDS: Record<string, Record<string, unknown>> = {
  bot: {
    type: 'string',
    pattern: '^bot://[a-z][a-z0-9-]{0,39}$',
    title: 'Bot',
    description: 'The bot a call talks to, as bot://<name>.',
  },
  automation: {
    type: 'string',
    title: 'Automation',
    description: 'The id of the automation a call starts. Leave it and Bot empty to fire the webhook trigger.',
    'x-ahpd-automation': true,
  },
  match: {
    type: 'object',
    title: 'Match',
    description: 'The calls this connector takes: a dotted path of the event data, each to a value or a list of values.',
    additionalProperties: {
      anyOf: [
        { type: 'string' },
        { type: 'array', items: { type: 'string' } },
      ],
    },
  },
  secret: {
    type: 'string',
    writeOnly: true,
    title: 'Secret',
    description: 'The value a caller proves itself with. It is kept in the vault, never in the connector.',
  },
  verifyToken: {
    type: 'string',
    writeOnly: true,
    title: 'Verify token',
    description: 'The token Meta sends as hub.verify_token when it checks the URL. Required for the meta scheme.',
  },
  auth: {
    type: 'string',
    enum: [...AUTH_SCHEMES],
    default: 'bearer',
    title: 'Auth',
    description: 'How a caller proves itself: a bearer token, one sender\'s own scheme, or a generic hmac.',
  },
  header: {
    type: 'string',
    title: 'Header',
    description: 'The header the proof is in, for header and hmac. GitLab sends X-Gitlab-Token.',
  },
  algorithm: {
    type: 'string',
    enum: [...ALGORITHMS],
    title: 'Algorithm',
    description: 'The hash an hmac uses.',
  },
  encoding: {
    type: 'string',
    enum: [...ENCODINGS],
    title: 'Encoding',
    description: 'How an hmac value is written: hex, or base64 as Shopify writes it.',
  },
  prefix: {
    type: 'string',
    title: 'Prefix',
    description: 'Text before an hmac value, such as sha256=.',
  },
  reply: {
    type: 'string',
    enum: [...REPLIES],
    default: 'none',
    title: 'Reply',
    description: 'How a call to a bot is answered: callback, sync or none.',
  },
  callbackPrefix: {
    type: 'string',
    title: 'Callback prefix',
    description: 'What every callback URL a caller names starts with: an http or https URL whose path ends in /.',
  },
  syncTimeoutSeconds: {
    type: 'number',
    exclusiveMinimum: 0,
    title: 'Sync timeout',
    description: 'How long a sync call waits for its turn to end, in seconds.',
  },
};

/**
 * The fields every alternative has: the secret, the proof and the filter.
 *
 * `secret`, `verifyToken` and the auth fields stay in the top-level
 * `properties` because that is where the host reads the `writeOnly` fields
 * from. `automation` stays there too, beside `x-ahpd-automation`, which the
 * host reads from the same place.
 */
const SHARED = ['secret', 'verifyToken', 'auth', 'header', 'algorithm', 'encoding', 'prefix', 'match'] as const;

/** The fields only a connector with a bot has. */
const BOT_FIELDS = ['bot', 'reply', 'callbackPrefix', 'syncTimeoutSeconds'] as const;

/** The reply a bot takes when it does not ask for a callback. */
const ASIDE_REPLY: Record<string, unknown> = {
  type: 'string',
  enum: ['sync', 'none'],
  default: 'none',
  title: 'Reply',
  description: 'How a call to a bot is answered: callback, sync or none.',
};

/** The reply whose callbacks need a prefix, and no other. */
const CALLBACK_REPLY: Record<string, unknown> = {
  type: 'string',
  enum: ['callback'],
  title: 'Reply',
  description: 'How a call to a bot is answered: callback, sync or none.',
};

/** One alternative of the form: the fields it has, the ones it requires, and no other. */
const alternative = (
  fields: readonly string[],
  required: readonly string[],
  over: Record<string, Record<string, unknown>> = {},
): Record<string, unknown> => ({
  type: 'object',
  properties: Object.fromEntries(fields.map((field) => [field, over[field] ?? FIELDS[field]])),
  required: [...required],
  additionalProperties: false,
});

/** A bot with the callback reply, which has no meaning without its prefix. */
const CALLBACK = alternative([...SHARED, ...BOT_FIELDS], ['secret', 'bot', 'reply', 'callbackPrefix'], { reply: CALLBACK_REPLY });

/** A bot that answers with its turn, or at once. */
const BOT = alternative([...SHARED, ...BOT_FIELDS], ['secret', 'bot'], { reply: ASIDE_REPLY });

/** No bot: an automation, or the trigger, and none of the bot's fields. */
const PLAIN = alternative([...SHARED, 'automation'], ['secret']);

/**
 * The form a person fills in to make an endpoint.
 *
 * The fields are at the top level, because that is where the host reads the
 * `writeOnly` ones and the `x-ahpd-automation` one from. Which fields a
 * connector may have is in `oneOf`: the bot fields only with a bot, the
 * automation only without one, and the callback reply only with a prefix.
 */
export const SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: FIELDS,
  oneOf: [CALLBACK, BOT, PLAIN],
  title: 'Webhook endpoint',
  description: 'A URL that talks to a bot, starts an automation, or fires the webhook trigger, with a secret a caller sends.',
};

/** What a connector of this adapter does, as a client lists it. */
export const CAPABILITIES: Capability[] = [{
  type: 'receive',
  name: 'calls',
  title: 'Receives calls',
  description: 'Receives the calls a sender makes to the connector\'s URL.',
  path: '/plugins/webhook/{id}',
}];

/**
 * The adapter over the endpoints that are open now.
 *
 * `open` checks the connector's config once more, because the schema is a
 * form and `id` is not one of its fields, and keeps the endpoint where the
 * route reads it. The answered close takes it out again: a removed connector,
 * and one closed before it is made afresh, answers 404.
 */
export function webhookAdapter(endpoints: Map<string, Endpoint>): Adapter {
  return {
    name: ADAPTER,
    title: 'Webhook',
    description: 'A URL that talks to a bot, starts an automation, or fires the webhook trigger, with a secret per endpoint.',
    // The same two files the plugin declares, resolved against the plugin's package.
    icons: [
      { src: './icon.svg', theme: 'light' },
      { src: './icon-dark.svg', theme: 'dark' },
    ],
    schema: SCHEMA,
    capabilities: CAPABILITIES,
    open(connector: Connector) {
      const endpoint = checkEndpoint({ ...connector.config, id: connector.id });
      // The owner rides beside the config: the route gives it to the
      // automation it starts and to the fire, so the owner rule is the
      // connector's rather than a body field's.
      endpoints.set(connector.id, { ...endpoint, owner: connector.owner });
      return () => { endpoints.delete(connector.id); };
    },
  };
}
