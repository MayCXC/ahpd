import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apply } from '../src/plugin.js';
import type { Adapter, PluginHost } from '@ahpd/sdk';

/*
 * The pieces the package ships, loaded by their packages.
 *
 * The plugin names a piece by its package, so this is the whole path a daemon
 * takes: `apply` forks the child, the child requires each package, and each
 * piece becomes an adapter. The counts are the piece's own, less an action that
 * needs a file, which the plugin does not offer.
 */

/** The packages the plugin ships. */
const PIECES = [
  '@activepieces/piece-airtable',
  '@activepieces/piece-discord',
  '@activepieces/piece-github',
  '@activepieces/piece-hubspot',
  '@activepieces/piece-jira-cloud',
  '@activepieces/piece-linear',
  '@activepieces/piece-notion',
  '@activepieces/piece-resend',
  '@activepieces/piece-sendgrid',
  '@activepieces/piece-slack',
  '@activepieces/piece-smtp',
  '@activepieces/piece-stripe',
  '@activepieces/piece-telegram-bot',
  '@activepieces/piece-whatsapp',
];

/** Each adapter's auth fields, in the order the piece declares them, and its required ones. */
const AUTH: Record<string, [string[], string[]]> = {
  'ap-airtable': [['secret_text'], ['secret_text']],
  'ap-discord': [['secret_text'], ['secret_text']],
  'ap-github': [['appId', 'installationId', 'privateKey'], ['appId', 'installationId', 'privateKey']],
  'ap-hubspot': [['access_token'], ['access_token']],
  'ap-jira-cloud': [['instanceUrl', 'email', 'apiToken'], ['instanceUrl', 'email', 'apiToken']],
  'ap-linear': [['secret_text'], ['secret_text']],
  'ap-notion': [['accessToken'], ['accessToken']],
  'ap-resend': [['secret_text'], ['secret_text']],
  'ap-sendgrid': [['secret_text'], ['secret_text']],
  'ap-slack': [['botToken', 'userToken'], ['botToken']],
  'ap-smtp': [['host', 'port', 'TLS', 'email', 'password'], ['host', 'port', 'TLS']],
  'ap-stripe': [['secret_text'], ['secret_text']],
  'ap-telegram-bot': [['secret_text'], ['secret_text']],
  'ap-whatsapp': [['access_token', 'businessAccountId', 'app_secret'], ['access_token', 'businessAccountId']],
};

/** Each adapter's actions: the piece's own, less those that need a file. */
const ACTIONS: Record<string, number> = {
  'ap-airtable': 33, 'ap-discord': 61, 'ap-github': 93, 'ap-hubspot': 53, 'ap-jira-cloud': 75,
  'ap-linear': 58, 'ap-notion': 37, 'ap-resend': 58, 'ap-sendgrid': 8, 'ap-slack': 72,
  'ap-smtp': 1, 'ap-stripe': 98, 'ap-telegram-bot': 41, 'ap-whatsapp': 22,
};

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

describe('the pieces are adapters', () => {
  it('loads each piece as its adapter, with the auth fields of the piece', () => {
    expect([...adapters.keys()].sort()).toEqual(Object.keys(AUTH).sort());

    for (const [name, [fields, required]] of Object.entries(AUTH)) {
      const schema = adapter(name).schema;
      const properties = schema['properties'] as Record<string, Record<string, unknown>>;
      expect(Object.keys(properties), name).toEqual(fields);
      expect(schema['required'], name).toEqual(required);
      expect(schema, name).not.toHaveProperty('authUrl');
    }
    for (const [name, count] of Object.entries(ACTIONS)) {
      expect(adapter(name).capabilities, name).toHaveLength(count);
    }

    for (const name of ['ap-resend', 'ap-telegram-bot']) {
      expect(adapter(name).schema).toEqual({
        type: 'object',
        properties: { secret_text: expect.objectContaining({ type: 'string', writeOnly: true }) },
        required: ['secret_text'],
      });
    }
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

  it('leaves out each action that needs a file, and reports it', () => {
    expect(adapter('ap-slack').capabilities.map((one) => one.name)).not.toContain('uploadFile');
    expect([...problems].sort()).toEqual([
      expect.stringContaining('ap-airtable: the action airtable_upload_file_to_column needs a file'),
      expect.stringContaining('ap-hubspot: the action upload-file needs a file'),
      expect.stringContaining('ap-jira-cloud: the action add_issue_attachment needs a file'),
      expect.stringContaining('ap-jira-cloud: the action upload_attachment needs a file'),
      expect.stringContaining('ap-slack: the action uploadFile needs a file'),
      expect.stringContaining('ap-whatsapp: the action upload_media needs a file'),
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
