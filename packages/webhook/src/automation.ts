import type { TriggerTypeDefinition } from '@ahpd/sdk';

/**
 * The trigger type the plugin offers.
 *
 * A saved trigger names one connector in its `config`, and runs only on the
 * calls to that connector. The field is marked `x-ahpd-connector` so the host
 * refuses a trigger naming a connector that does not exist, or one of another
 * adapter, and so a client can draw the field as the list of connectors.
 */
const CONFIG_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    connector: {
      type: 'string',
      title: 'Connector',
      description: 'The webhook connector the call came to.',
      'x-ahpd-connector': { adapter: 'webhook' },
    },
  },
  required: ['connector'],
};

export const WEBHOOK_TRIGGER: TriggerTypeDefinition = {
  type: 'webhook',
  title: 'Webhook',
  description: 'Runs when a webhook connector is called.',
  events: [{ id: 'call', title: 'A webhook call', description: 'A connector received a call.' }],
  configSchema: CONFIG_SCHEMA as unknown as NonNullable<TriggerTypeDefinition['configSchema']>,
};
