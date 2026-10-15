import { expect, it } from 'vitest';
import { automationTarget, WEBHOOK_TRIGGER } from '../src/automation.js';
import { checkEndpoint } from '../src/record.js';

/*
 * The automation target, over a stub fire.
 *
 * A call's JSON object is the data of one `webhook` `call` fire, with the
 * endpoint id set on it. What is checked is what each fire carried, and what
 * the call is answered with.
 */

const URL_OF = 'http://127.0.0.1:1/plugins/webhook/deploys';

const endpoint = checkEndpoint({ id: 'deploys', automation: true, secret: 'host:deploys-hook' });

/** A target over a stub fire, with the data of each fire it made. */
function made() {
  const fires: Record<string, unknown>[] = [];
  const target = automationTarget({ fire: (data) => { fires.push(data); } });
  const call = (body: string) => target(endpoint, new Request(URL_OF, { method: 'POST', body }));
  return { fires, call };
}

it('fires once for a JSON object and answers 202', async () => {
  const { fires, call } = made();
  const answer = await call(JSON.stringify({ repo: 'ahpd', ref: 'main' }));
  expect(answer.status).toBe(202);
  expect(fires).toHaveLength(1);
});

it('fires with the body and the endpoint id as its data', async () => {
  const { fires, call } = made();
  await call(JSON.stringify({ repo: 'ahpd', count: 3 }));
  expect(fires[0]).toEqual({ repo: 'ahpd', count: 3, endpoint: 'deploys' });
});

it('keeps the endpoint id over a body field named endpoint', async () => {
  const { fires, call } = made();
  await call(JSON.stringify({ endpoint: 'other', repo: 'ahpd' }));
  expect(fires[0]).toEqual({ endpoint: 'deploys', repo: 'ahpd' });
});

it('offers one event, call, and a form with a required endpoint', () => {
  expect(WEBHOOK_TRIGGER.type).toBe('webhook');
  expect(WEBHOOK_TRIGGER.events.map((event) => event.id)).toEqual(['call']);
  expect(WEBHOOK_TRIGGER.configSchema?.required).toEqual(['endpoint']);
  expect(WEBHOOK_TRIGGER.configSchema?.properties['endpoint']?.type).toBe('string');
});

it('answers 400 and fires nothing for a body that is not JSON', async () => {
  const { fires, call } = made();
  const answer = await call('not json');
  expect(answer.status).toBe(400);
  expect(fires).toEqual([]);
});

it('answers 400 and fires nothing for a JSON body that is not an object', async () => {
  const { fires, call } = made();
  for (const body of ['[1,2]', '"text"', '3', 'null']) {
    const answer = await call(body);
    expect(answer.status).toBe(400);
  }
  expect(fires).toEqual([]);
});
