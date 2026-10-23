import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apply } from '../src/plugin.js';
import type { Adapter, PluginHost } from '@ahpd/sdk';

/*
 * The three first pieces, loaded by their packages.
 *
 * The plugin names a piece by its package, so this is the whole path a daemon
 * takes: `apply` forks the child, the child requires each package, and each
 * piece becomes an adapter. The counts are the piece's own, less an action that
 * needs a file, which the plugin does not offer.
 */

/** The three packages the plugin ships. */
const PIECES = [
  '@activepieces/piece-resend',
  '@activepieces/piece-slack',
  '@activepieces/piece-telegram-bot',
];

/** What the host kept, for the whole file. */
const adapters = new Map<string, Adapter>();
const problems: string[] = [];
const closes: (() => void | Promise<void>)[] = [];

beforeAll(async () => {
  const host = {
    registerAdapter: (adapter: Adapter) => { adapters.set(adapter.name, adapter); },
    registerClose: (close: () => void | Promise<void>) => { closes.push(close); },
    problem: (line: string) => { problems.push(line); },
  } as unknown as PluginHost;
  await apply(host, { pieces: PIECES });
});

afterAll(async () => {
  for (const close of closes) await close();
});

/** The adapter of one piece, which a case that saw another answer should not read. */
function adapter(name: string): Adapter {
  const found = adapters.get(name);
  if (found === undefined) throw new Error(`the plugin registered no ${name}`);
  return found;
}

describe('the three first pieces are adapters', () => {
  it('loads each piece as its adapter, with the auth fields of the piece', () => {
    expect([...adapters.keys()].sort()).toEqual(['ap-resend', 'ap-slack', 'ap-telegram-bot']);

    for (const name of ['ap-resend', 'ap-telegram-bot']) {
      expect(adapter(name).schema).toEqual({
        type: 'object',
        properties: { secret_text: expect.objectContaining({ type: 'string', writeOnly: true }) },
        required: ['secret_text'],
      });
    }
    expect(adapter('ap-resend').capabilities).toHaveLength(58);
    expect(adapter('ap-telegram-bot').capabilities).toHaveLength(41);
  });

  it('gives Slack the custom auth fields, and no OAuth field', () => {
    const schema = adapter('ap-slack').schema;
    const properties = schema['properties'] as Record<string, Record<string, unknown>>;

    expect(Object.keys(properties)).toEqual(['botToken', 'userToken']);
    expect(properties['botToken']).toMatchObject({ type: 'string', writeOnly: true });
    expect(properties['userToken']).toMatchObject({ type: 'string', writeOnly: true });
    expect(schema['required']).toEqual(['botToken']);
    expect(schema).not.toHaveProperty('authUrl');
    expect(schema).not.toHaveProperty('scope');
  });

  it('leaves out Slack\'s action that needs a file, and reports it', () => {
    // The piece declares 73 actions, and uploadFile is the one with a required file.
    expect(adapter('ap-slack').capabilities).toHaveLength(72);
    expect(adapter('ap-slack').capabilities.map((one) => one.name)).not.toContain('uploadFile');
    expect(problems).toEqual([
      expect.stringContaining('ap-slack: the action uploadFile needs a file'),
    ]);
  });

  it('gives ap_resend_send_email the inputs a send needs', () => {
    const send = adapter('ap-resend').capabilities.find((one) => one.name === 'send_email');

    expect(send).toBeDefined();
    const properties = send?.input?.['properties'] as Record<string, unknown>;
    expect(Object.keys(properties)).toEqual(expect.arrayContaining(['from', 'to', 'subject', 'content']));
    expect(send?.input?.['required']).toEqual(expect.arrayContaining(['from', 'to', 'subject', 'content']));
  });
});
