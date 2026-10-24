import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { memoryRecords } from '@ahpd/sdk';
import type { PluginSpec, RecordCollection, ServedAgentKind, StoredRecord, Vault } from '@ahpd/sdk';
import { applyPresets, planPresets } from '../src/agents/migrate.js';

/*
 * The presets a configuration file holds, made into host records at the start.
 *
 * A file written before records named its agents as `presets` of the plugin
 * that ran them, or as a `provider` beside `displayName`. This is the one start
 * that turns each of them into a record owned by the host - the owner the
 * plugins registered them for - and takes them out of the file, with a copy of
 * the file beside it first. The cases here are the whole of that: six presets
 * of four kinds becoming six records of the same ids, a second start that finds
 * nothing to move, a record that cannot be written leaving the file alone, and
 * the ids that cannot become a record at all being said rather than kept.
 *
 * The secret a preset wrote in plaintext is a case of its own: a record may hold
 * no value a listing would serve, so it is moved to the vault under the record's
 * own name, as a put of the agents channel moves one, and the record keeps a
 * reference. A file with no presets is given its built-in claude once, which is
 * what keeps a record a person removed removed.
 *
 * Every case is in a folder of its own under the system's temporary folder, and
 * the records are a store in memory: nothing here reads or writes a person's own
 * configuration.
 */

/** The moment every backup is stamped with, so a name is expectable. */
const WHEN = new Date('2026-10-24T12:00:00.000Z');

/** The value the ACP preset below writes in plaintext, which no record may hold. */
const KEY = 'sk-a-key-nobody may read in a log';

/** The file's own plugins: two Claude variants, two ACP rows, cofold and pi. */
const PLUGINS: PluginSpec[] = [
  {
    name: '@ahpd/agent-claude',
    options: {
      presets: {
        claude: { models: [{ id: 'opus', name: 'Opus' }] },
        'claude-deepseek-build': {
          name: 'DeepSeek build',
          models: [],
          env: {
            ANTHROPIC_BASE_URL: 'https://api.deepseek.example/anthropic',
            ANTHROPIC_AUTH_TOKEN: { $secret: 'host:deepseek' },
          },
        },
      },
    },
  },
  {
    name: '@ahpd/agent-acp',
    options: {
      hostTools: false,
      presets: {
        codex: { env: { CODEX_API_KEY: KEY } },
        work: { base: 'copilot', name: 'Copilot work', command: 'copilot', env: { COPILOT_HOME: '/tmp/copilot' } },
      },
    },
  },
  {
    name: '@ahpd/agent-cofold',
    options: { provider: 'cofold-build', displayName: 'cofold build', model: 'deepseek-chat' },
  },
  {
    name: '@ahpd/agent-pi',
    options: { provider: 'pi-local', displayName: 'pi local' },
  },
];

/** One kind as a plugin registers it, with only the fields the migration reads. */
const kindOf = (name: string, schema: Record<string, unknown>, keyVariables?: string[]): ServedAgentKind => ({
  name,
  title: name,
  description: `the ${name} kind`,
  schema,
  ...(keyVariables === undefined ? {} : { keyVariables }),
  by: 'test',
  open: () => { throw new Error('no record is opened here'); },
});

/**
 * The four kinds, with the secret fields the channel's own put reads: an ACP
 * key and a claude token are `keyVariables`, and a cofold key is `writeOnly`.
 */
const KINDS: Record<string, ServedAgentKind> = {
  claude: kindOf('claude', { properties: { models: {}, env: {} } }, ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']),
  acp: kindOf('acp', { properties: { command: {}, env: {} } }, ['CODEX_API_KEY', 'COPILOT_GITHUB_TOKEN', 'GEMINI_API_KEY']),
  cofold: kindOf('cofold', { properties: { apiKey: { type: 'string', writeOnly: true }, baseUrl: {} } }),
  pi: kindOf('pi', { properties: { env: {} } }, ['DEEPSEEK_API_KEY']),
};

let dir: string;
let configFile: string;
let records: RecordCollection;
let said: string[];
let secrets: Map<string, string>;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ahpd-migrate-'));
  configFile = join(dir, 'config.json');
  records = await memoryRecords().collection('agents', { format: 'json' });
  said = [];
  secrets = new Map();
});

afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

/** A configuration file holding these plugins, as a person would have written it. */
const written = (plugins: unknown): string => {
  const text = `${JSON.stringify({ host: '127.0.0.1', port: 9187, plugins }, null, 2)}\n`;
  writeFileSync(configFile, text);
  return text;
};

/** The vault a start writes a record's key to, in memory. */
const vault = (): Vault => ({
  get: async (name) => secrets.get(name),
  set: async (name, value) => { secrets.set(name, value); },
  delete: async (name) => secrets.delete(name),
  list: async () => [...secrets.keys()].sort(),
});

/**
 * One start's migration: the plan the daemon makes before the plugins load,
 * then the write step once the kinds are known.
 */
const migrate = async (plugins: PluginSpec[], store: RecordCollection = records, keyring: Vault | undefined = vault()) => {
  const say = (line: string): void => { said.push(line); };
  const plan = planPresets({ plugins, configFile, log: say });
  const applied = await applyPresets({ plan, records: store, kinds: KINDS, vault: keyring, log: say, now: () => WHEN });
  return { plugins: plan.plugins, written: applied.written };
};

/** Every record the store holds, by id. */
const held = async (store: RecordCollection = records): Promise<Map<string, StoredRecord>> =>
  new Map((await store.list()).map((one) => [one.id, one]));

/** The file as it is on disk, parsed. */
const file = (): Record<string, unknown> => JSON.parse(readFileSync(configFile, 'utf8')) as Record<string, unknown>;

/** The plugin entries the file now holds. */
const entries = (): Record<string, unknown>[] => (file()['plugins'] as Record<string, unknown>[]);

/** The plugins a run reads from the file when no flag names any. */
const filed = (): PluginSpec[] => entries() as unknown as PluginSpec[];

/** The one entry the file holds under this package. */
const entryOf = (name: string): Record<string, unknown> => {
  const found = entries().find((one) => one['name'] === name);
  if (found === undefined) throw new Error(`the file has no ${name} entry`);
  return found;
};

/** The backup the migration left beside the configuration. */
const backups = (): string[] => readdirSync(dir).filter((one) => one.startsWith('config.json.bak-'));

it('moves every preset to a host record of the same id, and takes them out of the file', async () => {
  written(PLUGINS);
  const before = readFileSync(configFile, 'utf8');

  const moved = await migrate(PLUGINS);
  expect(moved.written).toEqual(['claude', 'claude-deepseek-build', 'codex', 'work', 'cofold-build', 'pi-local']);

  const all = await held();
  expect([...all.keys()].sort()).toEqual(['claude', 'claude-deepseek-build', 'codex', 'cofold-build', 'pi-local', 'work']);
  // Every record is the host's, which is who owned the agents a preset
  // registered: a record with no readable owner is served to nobody.
  expect([...all.values()].map((one) => one['owner'])).toEqual(Array.from({ length: 6 }, () => 'host'));
  expect([...all.values()].map((one) => one['kind']).sort()).toEqual([
    'acp', 'acp', 'claude', 'claude', 'cofold', 'pi',
  ]);

  // The built-in claude, named by the plugin's own default and carrying its
  // models; and the variant, whose name is the record's and whose key stays the
  // name it was written as.
  expect(all.get('claude')).toMatchObject({
    id: 'claude',
    kind: 'claude',
    owner: 'host',
    name: 'Claude Code',
    config: { models: [{ id: 'opus', name: 'Opus' }] },
  });
  expect(all.get('claude-deepseek-build')).toMatchObject({
    name: 'DeepSeek build',
    config: {
      models: [],
      env: {
        ANTHROPIC_BASE_URL: 'https://api.deepseek.example/anthropic',
        // A `$secret` is moved as it was written: nothing here reads a value.
        ANTHROPIC_AUTH_TOKEN: { $secret: 'host:deepseek' },
      },
    },
  });

  // An ACP record takes the shipped row's name and keeps its own `base`, which
  // is how a record names a row it is not named after. Its key was written in
  // plaintext, so it is in the vault and the record holds a reference.
  expect(all.get('codex')).toMatchObject({
    kind: 'acp',
    name: 'Codex',
    config: { env: { CODEX_API_KEY: { $secret: 'host:agent/codex/env.CODEX_API_KEY' } } },
  });
  expect(secrets.get('host:agent/codex/env.CODEX_API_KEY')).toBe(KEY);
  expect(all.get('work')).toMatchObject({
    kind: 'acp',
    name: 'Copilot work',
    config: { base: 'copilot', command: 'copilot', env: { COPILOT_HOME: '/tmp/copilot' } },
  });
  // cofold and pi wrote one agent as their own options; its id is the record's
  // and every other option stays the plugin's default.
  expect(all.get('cofold-build')).toMatchObject({ kind: 'cofold', name: 'cofold build', config: {} });
  expect(all.get('pi-local')).toMatchObject({ kind: 'pi', name: 'pi local', config: {} });

  // The file lost what the records hold, and kept what is the plugin's own.
  expect(entries()).toEqual([
    { name: '@ahpd/agent-claude' },
    { name: '@ahpd/agent-acp', options: { hostTools: false } },
    { name: '@ahpd/agent-cofold', options: { model: 'deepseek-chat' } },
    { name: '@ahpd/agent-pi' },
  ]);

  // A copy of the file as it was, beside it and named after it.
  const kept = backups();
  expect(kept).toEqual(['config.json.bak-2026-10-24T12-00-00-000Z']);
  expect(readFileSync(join(dir, kept[0] as string), 'utf8')).toBe(before);

  // One line, naming the ids and no field value.
  expect(said).toHaveLength(1);
  expect(said[0]).toBe(
    `Moved 6 presets to agent records owned by the host: ${moved.written.join(', ')}. `
    + `${join(dir, 'config.json.bak-2026-10-24T12-00-00-000Z')} holds the file as it was.`,
  );
  expect(said.join('\n')).not.toContain('sk-a-key');
  expect(said.join('\n')).not.toContain('api.deepseek.example');
});

it('finds nothing to do at a second start', async () => {
  written(PLUGINS);
  await migrate(PLUGINS);
  const once = readFileSync(configFile, 'utf8');
  const recordsBefore = await held();
  said.length = 0;

  // The second start reads the file the first one left, which is what the
  // daemon does: the plugins are the ones the file names.
  const again = await migrate(filed());

  expect(again.written).toEqual([]);
  expect(await held()).toEqual(recordsBefore);
  expect(readFileSync(configFile, 'utf8')).toBe(once);
  // No second backup, and nothing said.
  expect(backups()).toHaveLength(1);
  expect(said).toEqual([]);
});

it('leaves the file untouched when a record cannot be written, and writes the rest next time', async () => {
  const before = written(PLUGINS);
  /** The store, refusing the one record this case cannot write. */
  const refusing: RecordCollection = {
    ...records,
    put: async (record) => {
      if (record.id === 'work') throw new Error('the disk is full');
      await records.put(record);
    },
  };

  const stopped = await migrate(PLUGINS, refusing);
  // The three before the failure are records; the rest is still in the file.
  expect(stopped.written).toEqual(['claude', 'claude-deepseek-build', 'codex']);
  expect([...await held()]).toHaveLength(3);
  expect(readFileSync(configFile, 'utf8')).toBe(before);
  expect(backups()).toEqual([]);
  // The loader was handed the cleaned specs before the writes, so a failure
  // cannot put the presets back into a plugin's options.
  expect(stopped.plugins).toEqual([
    { name: '@ahpd/agent-claude' },
    { name: '@ahpd/agent-acp', options: { hostTools: false } },
    { name: '@ahpd/agent-cofold', options: { model: 'deepseek-chat' } },
    { name: '@ahpd/agent-pi' },
  ]);
  expect(said.join('\n')).toContain('work could not be written as a record: the disk is full');
  expect(said.join('\n')).not.toContain('sk-a-key');

  // And the next start, with a store that can write, moves the rest.
  const then = await migrate(PLUGINS);
  expect(then.written).toEqual(['work', 'cofold-build', 'pi-local']);
  expect(entries()).toHaveLength(4);
});

it('says each preset whose id cannot be a record, and moves the others', async () => {
  written([
    {
      name: '@ahpd/agent-acp',
      options: { presets: { Bad_Id: { command: 'x' }, gemini: {} } },
    },
    { name: '@ahpd/agent-cofold', options: { provider: 'gemini', displayName: 'Gemini' } },
  ]);

  const moved = await migrate(filed());

  expect(moved.written).toEqual(['gemini']);
  expect([...(await held()).keys()]).toEqual(['gemini']);
  expect(said[0]).toMatch(/^The acp preset Bad_Id did not become a record: its id is not a slug: lowercase letters/u);
  expect(said[1]).toBe('The cofold preset gemini did not become a record: acp already names an agent of that id.');
  // The ids are named and no value is.
  expect(said.join('\n')).not.toContain('command');
});

it('keeps the presets of a plugin this run does not load', async () => {
  written([
    { name: '@ahpd/agent-claude', enabled: false, options: { presets: { claude: false, mine: { name: 'Mine' } } } },
    { name: '@ahpd/agent-acp', options: { presets: { gemini: {} } } },
  ]);
  const before = file();

  await migrate(filed());

  // The switched-off entry is the only copy of its agents, so it is as it was.
  expect(entryOf('@ahpd/agent-claude')).toEqual((before['plugins'] as Record<string, unknown>[])[0]);
  expect(entryOf('@ahpd/agent-acp')).toEqual({ name: '@ahpd/agent-acp' });
  expect([...(await held()).keys()]).toEqual(['gemini']);
});

it('writes the record a fresh install has no file for', async () => {
  // No configuration file at all: the daemon was started with the plugin named
  // on its command line, and the built-in claude is a record like any other.
  const moved = await migrate(['@ahpd/agent-claude']);

  expect(moved.written).toEqual(['claude']);
  expect(await held()).toMatchObject(new Map([['claude', {
    id: 'claude', kind: 'claude', owner: 'host', name: 'Claude Code', config: {},
  }]]));
  expect(existsSync(configFile)).toBe(false);
  expect(said).toEqual(['Moved 1 preset to agent records owned by the host: claude.']);
});

it('says a file it cannot read and leaves it as it was, quoting none of it', async () => {
  // A parser quotes the text it choked on, so the file's own words - a key
  // among them - are not repeated in the line.
  const broken = '{"plugins": [], "token": sk-live-9f2c}';
  writeFileSync(configFile, broken);

  const moved = await migrate([{ name: '@ahpd/agent-acp', options: { presets: { gemini: {} } } }]);

  // The record is written, and the file is the one that was there.
  expect(moved.written).toEqual(['gemini']);
  expect(readFileSync(configFile, 'utf8')).toBe(broken);
  expect(backups()).toEqual([]);
  expect(said).toEqual([`The presets were not taken out of ${configFile}: it could not be read, and is as it was.`]);
  expect(said.join('\n')).not.toContain('sk-live-9f2c');
});

it('does nothing when the file has no preset and its records are there', async () => {
  written(['@ahpd/agent-claude', '@ahpd/agent-acp']);
  await migrate(['@ahpd/agent-claude', '@ahpd/agent-acp']);
  const once = readFileSync(configFile, 'utf8');
  said.length = 0;

  const again = await migrate(['@ahpd/agent-claude', '@ahpd/agent-acp']);
  expect(again.written).toEqual([]);
  expect(readFileSync(configFile, 'utf8')).toBe(once);
  expect(said).toEqual([]);
  expect(backups()).toEqual([]);
});

it('moves a plaintext key into the vault, and keeps no value in the record, a listing or a line', async () => {
  written([{ name: '@ahpd/agent-acp', options: { presets: { codex: { env: { CODEX_API_KEY: KEY } } } } }]);

  const moved = await migrate(filed());

  expect(moved.written).toEqual(['codex']);
  // The record holds the name the channel's own put gives a host record's
  // secret, and the vault holds the value.
  expect((await held()).get('codex')).toMatchObject({
    config: { env: { CODEX_API_KEY: { $secret: 'host:agent/codex/env.CODEX_API_KEY' } } },
  });
  expect(secrets.get('host:agent/codex/env.CODEX_API_KEY')).toBe(KEY);
  // Nowhere a client, a reader of the records or a log reader looks carries it.
  expect(JSON.stringify(await records.list())).not.toContain('sk-a-key');
  expect(readFileSync(configFile, 'utf8')).not.toContain('sk-a-key');
  expect(said.join('\n')).not.toContain('sk-a-key');
});

it('gives a file with no presets its built-in claude once, and leaves a removed one removed', async () => {
  written([{ name: '@ahpd/agent-claude' }]);

  const first = await migrate(filed());
  expect(first.written).toEqual(['claude']);
  expect(existsSync(join(dir, 'presets-state.json'))).toBe(true);

  // A person removes the record. The file still names the plugin and holds no
  // presets, so nothing asks for it again.
  await records.remove('claude');
  said.length = 0;

  const again = await migrate(filed());
  expect(again.written).toEqual([]);
  expect(await held()).toEqual(new Map());
  expect(said).toEqual([]);
});

