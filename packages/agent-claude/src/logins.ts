/**
 * The Claude logins one agent runs on, the order a conversation takes them in,
 * and the cooldown a refused one waits out.
 *
 * A login is a token from `claude setup-token`, which signs the CLI in to one
 * Claude account as `CLAUDE_CODE_OAUTH_TOKEN`. This is meridian's account
 * routing, carried to the backend that starts the CLI: a conversation keeps
 * one account while it works, because the prompt cache is the account's, and a
 * refused account rests until its reset while the next one serves.
 * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/profiles-routing.spec.md
 * https://code.claude.com/docs/en/authentication#generate-a-long-lived-token
 */

import { createHash } from 'node:crypto';
import type { Bag } from '@ahpd/sdk';
import { bag } from '@ahpd/sdk';
import { tokenOf } from './models.js';

/** One login: the name its record gives it, and the token the CLI signs in with. */
export interface Login {
  name: string;
  token: string;
}

/** Whether a value is a token's text or the daemon variable it is read from. */
const isKey = (value: unknown): value is string | { fromEnv: string } =>
  typeof value === 'string'
  || (typeof value === 'object' && value !== null && typeof (value as { fromEnv?: unknown }).fromEnv === 'string');

/**
 * A record's logins, each with its token's text.
 *
 * The channel opens a record with its secrets read, so a token is text here; a
 * preset may still name a daemon variable, which is read as a model source's
 * key is. An entry with no name or no token is left out, and an entry whose
 * name came earlier is the earlier one's, so no login is tried twice.
 */
export const loginsOf = (values: Bag): Login[] => {
  const out: Login[] = [];
  for (const one of Array.isArray(values['logins']) ? values['logins'] : []) {
    const held = bag(one);
    const name = typeof held.name === 'string' ? held.name : '';
    const token = isKey(held.token) ? tokenOf(held.token) ?? '' : '';
    if (name === '' || token === '' || out.some((login) => login.name === name)) continue;
    out.push({ name, token });
  }
  return out;
};

/**
 * One conversation's score for one login: the first 8 bytes of
 * sha256("<conversation>\0<login>"), as meridian scores a session and a profile.
 * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L127-L131
 */
const scoreOf = (key: string, name: string): bigint =>
  createHash('sha256').update(`${key}\0${name}`).digest().readBigUInt64BE(0);

/**
 * The logins in the order one conversation tries them, highest score first.
 *
 * meridian gives a session the profile with the highest score, so its first is
 * meridian's pick; the rest of the order, which is where a refused turn goes
 * next, is ours. It is the same for a conversation every time it is asked and
 * different from one conversation to the next, and adding a login moves only
 * the conversations that score it highest.
 * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L133-L150
 */
export const ordered = (key: string, logins: Login[]): Login[] => logins
  .map((login) => ({ login, score: scoreOf(key, login.name) }))
  .sort((a, b) => (a.score === b.score ? 0 : a.score > b.score ? -1 : 1))
  .map((one) => one.login);

/**
 * The logins of one agent that are cooling down, and until when.
 *
 * meridian's `ProfileExhaustion`: in memory, because a restart that forgets a
 * cooldown costs one refusal, which marks the login again. A later mark may
 * make a cooldown longer and never shorter, so two refusals that arrive
 * together keep the later reset. The clock is a parameter, so a test can move it.
 * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L258-L307
 */
export class Cooldowns {
  private readonly marks = new Map<string, number>();

  /** The clock the cooldowns are read against, in epoch milliseconds. */
  readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** Put a login in a cooldown until `until`, in epoch milliseconds. */
  mark(name: string, until: number): void {
    const held = this.marks.get(name);
    if (held !== undefined && held >= until) return;
    this.marks.set(name, until);
  }

  /** When a login's cooldown ends, or nothing for a login that is not cooling down. */
  until(name: string): number | undefined {
    const held = this.marks.get(name);
    if (held === undefined) return undefined;
    if (held <= this.now()) {
      this.marks.delete(name);
      return undefined;
    }
    return held;
  }

  /** Whether a login is cooling down now. */
  cooling(name: string): boolean {
    return this.until(name) !== undefined;
  }
}
