import { NAME, webhookRoute } from './route.js';
import type { Plugin } from '@ahpd/sdk';

/**
 * The package as a plugin.
 *
 * One route, `/plugins/%40ahpd/webhook/<endpoint>`, and the endpoints it
 * serves in the `webhooks` collection. Each endpoint names its own vault
 * secret, and a call passes only with that secret as its bearer token.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = NAME;

/** What a listing prints. */
export const title = 'Webhook';

/** What an option falls back to. */
export const defaults = {} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {},
};

export const apply: Plugin['apply'] = (host) => {
  const webhooks = host.records('webhooks');
  host.registerRoute(webhookRoute({
    endpoint: (id) => webhooks.get(id),
    secret: (secret) => host.secret(secret),
    problem: (line) => { host.problem(`${name}: ${line}`); },
  }));
};
