import { randomUUID } from 'node:crypto';
import { reason } from '@ahpd/sdk';
import { botTarget, turnEnds } from './bot.js';
import { NAME, webhookRoute } from './route.js';
import type { Plugin, PluginHost, PluginPeer, TurnEndEvent } from '@ahpd/sdk';
import type { BotSeams } from './bot.js';

/**
 * The package as a plugin.
 *
 * One route, `/plugins/%40ahpd/webhook/<endpoint>`, and the endpoints it
 * serves in the `webhooks` collection. Each endpoint names its own vault
 * secret, and a call passes only with that secret as its bearer token.
 *
 * A bot endpoint talks to its bot through the plugin's own connection to the
 * host, which is opened once the daemon listens.
 */

/** The plugin's id, unique among the plugins a daemon loads. */
export const name = NAME;

/** What a listing prints. */
export const title = 'Webhook';

/** What an option falls back to. */
export const defaults = {
  syncTimeoutSeconds: 60,
} as const;

/** The options `apply` receives, as a JSON Schema the daemon checks them against. */
export const optionsSchema = {
  type: 'object',
  properties: {
    syncTimeoutSeconds: {
      type: 'number',
      exclusiveMinimum: 0,
      description: 'How long a sync call waits for its turn to end, in seconds.',
    },
  },
};

/** What the plugin's connection calls itself. */
const CLIENT = 'ahpd-webhook';

/** The text of one turn in a chat's state: its `markdown` response parts, joined. */
const textOf = (state: unknown, turn: string): string => {
  const turns = (state as { turns?: unknown } | undefined)?.turns;
  if (!Array.isArray(turns)) return '';
  const found = turns.find((one: unknown) => (one as { id?: unknown }).id === turn) as { responseParts?: unknown } | undefined;
  const parts = Array.isArray(found?.responseParts) ? found.responseParts as { kind?: unknown; content?: unknown }[] : [];
  return parts.filter((part) => part.kind === 'markdown').map((part) => String(part.content ?? '')).join('');
};

/** The bot seams over the plugin's connection, which `peer` gives once it is open. */
function botSeams(host: PluginHost, peer: () => Promise<PluginPeer>, timeout: number): BotSeams {
  const ends = turnEnds();
  host.on('turn_end', (event: TurnEndEvent) => { ends.heard(event); });
  const problem = (line: string): void => { host.problem(`${name}: ${line}`); };
  return {
    threads: host.records('webhook-threads'),
    session: async (bot) => {
      const conn = await peer();
      let read: unknown;
      try {
        read = await conn.request('resourceRead', { uri: bot });
      }
      catch (error) {
        problem(`${bot} cannot be read: ${reason(error)}`);
        return undefined;
      }
      try {
        const session = (JSON.parse(String((read as { data?: unknown }).data)) as { session?: unknown }).session;
        return typeof session === 'string' && session !== '' ? session : undefined;
      }
      catch {
        return undefined;
      }
    },
    chat: async (session) => {
      const conn = await peer();
      // A chat is made only in a session the host has loaded, and a subscribe loads it.
      await conn.request('subscribe', { channel: session });
      const chat = `ahp-chat:/${randomUUID()}`;
      await conn.request('createChat', { channel: session, chat });
      return chat;
    },
    send: async (chat, turn, text) => {
      const conn = await peer();
      conn.notify('dispatchAction', {
        channel: chat,
        action: { type: 'chat/turnStarted', turnId: turn, message: { text } },
      });
    },
    ended: async (chat, turn) => {
      const status = await ends.wait(chat, turn);
      const conn = await peer();
      const opened = await conn.request('subscribe', { channel: chat }) as { snapshot?: { state?: unknown } };
      return { status, text: textOf(opened.snapshot?.state, turn) };
    },
    post: async (url, body) => {
      const answered = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!answered.ok) throw new Error(`the callback answered ${answered.status}`);
    },
    syncTimeoutSeconds: timeout,
    problem,
  };
}

export const apply: Plugin['apply'] = (host, options) => {
  const asked = options.syncTimeoutSeconds;
  const timeout = typeof asked === 'number' && asked > 0 ? asked : defaults.syncTimeoutSeconds;

  /** The connection, once the daemon listens and the host has answered `initialize`. */
  let opened: Promise<PluginPeer> | undefined;
  host.on('listening', () => {
    opened = (async () => {
      const conn = host.connect();
      await conn.request('initialize', { clientId: CLIENT, protocolVersions: ['0.9.0'] });
      return conn;
    })();
    opened.catch((error: unknown) => { host.problem(`${name}: the connection to the host failed: ${reason(error)}`); });
  });
  const peer = async (): Promise<PluginPeer> => {
    if (opened === undefined) throw new Error('the plugin has no connection to the host yet');
    return await opened;
  };

  const webhooks = host.records('webhooks');
  host.registerRoute(webhookRoute({
    endpoint: (id) => webhooks.get(id),
    secret: (secret) => host.secret(secret),
    problem: (line) => { host.problem(`${name}: ${line}`); },
    bot: botTarget(botSeams(host, peer, timeout)),
  }));
};
