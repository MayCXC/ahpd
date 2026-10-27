import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fileSessions, memorySessions } from '../src/sessions/sessions.js';
import { createLocalTurns } from '../src/host/localturns.js';
import type { HostContext } from '../src/host/context.js';
import type { SessionStore } from '../src/types/sessions.js';
import type { Bag } from '@ahpd/sdk';

/*
 * The area that keeps a chat's local turns, alone: where a file goes, what a
 * read skips, the turn a cut goes to and the name an anchor is written under.
 * `host-local-turns.test.ts` drives the same area through a host.
 */

let made: string[] = [];
afterEach(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
  made = [];
});

const LIVE = 'echo:/live';
const PEER = 'ahp-chat:/3f0c6a52-9a43-4d0e-a2b1-6b1f7c1d5e10';
const TAIL = 'ahp-chat:/tail';

/** The area alone, on a store with a folder. */
const area = () => {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-localturns-'));
  made.push(dir);
  const store = fileSessions({ dir: join(dir, 'sessions') });
  return { store, turns: createLocalTurns({ kept: store, log: () => {} } as unknown as HostContext) };
};

/** Every local turn a session's folder keeps, as the files hold them, in `seq` order. */
const keptIn = (store: SessionStore, id: string): Bag[] => {
  const folder = store.attachmentsDir?.(id);
  const turns = folder === undefined ? undefined : join(folder, 'turns');
  if (turns === undefined || !existsSync(turns)) return [];
  return readdirSync(turns, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(turns, name), 'utf8')) as Bag)
    .sort((a, b) => Number(a.seq) - Number(b.seq));
};

/** A turn as a chat holds it. */
const said = (id: string, text: string): Bag => ({
  id,
  message: { text, origin: { kind: 'user' } },
  state: 'complete',
  responseParts: [{ kind: 'markdown', id: `${id}:0`, content: text }],
});

describe('the local turns of a chat', () => {
  it('skips a file another version wrote, and one whose turn a client could not read', () => {
    const { store, turns } = area();
    const all = [said('t1', 'hello'), said('t2', '!echo kept'), said('t3', '!echo broken'), said('t4', '!echo old')];
    for (const at of [2, 3, 4]) turns.keepLocalTurn(LIVE, PEER, all.slice(0, at), String(all[at - 1]?.id));
    const folder = join(String(store.attachmentsDir?.('live')), 'turns');
    for (const name of readdirSync(folder, { recursive: true, encoding: 'utf8' }).filter((one) => one.endsWith('.json'))) {
      const path = join(folder, name);
      const held = JSON.parse(readFileSync(path, 'utf8')) as Bag;
      if (held.turnId === 't3') writeFileSync(path, JSON.stringify({ ...held, turn: { ...(held.turn as Bag), state: undefined } }));
      if (held.turnId === 't4') writeFileSync(path, JSON.stringify({ ...held, version: 2 }));
    }
    expect(turns.withLocalTurns(LIVE, PEER, [said('t1', 'hello')]).map((turn) => turn.id)).toEqual(['t1', 't2']);
  });

  it('answers the turn a cut goes to: itself, or the nearest earlier one of the backend\'s', () => {
    const { turns } = area();
    const all = [said('t1', 'hello'), said('t2', '!echo one'), said('t3', '!echo two')];
    turns.keepLocalTurn(LIVE, PEER, all.slice(0, 2), 't2');
    turns.keepLocalTurn(LIVE, PEER, all, 't3');
    expect(turns.concreteTurnOf(LIVE, PEER, all, 0)).toBe('t1');
    expect(turns.concreteTurnOf(LIVE, PEER, all, 2)).toBe('t1');
    const alone = [said('t9', '!echo alone')];
    turns.keepLocalTurn(LIVE, TAIL, alone, 't9');
    expect(turns.concreteTurnOf(LIVE, TAIL, alone, 0)).toBeUndefined();
  });

  it('keeps nothing on a store that keeps no folder', () => {
    const turns = createLocalTurns({ kept: memorySessions(), log: () => {} } as unknown as HostContext);
    const all = [said('t1', 'hello'), said('t2', '!echo nowhere')];
    turns.keepLocalTurn(LIVE, PEER, all, 't2');
    expect(turns.withLocalTurns(LIVE, PEER, [said('t1', 'hello')]).map((turn) => turn.id)).toEqual(['t1']);
    expect(turns.concreteTurnOf(LIVE, PEER, all, 1)).toBe('t2');
  });

  it('names an anchor by the transcript id its backend gave it, and a fork carries the name', () => {
    const { store, turns } = area();
    turns.turnRecordedAs(PEER, 't1', 'cli-uuid-1');
    turns.keepLocalTurn(LIVE, PEER, [said('t1', 'hello'), said('t2', '!echo kept')], 't2');
    expect(keptIn(store, 'live').map((one) => one.anchor)).toEqual(['cli-uuid-1']);
    turns.copyLocalTurns(LIVE, PEER, TAIL, [said('t1', 'hello'), said('t2', '!echo kept')]);
    turns.keepLocalTurn(LIVE, TAIL, [said('t1', 'hello'), said('t2', '!echo kept'), said('t5', 'more'), said('t6', '!echo late')], 't6');
    expect(keptIn(store, 'live').map((one) => one.anchor)).toEqual(['cli-uuid-1', 'cli-uuid-1', 't5']);
    const later = [said('t1', 'hello'), said('t2', '!echo kept'), said('t7', '!echo after the copy')];
    turns.keepLocalTurn(LIVE, TAIL, later, 't7');
    expect(keptIn(store, 'live').at(-1)?.anchor).toBe('cli-uuid-1');
  });
});
