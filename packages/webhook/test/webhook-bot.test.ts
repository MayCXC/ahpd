import { describe, expect, it } from 'vitest';
import { memoryRecords } from '../../sdk/src/records.js';
import { botTarget, turnEnds } from '../src/bot.js';
import { checkEndpoint } from '../src/record.js';
import type { BotSeams, TurnEnd } from '../src/bot.js';
import type { Endpoint } from '../src/record.js';

/*
 * The bot target, over stub seams.
 *
 * The seams stand for the plugin's connection to its host: which session a bot
 * is linked to, a new chat in it, a turn sent there, and that turn's end. What
 * is checked is the thread map the target keeps, and what each reply mode
 * answers and posts.
 */

const URL_OF = 'http://127.0.0.1:1/plugins/%40ahpd/webhook/ci';

/** One turn the target sent, in the order it sent them. */
interface Sent { chat: string; turn: string; text: string }

/**
 * A target over stub seams, with what each seam was asked.
 *
 * A turn ends when the case says so with `finish`, or at once when `auto` is
 * set, with the text `echo: <what was sent>`.
 */
async function made(options: { auto?: boolean; sessions?: Record<string, string>; timeout?: number } = {}) {
  const threads = await memoryRecords().collection('webhook-threads');
  const chats: { session: string; chat: string }[] = [];
  const sent: Sent[] = [];
  const posted: { url: string; body: Record<string, unknown> }[] = [];
  const problems: string[] = [];
  const waiting = new Map<string, (end: TurnEnd) => void>();
  const sessions = options.sessions ?? { 'bot://motion': 'ahp-session:/motion' };
  const seams: BotSeams = {
    threads,
    session: async (bot) => sessions[bot],
    chat: async (session) => {
      // A yield, so two first calls of one thread overlap here.
      await new Promise((r) => { setTimeout(r, 5); });
      const chat = `ahp-chat:/c${chats.length + 1}`;
      chats.push({ session, chat });
      return chat;
    },
    send: async (chat, turn, text) => {
      sent.push({ chat, turn, text });
      if (options.auto === true) waiting.get(turn)?.({ status: 'complete', text: `echo: ${text}` });
    },
    ended: (_chat, turn) => new Promise<TurnEnd>((resolve) => { waiting.set(turn, resolve); }),
    post: async (url, body) => { posted.push({ url, body }); },
    syncTimeoutSeconds: options.timeout ?? 60,
    problem: (line) => { problems.push(line); },
  };
  const target = botTarget(seams);
  /** End the turn the target sent `n`th, counted from 0. */
  const finish = (n: number, text: string, status: TurnEnd['status'] = 'complete', error?: string): void => {
    const turn = sent[n]?.turn ?? '';
    waiting.get(turn)?.({ status, text, ...(error === undefined ? {} : { error }) });
  };
  return { target, threads, chats, sent, posted, problems, finish };
}

/** An endpoint as the route hands it over: checked. */
const endpoint = (fields: Record<string, unknown> = {}): Endpoint => checkEndpoint({
  id: 'ci', bot: 'bot://motion', secret: 'host:ci-hook', reply: 'none', ...fields,
});

/** One call, with a JSON body, or a text body when `body` is a string. */
const call = (body: unknown, query = ''): Request => new Request(`${URL_OF}${query}`, {
  method: 'POST',
  ...(typeof body === 'string'
    ? { body, headers: { 'content-type': 'text/plain' } }
    : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
});

/** Let what the target does after it answered run, such as a callback. */
const settle = () => new Promise((r) => { setTimeout(r, 10); });

describe('the thread map', () => {
  it('makes one chat and keeps one thread record on a first call', async () => {
    const { target, threads, chats, sent } = await made();
    const answer = await target(endpoint(), call({ thread: 'pr-12', text: 'hello' }));
    expect(answer.status).toBe(202);
    expect(chats).toEqual([{ session: 'ahp-session:/motion', chat: 'ahp-chat:/c1' }]);
    expect(sent.map((one) => [one.chat, one.text])).toEqual([['ahp-chat:/c1', 'hello']]);
    const kept = await threads.list();
    expect(kept).toHaveLength(1);
    expect(kept[0]).toMatchObject({ endpoint: 'ci', thread: 'pr-12', session: 'ahp-session:/motion', chat: 'ahp-chat:/c1' });
    expect(String(kept[0]?.id)).toMatch(/^t-[0-9a-f-]{36}$/);
  });

  it('sends a second call on the same thread in the same chat', async () => {
    const { target, chats, sent } = await made();
    await target(endpoint(), call({ thread: 'pr-12', text: 'one' }));
    await target(endpoint(), call({ thread: 'pr-12', text: 'two' }));
    expect(chats).toHaveLength(1);
    expect(sent.map((one) => one.chat)).toEqual(['ahp-chat:/c1', 'ahp-chat:/c1']);
    expect(sent[0]?.turn).not.toBe(sent[1]?.turn);
  });

  it('makes another chat for another thread', async () => {
    const { target, chats, sent } = await made();
    await target(endpoint(), call({ thread: 'pr-12', text: 'one' }));
    await target(endpoint(), call({ thread: 'pr-13', text: 'two' }));
    expect(chats.map((one) => one.chat)).toEqual(['ahp-chat:/c1', 'ahp-chat:/c2']);
    expect(sent.map((one) => one.chat)).toEqual(['ahp-chat:/c1', 'ahp-chat:/c2']);
  });

  it('makes one chat for two first calls of one thread at the same time', async () => {
    const { target, threads, chats, sent } = await made();
    const answers = await Promise.all([
      target(endpoint(), call({ thread: 'pr-12', text: 'one' })),
      target(endpoint(), call({ thread: 'pr-12', text: 'two' })),
    ]);
    expect(answers.map((one) => one.status)).toEqual([202, 202]);
    expect(chats).toHaveLength(1);
    expect(sent.map((one) => one.chat)).toEqual(['ahp-chat:/c1', 'ahp-chat:/c1']);
    expect(await threads.list()).toHaveLength(1);
  });

  it('sends the text of a JSON body in the chat of its thread', async () => {
    const { target, sent } = await made();
    await target(endpoint(), call({ thread: 'pr-12', text: 'from json' }, '?thread=other'));
    expect(sent.map((one) => one.text)).toEqual(['from json']);
    const again = await target(endpoint(), call({ thread: 'pr-12', text: 'again' }));
    expect(again.status).toBe(202);
    expect(sent[1]?.chat).toBe(sent[0]?.chat);
  });

  it('sends a plain text body as the text, in the chat of the thread query value', async () => {
    const { target, sent, threads } = await made();
    expect((await target(endpoint(), call('the build broke', '?thread=pr-12'))).status).toBe(202);
    expect(sent.map((one) => one.text)).toEqual(['the build broke']);
    expect((await threads.list())[0]).toMatchObject({ thread: 'pr-12' });
  });

  it('sends a JSON body with no string text as the whole text, with the thread from the query', async () => {
    const { target, sent, threads } = await made();
    const body = { event: 'push', ref: 'main' };
    expect((await target(endpoint(), call(body, '?thread=pushes'))).status).toBe(202);
    expect(sent.map((one) => one.text)).toEqual([JSON.stringify(body)]);
    expect((await threads.list())[0]).toMatchObject({ thread: 'pushes' });
  });

  it('answers 400 to a call with no thread id, or with no text', async () => {
    const { target, sent } = await made();
    expect((await target(endpoint(), call({ text: 'hello' }))).status).toBe(400);
    expect((await target(endpoint(), call('', '?thread=pr-12'))).status).toBe(400);
    expect((await target(endpoint(), call({ thread: 'pr-12', text: '' }))).status).toBe(400);
    expect(sent).toEqual([]);
  });

  it('answers 409 when the bot has no session', async () => {
    const { target, sent } = await made({ sessions: {} });
    const answer = await target(endpoint(), call({ thread: 'pr-12', text: 'hello' }));
    expect(answer.status).toBe(409);
    expect(sent).toEqual([]);
  });
});

describe('the reply modes', () => {
  it('answers 202 and posts nothing with reply none', async () => {
    const { target, posted, finish } = await made();
    const answer = await target(endpoint({ reply: 'none' }), call({ thread: 'pr-12', text: 'hello', callback: 'https://ci.example.com/x' }));
    expect(answer.status).toBe(202);
    finish(0, 'done');
    await settle();
    expect(posted).toEqual([]);
  });

  it('answers 202 with reply callback, and posts the text at the turn end', async () => {
    const { target, posted, sent, finish } = await made();
    const answer = await target(
      endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/hooks/' }),
      call({ thread: 'pr-12', text: 'hello', callback: 'https://ci.example.com/hooks/pr-12' }),
    );
    expect(answer.status).toBe(202);
    expect(await answer.json()).toMatchObject({ thread: 'pr-12', turn: sent[0]?.turn });
    expect(posted).toEqual([]);
    finish(0, 'all green');
    await settle();
    expect(posted).toEqual([{
      url: 'https://ci.example.com/hooks/pr-12',
      body: { thread: 'pr-12', turn: sent[0]?.turn, status: 'complete', text: 'all green' },
    }]);
  });

  it('takes the callback URL from the query when the body is text', async () => {
    const { target, posted, finish } = await made();
    const answer = await target(
      endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/hooks/' }),
      call('hello', `?thread=pr-12&callback=${encodeURIComponent('https://ci.example.com/hooks/a')}`),
    );
    expect(answer.status).toBe(202);
    finish(0, 'ok');
    await settle();
    expect(posted.map((one) => one.url)).toEqual(['https://ci.example.com/hooks/a']);
  });

  it('answers 400 and sends no turn for a callback URL outside the prefix', async () => {
    const { target, sent } = await made();
    const answer = await target(
      endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/hooks/' }),
      call({ thread: 'pr-12', text: 'hello', callback: 'https://ci.example.com/other/pr-12' }),
    );
    expect(answer.status).toBe(400);
    expect(sent).toEqual([]);
  });

  it('answers 400 for a callback URL on another host with the same leading text', async () => {
    const { target, sent } = await made();
    const near = endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/' });
    for (const callback of ['https://ci.example.com.evil.test/x', 'https://ci.example.com@evil.test/x', 'not a url']) {
      expect((await target(near, call({ thread: 'pr-12', text: 'hello', callback }))).status).toBe(400);
    }
    expect(sent).toEqual([]);
  });

  it('answers 400 to a callback call on an endpoint with no prefix, or with no callback URL', async () => {
    const { target, sent } = await made();
    expect((await target(endpoint({ reply: 'callback' }), call({ thread: 'pr-12', text: 'hello', callback: 'https://ci.example.com/x' }))).status).toBe(400);
    expect((await target(endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/' }), call({ thread: 'pr-12', text: 'hello' }))).status).toBe(400);
    expect(sent).toEqual([]);
  });

  it('answers 200 with the text of the turn with reply sync', async () => {
    const { target, sent } = await made({ auto: true });
    const answer = await target(endpoint({ reply: 'sync' }), call({ thread: 'pr-12', text: 'hello' }));
    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ thread: 'pr-12', turn: sent[0]?.turn, status: 'complete', text: 'echo: hello' });
  });

  it('answers 200 with status error and the message when a sync turn fails', async () => {
    const { target, sent, finish } = await made();
    const pending = target(endpoint({ reply: 'sync' }), call({ thread: 'pr-12', text: 'hello' }));
    setTimeout(() => { finish(0, 'half', 'error', 'the model refused'); }, 10);
    const answer = await pending;
    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ thread: 'pr-12', turn: sent[0]?.turn, status: 'error', text: 'half', error: 'the model refused' });
  });

  it('posts status error and the message to the callback when the turn fails', async () => {
    const { target, posted, sent, finish } = await made();
    const answer = await target(
      endpoint({ reply: 'callback', callbackPrefix: 'https://ci.example.com/hooks/' }),
      call({ thread: 'pr-12', text: 'hello', callback: 'https://ci.example.com/hooks/pr-12' }),
    );
    expect(answer.status).toBe(202);
    finish(0, '', 'error', 'the model refused');
    await settle();
    expect(posted).toEqual([{
      url: 'https://ci.example.com/hooks/pr-12',
      body: { thread: 'pr-12', turn: sent[0]?.turn, status: 'error', text: '', error: 'the model refused' },
    }]);
  });

  it('answers 202 with status running when a sync turn outlives the timeout, and leaves the turn alone', async () => {
    const { target, sent, posted } = await made({ timeout: 0.02 });
    const answer = await target(endpoint({ reply: 'sync' }), call({ thread: 'pr-12', text: 'hello' }));
    expect(answer.status).toBe(202);
    expect(await answer.json()).toEqual({ thread: 'pr-12', turn: sent[0]?.turn, status: 'running' });
    // Nothing more is sent: no cancel, and no second turn.
    expect(sent).toHaveLength(1);
    expect(posted).toEqual([]);
  });

  it('waits for the plugin option when the endpoint names no timeout', async () => {
    const { target, finish } = await made({ timeout: 0.2 });
    const pending = target(endpoint({ reply: 'sync' }), call({ thread: 'pr-12', text: 'hello' }));
    setTimeout(() => { finish(0, 'in time'); }, 50);
    const answer = await pending;
    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({ text: 'in time' });
  });

  it('takes the endpoint timeout over the plugin option', async () => {
    const { target, finish } = await made({ timeout: 0.02 });
    const pending = target(endpoint({ reply: 'sync', syncTimeoutSeconds: 1 }), call({ thread: 'pr-12', text: 'hello' }));
    setTimeout(() => { finish(0, 'in time'); }, 60);
    const answer = await pending;
    expect(answer.status).toBe(200);

    const { target: short } = await made({ timeout: 60 });
    const quick = await short(endpoint({ reply: 'sync', syncTimeoutSeconds: 0.02 }), call({ thread: 'pr-12', text: 'hello' }));
    expect(quick.status).toBe(202);
  });
});

it('hears a turn that ended in an error, with its message', async () => {
  const ends = turnEnds();
  const waited = ends.wait('ahp-chat:/c1', 't1');
  ends.heard({ chat: 'ahp-chat:/c1', turn: 't1', status: 'error', error: 'the model refused' });
  expect(await waited).toEqual({ status: 'error', error: 'the model refused' });
});

it('gives the plugin option syncTimeoutSeconds a default of 60', async () => {
  const { defaults, optionsSchema } = await import('../src/plugin.js');
  expect(defaults.syncTimeoutSeconds).toBe(60);
  expect(optionsSchema.properties).toHaveProperty('syncTimeoutSeconds');
});
