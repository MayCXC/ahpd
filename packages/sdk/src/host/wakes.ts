import { idOf } from '../catalog.js';
import type { Bag } from '../types/common.js';
import type { StoredChat } from '../types/sessions.js';
import type { HostContext } from './context.js';

/**
 * The wakes agents asked this host for, and the clock that fires them.
 *
 * A wake is held on its chat's record in the store, so it survives the session
 * sleeping and the daemon restarting. One timer is armed for the earliest. A
 * wake that fell due while the daemon was down fires once, when the clock
 * starts.
 */
export interface Wakes {
  /**
   * Set one chat's wake, replacing the one it held, or cancel it with
   * `undefined`. Answers whether the chat held a wake before.
   */
  setWake(session: string, chat: string, wake: { at: number; prompt: string } | undefined): boolean;
  /** Load the stored wakes, fire the ones already due, and arm the clock. */
  startWakes(): void;
  /** Stop the clock, for a host that is closing. */
  stopWakes(): void;
}

/** `setTimeout` will not wait longer than this, so a longer wait is done in instalments. */
const MAX_DELAY = 2_147_483_647;

export function createWakes(ctx: HostContext): Wakes {
  const { options, kept, byChat, log } = ctx;
  const now = (): number => (options.now?.() ?? new Date()).getTime();
  const arm = options.timer ?? ((fire, ms): { cancel(): void } => {
    const handle = setTimeout(fire, ms);
    handle.unref?.();
    return { cancel: () => { clearTimeout(handle); } };
  });

  /** The wakes held, by chat URI: the session id and when it is due. */
  const pending = new Map<string, { id: string; at: number }>();
  let timer: { cancel(): void } | undefined;
  let started = false;

  /** Write one chat's wake on its record. Answers the wake the record held before. */
  const record = (id: string, chat: string, wake: StoredChat['wake']): StoredChat['wake'] => {
    const rows = kept.chats(id);
    const at = rows.findIndex((one) => one.uri === chat && one.closed !== true);
    const held = rows[at];
    if (held === undefined) return undefined;
    const moved = rows.map((one) => ({ ...one }));
    const next: StoredChat = { ...held };
    delete next.wake;
    if (wake !== undefined) next.wake = wake;
    moved[at] = next;
    kept.setChats(id, moved);
    return held.wake;
  };

  const disarm = (): void => {
    timer?.cancel();
    timer = undefined;
  };

  /** One timer for the earliest wake held. */
  const rearm = (): void => {
    disarm();
    if (!started || ctx.closed) return;
    let first: number | undefined;
    for (const { at } of pending.values()) if (first === undefined || at < first) first = at;
    if (first === undefined) return;
    timer = arm(() => { timer = undefined; fire(); }, Math.min(Math.max(0, first - now()), MAX_DELAY));
  };

  /**
   * One due wake: cleared from the record, the session woken, and a turn begun
   * with its prompt. Queued behind a turn that is running.
   */
  const begin = async (id: string, chat: string, prompt: string): Promise<void> => {
    const live = byChat.get(chat)?.uri;
    const woken = await ctx.wake(live ?? ctx.nameOf(id), chat);
    const state = woken.chat.chatState() as { activeTurn?: unknown; queuedMessages?: unknown; steeringMessage?: unknown };
    const busy = state.activeTurn !== undefined || state.steeringMessage !== undefined
      || (Array.isArray(state.queuedMessages) && state.queuedMessages.length > 0);
    const from: Bag = { origin: { kind: 'agent' }, _meta: { 'vscode.chat.delegation': { sourceSession: woken.uri, sourceChat: chat } } };
    if (busy) woken.chat.queue(crypto.randomUUID(), prompt, undefined, from);
    else woken.chat.begin(crypto.randomUUID(), prompt, undefined, from);
  };

  /** Begin every wake that is due, then arm for the next. */
  const fire = (): void => {
    if (ctx.closed) return;
    const at = now();
    for (const [chat, held] of [...pending]) {
      if (held.at > at) continue;
      pending.delete(chat);
      // The record is what holds the wake: one that is gone with its chat or
      // its session fires nothing.
      const wake = record(held.id, chat, undefined);
      if (wake === undefined) continue;
      begin(held.id, chat, wake.prompt).catch((error: unknown) => {
        log(`wake of ${chat} failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
    rearm();
  };

  const setWake = (session: string, chat: string, wake: { at: number; prompt: string } | undefined): boolean => {
    const id = idOf(session);
    if (wake !== undefined && kept.chats(id).every((one) => one.uri !== chat || one.closed === true)) {
      throw new Error(`${chat} is not a chat this host keeps a record of`);
    }
    const was = record(id, chat, wake);
    if (wake === undefined) pending.delete(chat);
    else pending.set(chat, { id, at: wake.at });
    rearm();
    return was !== undefined;
  };

  const startWakes = (): void => {
    if (started) return;
    started = true;
    for (const id of kept.sessions()) {
      for (const one of kept.chats(id)) {
        if (one.wake !== undefined && one.closed !== true) pending.set(one.uri, { id, at: one.wake.at });
      }
    }
    fire();
  };

  const stopWakes = (): void => {
    started = false;
    disarm();
  };

  return { setWake, startWakes, stopWakes };
}
