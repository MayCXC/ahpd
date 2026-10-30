/**
 * Whether one person may use one thing, for the three kinds a policy has.
 *
 * One function, because the check is four steps whatever was asked and a check
 * that grew a rule per kind would be four sets of steps. The `model` kind a
 * proxy call is checked against is decided here too.
 *
 * Nothing here reads a store's `pool` or `cap`, and nothing asks the `usage`
 * port anything: the one row written here is the key's own, out of what the
 * principal reads back, and `charge.ts` is what reads it.
 */

import type { Policies, Policy, PolicyKind } from '../types/policies.js';
import type { Principal } from '../types/users.js';
import type { Scope } from '../usage/scopes.js';

/**
 * What the request named.
 *
 * A field left out was not asked, which is not the same as asking for anything:
 * an `agent` row with `model:` values is a candidate at a session's creation,
 * where no model is asked yet, and is not a candidate for a harness of its own
 * at a turn.
 */
export interface Asked {
  /** `<maker>/<name>`, as a model is named. */
  model?: string;
  /** The proxy provider the call goes through. */
  proxy?: string;
  /** The harness, as `claude`, `pi`, `cofold` or `acp:<server>`. */
  agent?: string;
  /** The machine, as the `computers` port names it. */
  computer?: string;
}

/**
 * Why nothing allowed it.
 *
 * The row and the request as parts, so a caller reads what was asked without
 * taking the sentence apart.
 */
export interface Refusal {
  /** The row that refused it, when a deny did. Nothing when no candidate did. */
  policy?: string;
  /** What was asked about. */
  kind: PolicyKind;
  /** What was asked, as the call named it. */
  asked: Asked;
  /** The sentence, and the whole of the refusal. */
  message: string;
}

/** What the check found, whichever way it went. */
export type Decision =
  | { allowed: true; candidates: Policy[]; refusal?: undefined }
  | { allowed: false; refusal: Refusal; candidates: Policy[] };

/** Every value type there is, in the order a request is read in. */
const VALUES = ['agent', 'model', 'proxy', 'computer'] as const;

/**
 * One value against one written value.
 *
 * `*` stands for any run of characters within the value, the value is matched
 * whole, and no other character is special - which is the whole of the pattern
 * language. A richer one is not offered, because a policy nobody can check by
 * reading it is not one anybody reviews.
 */
const matches = (written: string, value: string): boolean => {
  const escaped = written.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replace(/\*/gu, '.*');
  return new RegExp(`^${escaped}$`, 'u').test(value);
};

/**
 * What the request asked, in the order a sentence reads it.
 *
 * The kind leads and names its own subject, so a computer check says which
 * machine rather than which harness it was about.
 */
const askedFor = (kind: PolicyKind, asked: Asked): string => {
  const lead = `${kind} ${
    kind === 'computer' ? asked.computer ?? '*'
    : kind === 'model' ? asked.model ?? '*'
    : asked.agent ?? '*'
  }`;
  const rest = [
    ...(asked.proxy === undefined ? [] : [`through proxy ${asked.proxy}`]),
    ...(kind !== 'model' && asked.model !== undefined ? [`with model ${asked.model}`] : []),
    ...(kind !== 'computer' && asked.computer !== undefined ? [`on ${asked.computer}`] : []),
  ];
  return [lead, ...rest].join(' ');
};

/**
 * The one row a key's own limits make, or nothing when it has none.
 *
 * A key's limits are a fact about the credential rather than a store's row, so
 * the row is made here from what the principal reads back. It is a `model` row
 * about every model, scoped to the key and marked `cap`, so `chargeFor` counts
 * it, adds its keys and never lets it pay: a call still needs a row that allows
 * it, and the key's row only narrows what that row allowed. Its `pool` is the
 * key's own name, because one key has one total of each measure.
 */
export const keyRowOf = (principal: Principal): Policy | undefined => {
  const id = principal.token;
  const limits = principal.keyLimits;
  // An empty list is no limit at all: `chargeFor` reads a row with no limits as
  // one that takes every measure, which is the opposite of what an empty key is.
  if (id === undefined || limits === undefined || limits.length === 0) return undefined;
  return {
    id: `token:${id}`,
    scope: `token:${id}`,
    kind: 'model',
    effect: 'allow',
    match: { model: ['*'] },
    limits: [...limits],
    cap: true,
    pool: `token:${id}`,
  };
};

/**
 * Whether the row's scope holds this person doing this work.
 *
 * The request's own team and project are what it names or defaults to; a
 * request that names neither is held by `all` and by `user:` rows alone, which
 * is how somebody in no team is covered by a host-wide policy and by nothing
 * else. A `token:` row holds only the key it names, which is the key the call
 * was made with. A team key is no person, so no `user:` row holds it: the
 * team's rows and the host-wide ones do.
 */
export const scoped = (row: Policy, principal: Principal, scope: Scope | undefined): boolean => {
  if (row.scope === 'all') return true;
  const at = row.scope.indexOf(':');
  const what = row.scope.slice(0, at);
  const named = row.scope.slice(at + 1);
  if (what === 'token') return named === principal.token;
  if (what === 'user') return principal.team === undefined && named === principal.id;
  if (what === 'team') return scope !== undefined && scope.team === named;
  // `project:<team>:<project>`, so the second colon is what says which is which.
  const cut = named.indexOf(':');
  return scope !== undefined && scope.project !== undefined
    && scope.team === named.slice(0, cut) && scope.project === named.slice(cut + 1);
};

/** Whether the row is inside its window at that instant. */
const active = (row: Policy, at: string): boolean =>
  (row.from === undefined || at >= row.from) && (row.until === undefined || at < row.until);

/**
 * Whether the row's match holds what was asked.
 *
 * A value type the row names and the request does not is skipped for an allow
 * and fails the match for a deny: an allow is a candidate on what was asked,
 * while a deny binds only when everything it names was asked. A value type
 * neither names leaves it unconstrained, so a `model` row with no `proxy:`
 * values allows any provider. A row about nothing the request asked for is not
 * a candidate at all: an `agent` row of `model:` values alone allows no harness.
 */
const matched = (row: Policy, asked: Asked): boolean => {
  let about = false;
  for (const key of VALUES) {
    const written = row.match[key];
    const value = asked[key];
    if (written === undefined) continue;
    if (value === undefined) {
      if (row.effect === 'deny') return false;
      continue;
    }
    about = true;
    if (!written.some((one) => matches(one, value))) return false;
  }
  return about;
};

/**
 * Whether a person may use one thing, and which rows say so.
 *
 * The four steps: a `*:*` holder is allowed at once and with no candidates
 * read; the candidates are the active rows of that kind whose scope holds the
 * person and whose match holds the request; any matching deny wins; and no
 * candidate at all is a refusal.
 *
 * The candidates come back either way, so a caller that charges the request
 * does not have to read the store a second time. A key's own row is added to
 * the candidates of an allowed `model` decision and never makes one: it is a
 * `cap`, so it only narrows what a store's row allowed, and a `*:*` holder's
 * key carries it alone.
 *
 * `at` is the instant the check compares against, and defaults to now.
 */
export async function decide(
  store: Policies,
  principal: Principal,
  scope: Scope | undefined,
  kind: PolicyKind,
  asked: Asked,
  at: Date = new Date(),
): Promise<Decision> {
  // The key's limits are for the proxy, so they are the `model` kind's row and
  // no other kind's: an agent or a machine is not what a key is spent on.
  const key = kind === 'model' ? keyRowOf(principal) : undefined;
  if (principal.can('*:*')) return { allowed: true, candidates: key === undefined ? [] : [key] };

  const moment = at.toISOString();
  const candidates = (await store.list()).filter((row) =>
    row.kind === kind && active(row, moment) && scoped(row, principal, scope) && matched(row, asked));

  // Any matching deny wins, and the first of them is the one named: the store's
  // order is the order an operator wrote them in, so it is the order a client
  // can show.
  const denied = candidates.find((row) => row.effect === 'deny');
  if (denied !== undefined) {
    return {
      allowed: false,
      refusal: {
        policy: denied.id,
        kind,
        asked,
        message: `${denied.id} refuses ${askedFor(kind, asked)}`,
      },
      candidates,
    };
  }

  if (candidates.length === 0) {
    return {
      allowed: false,
      refusal: {
        kind,
        asked,
        message: `no policy allows ${askedFor(kind, asked)}`,
      },
      candidates,
    };
  }

  return { allowed: true, candidates: key === undefined ? candidates : [...candidates, key] };
}