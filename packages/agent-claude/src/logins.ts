/**
 * The Claude logins one agent runs on, the order a conversation takes them in,
 * and the cooldown a refused one waits out.
 *
 * A login is a token from `claude setup-token`, which signs the CLI in to one
 * Claude account as `CLAUDE_CODE_OAUTH_TOKEN`. A conversation keeps one
 * account while it works, because the prompt cache is the account's, and a
 * refused account rests until its reset while the next one serves.
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
 * sha256("<conversation>\0<login>"), read as a big-endian unsigned integer.
 */
const scoreOf = (key: string, name: string): bigint =>
  createHash('sha256').update(`${key}\0${name}`).digest().readBigUInt64BE(0);

/**
 * The logins in the order one conversation tries them, highest score first.
 *
 * A conversation runs on the login with the highest score, and a refused turn
 * goes to the next one in the order. The order is the same for a conversation
 * every time it is asked and different from one conversation to the next, and
 * adding a login moves only the conversations that score it highest.
 */
export const ordered = (key: string, logins: Login[]): Login[] => logins
  .map((login) => ({ login, score: scoreOf(key, login.name) }))
  .sort((a, b) => (a.score === b.score ? 0 : a.score > b.score ? -1 : 1))
  .map((one) => one.login);

/** A refusal of a login, as the SDK said it: the assistant frame's `error`, and what a `rejected` rate-limit event named. */
export interface Refusal {
  /** `rate_limit` or `billing_error`. */
  error: string;
  /** When the refused window reopens, as the SDK's `resetsAt`. */
  resetsAt?: number;
  /** The window that refused, as the SDK's `rateLimitType`. */
  window?: string;
}

/**
 * How long a refused login cools down when nothing names its reset.
 */
const DEFAULT_COOLDOWN_MS = 10 * 60_000;

/**
 * The longest a named reset is believed, for each window: a guard against a
 * garbage value, per window so a weekly reset is not cut to hours.
 */
const COOLDOWN_CAP_MS: Record<string, number> = {
  five_hour: 6 * 60 * 60_000,
  seven_day: 8 * 24 * 60 * 60_000,
};

/**
 * The SDK's `resetsAt` in epoch milliseconds.
 *
 * The SDK reports seconds and types the field as a bare number, so the unit is
 * read off the value rather than assumed: below 1e11 it is seconds.
 */
const toEpochMs = (value: number | undefined): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return value < 1e11 ? Math.round(value * 1000) : value;
};

/**
 * When a refused login's cooldown ends.
 *
 * A spent quota whose window is `five_hour` or `seven_day` cools down until
 * the reset the refusal names, capped for that window; any other refusal, a
 * billing one among them, cools down for 10 minutes.
 */
export const cooldownUntil = (refusal: Refusal, now: number): number => {
  const reset = refusal.error === 'rate_limit' ? toEpochMs(refusal.resetsAt) : undefined;
  const cap = refusal.window === undefined ? undefined : COOLDOWN_CAP_MS[refusal.window];
  if (reset !== undefined && cap !== undefined && reset > now) return Math.min(reset, now + cap);
  return now + DEFAULT_COOLDOWN_MS;
};

/**
 * The logins of one agent that are cooling down, and until when.
 *
 * The record is in memory, because a restart that forgets a cooldown costs
 * one refusal, which marks the login again. A later mark may make a cooldown
 * longer and never shorter, so two refusals that arrive together keep the
 * later reset. The clock is a parameter, so a test can move it.
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
