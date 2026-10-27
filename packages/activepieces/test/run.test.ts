import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply } from '../src/plugin.js';
import type { Adapter, Connector, PluginHost } from '@ahpd/sdk';

/*
 * One action, run through the adapter the plugin registered.
 *
 * `apply` forks the real child, so a case talks to a real piece in a real
 * process. The host is a stub: it keeps what the plugin registers, and the
 * close it registers is how a case stops the child.
 */

/** The fixture piece, as the child imports it: by its URL. */
const PIECE = pathToFileURL(fileURLToPath(new URL('./fixtures/piece-run.mjs', import.meta.url))).href;

/** What one host kept, for the cases of one plugin. */
interface Kept {
  adapters: Map<string, Adapter>;
  problems: string[];
  closes: (() => void | Promise<void>)[];
}

/** Start the plugin on the fixture piece, and answer what its host kept. */
async function start(): Promise<Kept> {
  const kept: Kept = { adapters: new Map(), problems: [], closes: [] };
  const host = {
    registerAdapter: (adapter: Adapter) => { kept.adapters.set(adapter.name, adapter); },
    registerClose: (close: () => void | Promise<void>) => { kept.closes.push(close); },
    problem: (line: string) => { kept.problems.push(line); },
  } as unknown as PluginHost;
  await apply(host, { pieces: [PIECE] });
  return kept;
}

/** One connector of the fixture piece, with the secret the calls run with. */
const connector = (id: string, secret = 'sk-test'): Connector => ({
  id,
  adapter: 'ap-run',
  owner: 'host',
  config: { secret_text: secret },
});

/** The adapter's `run`, which every case needs. */
function running(kept: Kept): NonNullable<Adapter['run']> {
  const adapter = kept.adapters.get('ap-run');
  if (adapter?.run === undefined) throw new Error('the plugin registered no runnable adapter');
  return adapter.run;
}

let kept: Kept[] = [];
afterEach(async () => {
  for (const one of kept) {
    for (const close of one.closes) await close();
  }
  kept = [];
});

/** One plugin on the fixture piece, kept for the case to stop. */
async function started(): Promise<Kept> {
  const one = await start();
  kept.push(one);
  return one;
}

describe('an action runs in the child', () => {
  it('gives the action the auth and the input, and answers its result', async () => {
    const one = await started();

    expect(one.problems).toEqual([]);
    expect(await running(one)(connector('work'), 'echo', { text: 'hello' })).toEqual({
      text: 'hello',
      auth: { type: 'SECRET_TEXT', secret_text: 'sk-test' },
    });
  });

  it('gives the child none of the daemon\'s secrets', async () => {
    const before = process.env['AHPD_TOKEN'];
    process.env['AHPD_TOKEN'] = 'daemon-token';
    try {
      const one = await started();
      expect(await running(one)(connector('work'), 'env', {})).toEqual({ token: null });
    } finally {
      if (before === undefined) delete process.env['AHPD_TOKEN'];
      else process.env['AHPD_TOKEN'] = before;
    }
  });

  it('answers the message of an action that throws, and nothing else', async () => {
    const one = await started();
    const failed = await running(one)(connector('work'), 'fail', {}).catch((error: unknown) => error);

    expect(failed).toBeInstanceOf(Error);
    expect((failed as Error).message).toBe('the action failed');
    expect((failed as Error).message).not.toContain('sk-test');
  });

  it('fails a call that takes too long, and answers the next one', async () => {
    const one = await started();
    const run = running(one);

    vi.useFakeTimers();
    try {
      // The handler is attached first, so the failure after the clock moves is not unhandled.
      const slow = expect(run(connector('work'), 'slow', {})).rejects.toThrow('the action took longer than 60 seconds');
      await vi.advanceTimersByTimeAsync(60_000);
      await slow;
    } finally {
      vi.useRealTimers();
    }

    expect(await run(connector('work'), 'echo', { text: 'after' })).toMatchObject({ text: 'after' });
  });

  it('starts the child again after it exits', async () => {
    const one = await started();
    const run = running(one);

    expect(await run(connector('work'), 'echo', { text: 'one' })).toMatchObject({ text: 'one' });
    for (const close of one.closes) await close();

    expect(await run(connector('work'), 'echo', { text: 'two' })).toMatchObject({ text: 'two' });
  });

  it('keeps a store value for one connector, and for no other', async () => {
    const one = await started();
    const run = running(one);

    expect(await run(connector('work'), 'remember', { text: 'kept' })).toEqual({ before: null });
    expect(await run(connector('work'), 'recall', {})).toEqual({ text: 'kept' });
    expect(await run(connector('other'), 'recall', {})).toEqual({ text: null });
  });

  it("writes a file into the call's folder, and reads it back by its name", async () => {
    const one = await started();
    const run = running(one);
    const dir = mkdtempSync(join(tmpdir(), 'ahpd-run-'));
    try {
      const written = await run(connector('work'), 'write', { name: 'notes.txt', text: 'hello' }, { files: dir });

      expect(written).toEqual({ path: join(dir, 'notes.txt') });
      expect(readFileSync(join(dir, 'notes.txt'), 'utf8')).toBe('hello');
      expect(await run(connector('work'), 'read', { file: 'notes.txt' }, { files: dir }))
        .toMatchObject({ filename: 'notes.txt', text: 'hello' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a file write when the call names no folder', async () => {
    const one = await started();
    const failed = await running(one)(connector('work'), 'write', { name: 'notes.txt', text: 'hello' })
      .catch((error: unknown) => error);

    expect((failed as Error).message).toBe('this plugin does not offer files');
  });
});
