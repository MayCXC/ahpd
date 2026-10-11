/*
 * A sleeping session wakes when something needs it.
 *
 * `wake` is the one way a session that is not live comes back, resumed in
 * place with its earlier conversation. A prompt, a pinned automation and a
 * child's `childFinished` each call it, and wakers that arrive together share
 * one resume.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { memoryAutomations } from '../src/automations.js';
import { createHost } from '../src/host.js';
import { memorySessions } from '../src/sessions.js';
import { echo } from '../../../examples/echo/agent.js';
import type { Agent, Start } from '../src/types/agent.js';
import type { AutomationStore } from '../src/types/automations.js';
import type { Bag } from '../src/types/common.js';
import type { Session } from '../src/types/session.js';
import type { Peer } from '../src/types/rpc.js';

let made: string[] = [];
afterEach(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
  made = [];
});

const temp = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-wake-'));
  made.push(dir);
  return dir;
};

/** A client, keeping each notification it was sent. */
const peer = (): Peer & { notes: Bag[] } => {
  const notes: Bag[] = [];
  return {
    notes,
    send: () => {},
    notify: (method, params) => { notes.push({ method, ...(params as Bag) }); },
    request: async () => ({}),
    answered: () => {},
    close: () => {},
  };
};

const settle = async (times = 8): Promise<void> => {
  for (let i = 0; i < times; i++) await new Promise((r) => { setTimeout(r, 0); });
};

const until = async (ready: () => boolean | Promise<boolean>, what: string, tries = 400): Promise<void> => {
  for (let i = 0; i < tries; i++) {
    if (await ready()) return;
    await settle(1);
  }
  throw new Error(`${what} never happened`);
};

/** What the backend was asked for, and what a case makes it refuse. */
interface Counts {
  /** Each session start, with the backend id it resumed or none. */
  starts: (string | undefined)[];
  closes: number;
  /** Whether a resume throws, as a backend that cannot load the conversation does. */
  failResume?: boolean;
}

/** The echo backend, counting the sessions it starts and resumes. */
const counted = (dir: string, counts: Counts): Agent => {
  const base = echo({ path: dir, pace: 0 });
  return {
    ...base,
    create: (start: Start): Session => {
      if (start.resume !== undefined && counts.failResume === true) throw new Error('The conversation could not be loaded');
      counts.starts.push(start.resume);
      const session = base.create(start);
      return {
        ...session,
        close: (removing?: boolean) => {
          counts.closes += 1;
          return session.close(removing);
        },
      };
    },
  };
};

/** A clock a case moves, as in `session-sleep.test.ts`. */
const clock = () => {
  let at = Date.parse('2026-10-10T12:00:00Z');
  const armed: (() => void)[] = [];
  return {
    now: (): Date => new Date(at),
    timer: (fire: () => void): { cancel(): void } => {
      armed.push(fire);
      return { cancel: () => { const i = armed.indexOf(fire); if (i >= 0) armed.splice(i, 1); } };
    },
    pass: (minutes: number): void => {
      at += minutes * 60_000;
      for (const fire of armed.splice(0)) fire();
    },
  };
};

async function serving(counts: Counts, automations?: AutomationStore) {
  const dir = temp();
  const time = clock();
  const kept = memorySessions();
  const host = createHost({
    path: dir,
    agents: [counted(dir, counts)],
    sessions: kept,
    now: time.now,
    timer: time.timer,
    ...(automations === undefined ? {} : { automations }),
  });
  const p = peer();
  const client = host.accept(p);
  await client.handle({
    method: 'initialize',
    params: { clientId: 'window', protocolVersions: ['0.9.0'], initialSubscriptions: ['ahp-root://'] },
  });

  const read = async (channel: string): Promise<Bag> =>
    ((await client.handle({ method: 'subscribe', params: { channel } })) as { snapshot: { state: Bag } }).snapshot.state;
  const active = async (): Promise<number> => Number((await read('ahp-root://')).activeSessions);
  const turnsOf = async (chat: string): Promise<Bag[]> => (await read(chat)).turns as Bag[];

  let seq = 0;
  const prompt = (chat: string, text: string): Promise<unknown> => {
    seq += 1;
    return client.handle({
      method: 'dispatchAction',
      params: { channel: chat, clientSeq: seq, action: { type: 'chat/turnStarted', turnId: `t${String(seq)}`, message: { text } } },
    });
  };

  /** A session with one finished turn. */
  const open = async (name: string) => {
    const channel = `ahp-session:/${name}`;
    await client.handle({ method: 'createSession', params: { channel, provider: 'echo' } });
    const chat = String((await read(channel)).defaultChat);
    await prompt(chat, `hello ${name}`);
    await until(async () => (await turnsOf(chat)).length === 1, `the first turn of ${name}`);
    return { channel, resource: `echo:/${name}`, chat };
  };

  /** Stop watching a session and its chat, and let the sweep sleep it. */
  const sleep = async (session: { channel: string; chat: string }): Promise<void> => {
    const before = counts.closes;
    await client.handle({ method: 'unsubscribe', params: { channel: session.chat } });
    await client.handle({ method: 'unsubscribe', params: { channel: session.channel } });
    time.pass(31);
    await until(() => counts.closes > before, 'the sleep');
  };

  return { host, client, peer: p, kept, open, sleep, prompt, read, active, turnsOf, dir };
}

/** One automation that runs pinned to `session`. */
const pinnedTo = (dir: string, session: string): Bag => ({
  title: 'Check in',
  enabled: true,
  message: { text: 'check in' },
  session: { provider: 'echo', workingDirectories: [`file://${dir}`] },
  triggers: [{ id: 't1', kind: 'event', type: 'session', title: 'When a turn fails', events: [{ id: 'turnFailed' }], config: {} }],
  _meta: { ahpd: { session: 'pinned', pinnedSession: session } },
});

it('wakes a sleeping session on a prompt and answers with the earlier conversation', async () => {
  const counts: Counts = { starts: [], closes: 0 };
  const { open, sleep, prompt, active, turnsOf } = await serving(counts);
  const one = await open('one');
  await sleep(one);
  expect(await active()).toBe(0);

  await prompt(one.chat, 'again');
  await until(async () => (await turnsOf(one.chat)).length === 2, 'the woken turn');
  expect(await active()).toBe(1);
  // Resumed as the conversation it was, not started afresh.
  expect(counts.starts).toEqual([undefined, 'one']);
  const turns = await turnsOf(one.chat);
  expect(turns.map((turn) => (turn.message as Bag).text)).toEqual(['hello one', 'again']);
});

it('wakes a pinned session for an automation run and makes no new session', async () => {
  const counts: Counts = { starts: [], closes: 0 };
  const store = memoryAutomations();
  const { client, open, sleep, active, turnsOf, dir } = await serving(counts, store);
  const one = await open('one');
  await sleep(one);
  store.create('ahp-automation:/check', pinnedTo(dir, one.resource));

  await client.handle({ method: 'runAutomation', params: { channel: 'ahp-automations://', automation: 'ahp-automation:/check', requestId: 'r' } });
  await until(() => (store.get('ahp-automation:/check')?.runs ?? []).length === 1, 'the run');
  const run = (store.get('ahp-automation:/check')?.runs ?? [])[0] as unknown as Bag;
  expect(run.primarySession).toBe(one.resource);
  expect(counts.starts).toEqual([undefined, 'one']);
  await until(async () => (await turnsOf(one.chat)).length === 2, 'the run\'s turn');
  expect(await active()).toBe(1);
});

it('wakes a parent for a child\'s childFinished', async () => {
  const counts: Counts = { starts: [], closes: 0 };
  const { open, sleep, prompt, active, kept } = await serving(counts);
  const parent = await open('parent');
  await sleep(parent);
  const child = await open('child');
  kept.setParent?.('child', 'parent');
  expect(await active()).toBe(1);

  // The child's turn ends with nothing behind it, which is what its parent waits to hear.
  await prompt(child.chat, 'done');
  await until(async () => await active() === 2, 'the parent waking');
  expect(counts.starts).toEqual([undefined, undefined, 'parent']);
});

it('resumes once when two wakers arrive together', async () => {
  const counts: Counts = { starts: [], closes: 0 };
  const store = memoryAutomations();
  const { client, open, sleep, prompt, active, dir } = await serving(counts, store);
  const one = await open('one');
  await sleep(one);
  store.create('ahp-automation:/check', pinnedTo(dir, one.resource));

  await Promise.all([
    prompt(one.chat, 'again'),
    client.handle({ method: 'runAutomation', params: { channel: 'ahp-automations://', automation: 'ahp-automation:/check', requestId: 'r' } }),
  ]);
  await until(() => (store.get('ahp-automation:/check')?.runs ?? []).length === 1, 'the run');
  await settle();
  expect(counts.starts).toEqual([undefined, 'one']);
  expect(await active()).toBe(1);
});

it('fails the action with the resume error when a session cannot resume', async () => {
  const counts: Counts = { starts: [], closes: 0 };
  const { open, sleep, prompt, active, peer: p } = await serving(counts);
  const one = await open('one');
  await sleep(one);

  counts.failResume = true;
  await prompt(one.chat, 'again');
  await until(() => p.notes.some((note) => note.rejectionReason !== undefined), 'the refusal');
  const refused = p.notes.find((note) => note.rejectionReason !== undefined) as Bag;
  expect(refused.rejectionReason).toBe('The conversation could not be loaded');
  // Left as it was: asleep, and still a session a later prompt can wake.
  expect(await active()).toBe(0);
  counts.failResume = false;
  await prompt(one.chat, 'once more');
  await until(async () => await active() === 1, 'the later wake');
});
