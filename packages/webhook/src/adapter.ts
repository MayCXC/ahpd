import { checkEndpoint, REPLIES } from './record.js';
import type { Endpoint } from './record.js';
import type { Adapter, Capability, Connector } from '@ahpd/sdk';

/**
 * The `webhook` adapter.
 *
 * A connector of this adapter is one endpoint: a bot or an automation, the
 * reply a call gets, and the secret its caller sends. The schema is what a
 * client draws the form from, and `open` is where the plugin starts answering
 * for a connector that was made or was stored when the daemon started.
 *
 * `secret` is the one field a schema marks `writeOnly`, so the host keeps its
 * value in the vault and the connector's record holds a reference to it. Every
 * other field is the endpoint's own and stays in the record.
 */

/** The adapter's name, which is the `adapter` every endpoint's record carries. */
export const ADAPTER = 'webhook';

/**
 * The fields of a webhook endpoint, as a client draws them.
 *
 * The bot and the automation are a choice, so the schema holds a `oneOf` of
 * the two: a config names one of them and not both.
 */
const FIELDS: Record<string, Record<string, unknown>> = {
  bot: {
    type: 'string',
    pattern: '^bot://[a-z][a-z0-9-]{0,39}$',
    title: 'Bot',
    description: 'The bot a call talks to, as bot://<name>.',
  },
  automation: {
    type: 'boolean',
    const: true,
    title: 'Automation',
    description: 'True when a call fires the webhook trigger instead of talking to a bot.',
  },
  secret: {
    type: 'string',
    writeOnly: true,
    title: 'Secret',
    description: 'The bearer token a caller sends. It is kept in the vault, never in the connector.',
  },
  reply: {
    type: 'string',
    enum: [...REPLIES],
    default: 'callback',
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

/** The object every endpoint config is, with `secret` the one it must have. */
const BASE: Record<string, unknown> = {
  type: 'object',
  properties: FIELDS,
  required: ['secret'],
  additionalProperties: false,
};

/**
 * The form a person fills in to make an endpoint.
 *
 * `properties` is at the top level, because that is where the host reads the
 * `writeOnly` fields from. The same object is repeated in `allOf` because a
 * validator stops at the first of `allOf`, `oneOf` and `properties` it meets,
 * so the object is checked by the alternative that carries it.
 */
export const SCHEMA: Record<string, unknown> = {
  ...BASE,
  title: 'Webhook endpoint',
  description: 'A URL that talks to a bot or fires an automation, with a secret a caller sends.',
  allOf: [
    BASE,
    {
      oneOf: [
        { title: 'A bot', required: ['bot'] },
        { title: 'An automation', required: ['automation'] },
      ],
    },
  ],
};

/** What a connector of this adapter does, as a client lists it. */
export const CAPABILITIES: Capability[] = [{
  type: 'receive',
  name: 'calls',
  title: 'Receives calls',
  description: 'Answers a POST to /plugins/webhook/<id> whose bearer token is the endpoint secret.',
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
    description: 'A URL that talks to a bot or fires an automation, with a secret per endpoint.',
    schema: SCHEMA,
    capabilities: CAPABILITIES,
    open(connector: Connector) {
      const endpoint = checkEndpoint({ ...connector.config, id: connector.id });
      endpoints.set(connector.id, endpoint);
      return () => { endpoints.delete(connector.id); };
    },
  };
}
