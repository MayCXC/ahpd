import type { Bag } from '@ahpd/sdk';
import { forgetSession } from '../catalog.js';
import { Cooldowns, cooldownUntil, loginsOf, ordered } from '../logins.js';
import type { Login, Refusal } from '../logins.js';
import { bag, list, str } from './common.js';
import type { SessionContext } from './context.js';
import { failureOf } from './failure.js';

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
  /** A `rate_limit_event` from the CLI, kept for the refusal it announces. */
  limited: (info: Bag) => void;
  /**
   * Whether an assistant frame is a refusal the running turn moves on from.
   *
   * Such a frame is the CLI's own words for a request that never reached a
   * model, and the turn runs again elsewhere, so it is not shown.
   */
  refused: (message: Bag) => boolean;
  /** Whether the running turn is moving to another login, so its `result` ends nothing. */
  moving: () => boolean;
  /** Run the refused turn again on the next login, or wait for one to come back. */
  moveOn: () => Promise<void>;
  /** End a move or a wait, for a turn that was stopped. */
  stopMoving: () => void;
  /**
   * Whether a query is the CLI a move closed and has not replaced yet.
   *
   * A start-over waits for that CLI to exit and deletes its conversation before
   * the next CLI exists, so the end of its frames is the move's own doing.
   */
  replacing: (handle: unknown) => boolean;
}

/**
 * The refusals that move a turn to another login.
 *
 * A spent quota and a billing refusal are the account's own; another account
 * may well be able to serve. An authentication failure is not one of them,
 * and neither is anything an account does not decide, which the CLI retries
 * by itself.
 */
const MOVES = new Set(['rate_limit', 'billing_error']);

/** Whether a turn is a `!` command's, which ran on no CLI. */
const isCommand = (turn: Bag): boolean => list(turn.responseParts)
  .some((part) => str(bag(bag(part).toolCall).toolCallId) === `${String(turn.id)}:command`);

export function createLogins(ctx: SessionContext): Logins {
  const cooldowns = ctx.options.cooldowns ?? new Cooldowns();

  /**
   * The session's own login while it is not cooling down, and otherwise the
   * first in this conversation's order that is not.
   *
   * A conversation stays on its login because the prompt cache is the
   * account's: an existing session stays on a healthy account and only a new
   * one starts elsewhere. With every login cooling down, the first in the
   * order is tried anyway, since a cooldown is a guess about an account that
   * may have reset.
   *
   * The order is the chat's, by its URI: the conversation this CLI carries is
   * that chat, and the URI is what names it again after a restart.
   */
  const loginFor = (values: Bag): Login | undefined => {
    const all = loginsOf(values, ctx.options.logins);
    if (all.length === 0) return undefined;
    const held = ctx.login;
    const kept = held === undefined ? undefined : all.find((one) => one.id === held.id && one.token === held.token);
    if (kept !== undefined && !cooldowns.cooling(kept.id)) return kept;
    const order = ordered(ctx.options.chatUri, all);
    return order.find((one) => !cooldowns.cooling(one.id)) ?? order[0];
  };

  /** What the CLI's last `rate_limit_event` said, while it said `rejected`. */
  let rejected: Bag | undefined;
  const limited = (info: Bag): void => {
    rejected = str(info.status) === 'rejected' ? info : undefined;
  };

  /** The logins the running turn has tried since it last waited, by its id. */
  let tried: { turn: string; names: Set<string> } | undefined;

  /**
   * Where the running turn's move cuts the conversation back to.
   *
   * `at` is the last chain entry of the turn before it on the CLI, where a
   * rewind cuts. `over` is a conversation whose first turn this is, which has
   * no entry before its prompt and starts over instead: its conversation is
   * deleted and a new one begins under its id, as a chat truncated whole does.
   * `said` is the refusal's own words, for a turn that ends with them after all.
   */
  let move: { turn: string; said: string; at?: string; over?: true } | undefined;

  /** The timer of a turn waiting for a login to come back. */
  let waiting: ReturnType<typeof setTimeout> | undefined;

  /** The CLI a move closed, until the next one is in its place. */
  let closing: unknown;
  const replacing = (handle: unknown): boolean => closing !== undefined && handle === closing;

  /**
   * Where a refused turn is cut back to, or nothing when it cannot be.
   *
   * The last turn before it that ran on the CLI, skipping `!` commands, which
   * the CLI never saw. Its entry in `ends` is where a rewind cuts. A turn read
   * back after a restart has an entry only once the backend records one at the
   * transcript read, and a turn with none cannot be cut back to: the turn
   * fails rather than run again on a conversation that still holds the
   * refused prompt. With no turn before it at all, a conversation this process
   * started holds nothing but that prompt, and starts over; one it resumed, or
   * one in a machine whose files this host cannot delete, does not.
   */
  const cutOf = (): { at?: string; over?: true } | undefined => {
    for (let i = ctx.turns.length - 1; i >= 0; i--) {
      const turn = bag(ctx.turns[i]);
      if (isCommand(turn)) continue;
      const at = ctx.ends.get(String(turn.id));
      return at === undefined ? undefined : { at };
    }
    if (ctx.options.resume !== undefined || ctx.options.spawn !== undefined) return undefined;
    return { over: true };
  };

  const refused = (message: Bag): boolean => {
    const error = str(message.error);
    const turn = ctx.active;
    if (error === undefined || !MOVES.has(error) || turn === undefined || ctx.login === undefined) return false;
    if (str(message.parent_tool_use_id) !== undefined && str(message.parent_tool_use_id) !== '') return false;
    const refusal: Refusal = {
      error,
      ...(rejected !== undefined && typeof rejected.resetsAt === 'number' ? { resetsAt: rejected.resetsAt } : {}),
      ...(rejected !== undefined && str(rejected.rateLimitType) !== undefined ? { window: str(rejected.rateLimitType) as string } : {}),
    };
    rejected = undefined;
    cooldowns.mark(ctx.login.id, cooldownUntil(refusal, cooldowns.now()));
    /*
     * Run again only a turn that showed nothing yet.
     *
     * An attempt that has shown content or run a tool never runs again on
     * another account, because those happened; a turn that has a part fails
     * here as it always did, and the next turn starts on the next login.
     */
    if (list(turn.responseParts).length > 0) return false;
    const cut = cutOf();
    if (cut === undefined) return false;
    const said = list(bag(message.message).content).map((block) => str(bag(block).text) ?? '').join('');
    move = { turn: String(turn.id), said, ...cut };
    return true;
  };

  const moving = (): boolean => move !== undefined && ctx.active !== undefined && move.turn === String(ctx.active.id);

  /**
   * Put a new CLI on the turn's conversation, on `login`, and send the turn's
   * prompt to it again.
   *
   * Cut back to the end of the turn before it, as a rewind cuts, so the refused
   * prompt is not in the conversation the new CLI resumes; or, for a
   * conversation's first turn, started over under its id. The conversation's
   * entry for this turn goes with the cut or the delete, so it is taken out of
   * `ends`.
   *
   * A conversation whose delete fails still holds the refused prompt and its
   * reply. It comes back as it is, on the new login, and the turn ends with the
   * refusal, as a turn with no cut point does; the reply stays its last entry.
   */
  const runOn = async (login: Login | undefined): Promise<void> => {
    const held = move;
    const turn = ctx.active;
    if (held === undefined || turn === undefined || held.turn !== String(turn.id)) return;
    const was = ctx.handle;
    let failed: string | undefined;
    closing = was;
    try {
      try { was.close(); }
      catch { /* A CLI already gone is the same ending. */ }
      ctx.login = login;
      if (held.over === true) {
        // Stopped before the delete, so nothing writes the conversation back.
        await (was as unknown as { [Symbol.asyncDispose]?: () => Promise<void> })[Symbol.asyncDispose]?.();
        if (ctx.agentId !== undefined) {
          failed = await forgetSession(ctx.agentId, ctx.options.cwd).then(() => undefined, failureOf);
        }
        // A session closed meanwhile starts no CLI that nothing would close.
        if (ctx.closed) return;
      }
      if (failed === undefined) ctx.ends.delete(held.turn);
      ctx.gone = undefined;
      ctx.handle = held.over !== true
        ? ctx.startQuery(ctx.running, false, held.at)
        : ctx.startQuery(ctx.running, failed === undefined);
      void ctx.consume();
    }
    finally {
      closing = undefined;
    }
    // A turn stopped while its conversation was deleted keeps the new CLI and
    // sends it nothing: the stop was for this turn.
    const still = moving();
    move = undefined;
    if (!still) return;
    if (failed === undefined) {
      await ctx.again();
      return;
    }
    const why = `The conversation could not start over on another login: ${failed}`;
    ctx.failTurn(held.said === '' ? why : `${held.said}\n${why}`);
    ctx.startNext();
  };

  /**
   * The next login the refused turn runs on, or a wait for the first one back.
   *
   * Each login is tried once by a turn; when every one is cooling down or
   * tried, the turn waits until the earliest cooldown ends and tries them all
   * again, which is the backoff Aaron asked for. The turn waits itself, and
   * says until when.
   */
  const moveOn = async (): Promise<void> => {
    if (!moving() || ctx.login === undefined) return;
    const turn = String(ctx.active?.id);
    if (tried?.turn !== turn) tried = { turn, names: new Set() };
    tried.names.add(ctx.login.id);
    const order = ordered(ctx.options.chatUri, loginsOf(ctx.values, ctx.options.logins));
    // A record edited to hold no logins runs on the CLI's own sign-in, as one
    // that never held any does.
    if (order.length === 0) {
      await runOn(undefined);
      return;
    }
    const next = order.find((one) => !tried?.names.has(one.id) && !cooldowns.cooling(one.id));
    if (next !== undefined) {
      await runOn(next);
      return;
    }
    const due = order.map((one) => ({ one, at: cooldowns.until(one.id) ?? cooldowns.now() }));
    const soonest = due.reduce((a, b) => (b.at < a.at ? b : a));
    ctx.doing(`Waiting for a login, until ${new Date(soonest.at).toISOString()}`);
    waiting = setTimeout(() => {
      waiting = undefined;
      if (!moving()) return;
      tried = { turn, names: new Set() };
      // The login waited for, should the timer come a moment before the clock
      // passes its cooldown.
      const back = order.find((one) => !cooldowns.cooling(one.id)) ?? soonest.one;
      ctx.doing('Thinking');
      void runOn(back);
    }, Math.max(0, soonest.at - cooldowns.now()));
  };

  const stopMoving = (): void => {
    if (waiting !== undefined) clearTimeout(waiting);
    waiting = undefined;
    move = undefined;
  };

  return { login: undefined, cooldowns, loginFor, limited, refused, moving, moveOn, stopMoving, replacing };
}
