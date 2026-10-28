import type { Bag } from '@ahpd/sdk';
import { Cooldowns, loginsOf, ordered } from '../logins.js';
import type { Login } from '../logins.js';
import type { SessionContext } from './context.js';

/** What this area offers the rest of the session. */
export interface Logins {
  /**
   * The login the running CLI was started on, or nothing for an agent with no
   * logins, whose CLI signs in as the daemon's does.
   */
  login: Login | undefined;
  /**
   * The cooldowns of this session's agent.
   *
   * One for every session of the agent, handed in by `claude()`, so a login one
   * conversation found refused is not tried by the next.
   */
  cooldowns: Cooldowns;
  /** The login a turn that starts now runs on, from the values it starts with. */
  loginFor: (values: Bag) => Login | undefined;
}

export function createLogins(ctx: SessionContext): Logins {
  const cooldowns = ctx.options.cooldowns ?? new Cooldowns();

  /**
   * The session's own login while it is not cooling down, and otherwise the
   * first in this conversation's order that is not.
   *
   * A conversation stays on its login because the prompt cache is the
   * account's: meridian keeps an existing session on a healthy account and
   * lets only a new one start elsewhere. With every login cooling down, the
   * first in the order is tried anyway, as meridian tries its preferred
   * account, since a cooldown is a guess about an account that may have reset.
   * https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L193-L210
   *
   * The order is the chat's, by its URI: the conversation this CLI carries is
   * that chat, and the URI is what names it again after a restart.
   */
  const loginFor = (values: Bag): Login | undefined => {
    const all = loginsOf(values);
    if (all.length === 0) return undefined;
    const held = ctx.login;
    const kept = held === undefined ? undefined : all.find((one) => one.name === held.name && one.token === held.token);
    if (kept !== undefined && !cooldowns.cooling(kept.name)) return kept;
    const order = ordered(ctx.options.chatUri, all);
    return order.find((one) => !cooldowns.cooling(one.name)) ?? order[0];
  };

  return { login: undefined, cooldowns, loginFor };
}
