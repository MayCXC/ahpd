/**
 * The Claude logins one agent runs on, the order a conversation takes them in,
 * and the cooldown a refused one waits out.
 *
 * A login is a connector of the adapter `claude-login`, holding a token from
 * `claude setup-token`, which signs the CLI in to one Claude account as
 * `CLAUDE_CODE_OAUTH_TOKEN`. A conversation keeps one account while it works,
 * because the prompt cache is the account's, and a refused account rests until
 * its reset while the next one serves.
 * https://code.claude.com/docs/en/authentication#generate-a-long-lived-token
 */

import { createHash } from 'node:crypto';
import type { Bag, Connector, ConnectorOwner } from '@ahpd/sdk';
import { sameOwnerOrHost } from '@ahpd/sdk';

/** The adapter whose connectors are Claude logins. */
export const LOGIN_ADAPTER = 'claude-login';

/** One open login: whose it is, and the token the CLI signs in with. */
export interface OpenLogin {
  owner: ConnectorOwner;
  token: string;
}

/**
 * The open logins of one load of this plugin, by connector id.
 *
 * A login is a connector of the adapter `claude-login`: one Claude account's
 * token, kept in the host's vault and handed to the adapter's `open` with the
 * secret read back. The adapter keeps it here until the connector closes, so a
 * put that replaces the token, and a remove, reach a session at its next turn.
 */
export class OpenLogins {
  private readonly open = new Map<string, OpenLogin>();

  /**
   * Keep one connector's token, as the adapter's `open` is handed it, and
   * answer the connector's stop, which forgets it.
   */
  opened(connector: Connector): () => void {
    const token = connector.config['token'];
    if (typeof token !== 'string' || token === '') throw new Error(`${connector.id} holds no token`);
    this.open.set(connector.id, { owner: connector.owner, token });
    return () => { this.open.delete(connector.id); };
  }

  /** The login an open connector holds, or nothing for an id that is not open. */
  held(id: string): OpenLogin | undefined {
    return this.open.get(id);
  }

  /**
   * The token of an open login an agent of this owner may run on: the owner's
   * own, or the host's.
   *
   * The agents channel asks the same of a record when it is put, and a turn
   * asks again: a record read back at a start was never checked, and the rule
   * is the one a session's bindings and an automation's trigger are held to.
   */
  usable(id: string, owner: ConnectorOwner): string | undefined {
    const held = this.open.get(id);
    if (held === undefined) return undefined;
    return sameOwnerOrHost(held.owner, owner === 'host' ? undefined : owner) ? held.token : undefined;
  }
}

/** The logins of one agent, as each of its sessions reads them. */
export interface AgentLogins {
  /** The logins this plugin keeps open, by connector id. */
  open: OpenLogins;
  /** Whose agent it is, read at each turn: a login is one this owner may use. */
  owner: () => ConnectorOwner;
}

/** One login: its connector's id, and the token the CLI signs in with. */
export interface Login {
  id: string;
  token: string;
}

/**
 * A record's logins, each with its connector's token.
 *
 * The record names each by the id of a `claude-login` connector, and the token
 * is the one that connector holds open. A login whose connector is not open,
 * or is neither the agent owner's nor the host's, is left out, and an id named
 * twice is the first one, so no login is tried twice.
 */
export const loginsOf = (values: Bag, logins: AgentLogins | undefined): Login[] => {
  const out: Login[] = [];
  if (logins === undefined) return out;
  for (const one of Array.isArray(values['logins']) ? values['logins'] : []) {
    const id = typeof one === 'string' ? one : '';
    const token = id === '' ? undefined : logins.open.usable(id, logins.owner());
    if (token === undefined || out.some((login) => login.id === id)) continue;
    out.push({ id, token });
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
  .map((login) => ({ login, score: scoreOf(key, login.id) }))
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
