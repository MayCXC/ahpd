import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createHost, ROOT } from '../../sdk/src/host.js';
import { foldHostOptions, pluginHost } from '../../sdk/src/plugins.js';
import { memoryRecords } from '../../sdk/src/records.js';
import { fileResources } from '../../sdk/src/resources.js';
import { memorySessions } from '../../sdk/src/sessions.js';
import { sdkVersion } from '../../sdk/src/version.js';
import { echo } from '../../../examples/echo/agent.js';
import { botChatAgent, CHATS_DIR, CHAT_PROVIDER } from '../src/chat.js';
import { apply } from '../src/plugin.js';
import { botStore } from '../src/store.js';
import type { Bag } from '../../sdk/src/types/common.js';
import type { HostOptions } from '../../sdk/src/types/host.js';
import type { LoaderContext } from '../../sdk/src/types/plugin.js';
import type { Peer } from '../../sdk/src/types/rpc.js';

/*
 * A chat with a bot is a session with no harness.
 *
 * A person says something to a bot, and what they said has to be kept somewhere
 * the bot can read and answer into. That is this: a session of the `bot-chat`
 * provider, one JSON line per turn in a log under the daemon's own
 * configuration, and nothing running behind it.
 *
 * What is checked here is the two things the log decides - a turn is a line,
 * and a line is what a restarted daemon answers `list`, `find` and `transcript`
 * from - and the refusal a chat with a bot that is not there gets.
 */

/** A temporary directory removed after the test that made it. */
let loose: string[] = [];
beforeEach(() => { loose = []; });
afterEach(() => {
  for (const dir of loose) rmSync(dir, { recursive: true, force: true });
  loose = [];
});

const peer = (): Peer => ({
  send: () => {}, notify: () => {}, request: async () => ({}), answered: () => {}, close: () => {},
});

/**
 * A host with the bot plugin on it, and no users directory.
 *
 * No directory is the one host where no connection is anybody, which is what
 * this file wants: who may read a bot, and so who may start a chat with one, is
 * the provider's business and is checked there. Nothing below is a question
 * about a grant.
 */
function made() {
  const root = mkdtempSync(join(tmpdir(), 'ahpd-bot-chat-'));
  loose.push(root);
  /** Where a bot's own folder goes, which is the plugin's `root` option. */
  const bots = join(root, 'bots');
  /** The daemon's own configuration, which is where the chats are kept. */
  const configDir = join(root, 'config');
  const context: LoaderContext = {
    path: root,
    paths: [root],
    version: sdkVersion(),
    hostName: 'test',
    configDir,
    log: () => {},
    say: () => {},
  };
  const sessions = memorySessions();
  const records = memoryRecords();
  const { host: plugin, contribution } = pluginHost('bot', context, {
    sessions: () => sessions,
    records: () => records,
    problem: () => {},
  });
  apply(plugin, { root: bots });

  const base: HostOptions = {
    path: root,
    // One agent, because a bot that names no harness is started on the host's
    // first one: a host with no agent at all could not answer a write of a bot.
    agents: [{ ...echo({ path: root, pace: 0 }), provider: 'base', displayName: 'Base' }],
    resources: fileResources(),
    sessions,
    records,
  };
  const { options } = foldHostOptions(base, [contribution]);
  return { host: createHost(options), root, bots, configDir, records };
}

type Client = ReturnType<ReturnType<typeof createHost>['accept']>;

/** A client of this host, signed in as nobody, which is everybody here. */
async function anyone(host: ReturnType<typeof createHost>): Promise<Client> {
  const client = host.accept(peer());
  await client.handle({
    method: 'initialize',
    params: { clientId: 'anyone', protocolVersions: ['0.9.0'], initialSubscriptions: [ROOT] },
  });
  return client;
}

/** What the call was refused with, or a case that fails because it was allowed. */
const refusalOf = async (run: Promise<unknown>): Promise<{ code?: number; message: string }> =>
  run.then(() => { throw new Error('the call was allowed'); }, (error: { code?: number; message: string }) => error);

/** One line of a chat's log, as it was written. */
const lines = (configDir: string, id: string): Bag[] => readFileSync(join(configDir, CHATS_DIR, `${id}.jsonl`), 'utf8')
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => JSON.parse(line) as Bag);

it('keeps a chat as one line a turn, and answers it again after a restart', async () => {
  const { host, configDir, records } = made();
  const client = await anyone(host);

  await client.handle({
    method: 'resourceWrite',
    params: { uri: 'bot://backer', data: JSON.stringify({ name: 'Backer' }), createOnly: true },
  });
  await client.handle({
    method: 'createSession',
    params: { channel: 'ahp-session:/one', provider: CHAT_PROVIDER, config: { bot: 'backer' } },
  });
  await client.handle({ method: 'subscribe', params: { channel: 'ahp-chat:/one' } });
  for (const [turnId, text] of [['t1', 'hello'], ['t2', 'again']] as const) {
    await client.handle({
      method: 'dispatchAction',
      params: { channel: 'ahp-chat:/one', action: { type: 'chat/turnStarted', turnId, message: { text } } },
    });
  }

  // Two turns, two lines, and nothing in the line but the turn.
  const kept = lines(configDir, 'one');
  expect(kept.map((said) => said['id'])).toEqual(['t1', 't2']);
  expect(kept[0]).toMatchObject({
    message: { text: 'hello', origin: { kind: 'user' } },
    responseParts: [],
    state: 'complete',
    // The bot is on the line so that a listing knows which chat this is, and
    // not on the turn a client is served.
    _meta: { bot: 'backer', name: 'Backer', kind: 'direct' },
  });

  /*
   * A daemon that restarts has nothing in memory. What it has is the folder,
   * so this second agent is the whole of what a restart leaves: a store over
   * the same records, and the same configuration directory.
   */
  const store = botStore(
    await records.collection('bots', { body: 'instructions' }),
    await records.collection('bots-gone'),
    () => {},
  );
  const fresh = botChatAgent(configDir, store);

  expect(await fresh.list?.()).toMatchObject([{ id: 'one', title: 'Backer' }]);
  expect(await fresh.find?.('one')).toMatchObject({ id: 'one', title: 'Backer' });

  const turns = await fresh.transcript?.('one');
  expect(turns?.map((turn) => turn.message.text)).toEqual(['hello', 'again']);
  // A turn served to a client is the turn: no `_meta`, and no response part -
  // nothing has answered this chat yet.
  expect(turns?.[0]).not.toHaveProperty('_meta');
  expect(turns?.[0]?.responseParts).toEqual([]);
  expect(turns?.[0]?.message.origin).toEqual({ kind: 'user' });
  // A chat this host has no log for is not a chat, which is not the same
  // answer as a chat nothing has been said to.
  expect(await fresh.transcript?.('two')).toBeUndefined();
  expect(await fresh.find?.('two')).toBeUndefined();
});

it('refuses a chat with a bot that is not there', async () => {
  const { host } = made();
  const client = await anyone(host);

  const refusal = await refusalOf(client.handle({
    method: 'createSession',
    params: { channel: 'ahp-session:/one', provider: CHAT_PROVIDER, config: { bot: 'nobody' } },
  }));

  // The host's own code for what a backend refused `create` with, and the
  // backend's sentence: `openSession` answers every one of them the same way.
  expect(refusal.code).toBe(-32602);
  expect(refusal.message).toBe('There is no bot nobody.');
});
