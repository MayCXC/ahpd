import { answer } from './route.js';
import type { TriggerTypeDefinition } from '@ahpd/sdk';
import type { Target } from './route.js';

/** What the automation target calls, so a test gives it. */
export interface AutomationSeams {
  /** Fire the `webhook` trigger type's `call` event with this data. */
  fire(data: Record<string, unknown>): void;
}

/**
 * The trigger type the plugin offers.
 *
 * A saved trigger names one endpoint in its `config`, and runs only on the
 * calls to that endpoint.
 */
export const WEBHOOK_TRIGGER: TriggerTypeDefinition = {
  type: 'webhook',
  title: 'Webhook',
  description: 'Runs when a webhook endpoint is called.',
  events: [{ id: 'call', title: 'A webhook call', description: 'The endpoint got a JSON object.' }],
  configSchema: {
    type: 'object',
    properties: {
      endpoint: { type: 'string', title: 'Endpoint', description: 'The id of the webhook endpoint.' },
    },
    required: ['endpoint'],
  },
};

/**
 * The target of an automation endpoint.
 *
 * The call's JSON object is the data of one fire, with `endpoint` set to the
 * endpoint id. The id wins over a body field of that name, so a caller reaches
 * only the automations of the endpoint it called.
 */
export function automationTarget(seams: AutomationSeams): Target {
  return async (endpoint, request) => {
    let body: unknown;
    try {
      body = JSON.parse(await request.text());
    }
    catch {
      return answer(400, { message: 'The body is not JSON.' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return answer(400, { message: 'The body is not a JSON object.' });
    }
    seams.fire({ ...body as Record<string, unknown>, endpoint: endpoint.id });
    return answer(202, { endpoint: endpoint.id });
  };
}
