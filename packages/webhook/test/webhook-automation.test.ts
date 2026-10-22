import { expect, it } from 'vitest';
import { WEBHOOK_TRIGGER } from '../src/automation.js';

/*
 * The trigger type the plugin offers.
 *
 * A saved trigger names one connector, and a client draws that field as the
 * list of the host's webhook connectors, so the field is checked on save and
 * marked with the adapter it names.
 */

it('offers one event, call, and a form with a required connector', () => {
  expect(WEBHOOK_TRIGGER.type).toBe('webhook');
  expect(WEBHOOK_TRIGGER.events.map((event) => event.id)).toEqual(['call']);
  expect(WEBHOOK_TRIGGER.configSchema?.required).toEqual(['connector']);
  expect(WEBHOOK_TRIGGER.configSchema?.properties['connector']).toEqual({
    type: 'string',
    title: 'Connector',
    description: 'The webhook connector the call came to.',
    'x-ahpd-connector': { adapter: 'webhook' },
  });
});
