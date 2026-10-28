import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Turn } from '@microsoft/agent-host-protocol';
import { idOf } from '../sessions/catalog.js';
import { readJsonObject, writeJsonAtomic } from '../utils/jsonfile.js';
import { bag, isRecord, reason, str } from '../utils/values.js';
import type { Agent, SessionAt } from '../types/agent.js';
import type { Bag } from '../types/common.js';
import type { WireTurn } from '../types/wire.js';
import type { HostContext } from './context.js';

/**
 * A turn this host answered itself, kept for its chat.
 *
 * A `!` command's turn is the host's: the host ran the shell, and no agent saw
 * the turn, so no agent's transcript holds it. A chat read back from its
 * transcript after a restart would come back without it. The reference host
 * keeps such a turn as a local turn, anchored to the turn it followed, and
 * puts it back after that turn on every read of the chat.
 * https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts
 *
 * The anchor is written as the id the backend's transcript gives that turn,
 * which is the id a read after a restart holds. A backend whose transcript
 * names turns its own way says so through `onTurnRecorded`, and this area
 * keeps what it said for as long as the chat is held.
 */
export interface LocalTurns {
  /** What `onTurnRecorded` said: the id a chat's transcript holds a turn under. */
  turnRecordedAs(chat: string, turnId: string, transcriptId: string): void;
  /**
   * Keep a command's turn that has ended, as the chat holds it in `turns`.
   *
   * Nothing for a turn `turns` does not hold, and nothing where the store keeps
   * no session folder.
   * https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/localCommands/localChatCommand.ts#L227-L245
   */
  keepLocalTurn(session: string, chat: string, turns: readonly Bag[], turnId: string): void;
  /**
   * One chat's transcript, read with the outputs it is handed and with its
   * local turns put back, or the local turns alone for a chat whose backend
   * holds no transcript.
   */
  transcriptOf(
    agent: Agent,
    id: string,
    at: SessionAt | undefined,
    session: string,
    chat: string,
  ): Promise<WireTurn<Turn>[] | undefined>;
  /** A transcript's turns with the chat's local turns put back after their anchors. */
  withLocalTurns<T>(session: string, chat: string, turns: readonly T[]): T[];
  /**
   * The id a backend cuts or forks at for the turn at `at`: that turn's, or the
   * nearest earlier one's that is not a local turn. Nothing when every turn up
   * to `at` is a local turn.
   */
  concreteTurnOf(session: string, chat: string, turns: readonly Bag[], at: number): string | undefined;
  /** Forget the local turns among some dropped turns of a chat. */
  forgetLocalTurns(session: string, chat: string, turns: readonly Bag[]): void;
  /** Keep a fork's copied local turns, and the transcript ids of its copied turns, for the new chat. */
  copyLocalTurns(session: string, from: string, to: string, turns: readonly Bag[]): void;
  /** Forget every local turn and transcript id a chat kept. */
  forgetChatLocalTurns(session: string, chat: string): void;
  /**
   * Every turn a session's chats keep, by the session's id, in no order.
   *
   * What a session whose turns are all the host's own holds: no backend lists
   * it or holds a conversation for it, so the catalogue keeps and lists it from
   * these, and a read of it answers them.
   */
  keptTurnsOf(id: string): Bag[];
  /** Take a chat's local turns to the session it moved to. */
  moveChatLocalTurns(from: string, to: string, chat: string): void;
}

/** One file: a local turn, its anchor and where it sorts among the anchor's others. */
interface Kept {
  turnId: string;
  /** The transcript id of the turn it followed, or nothing for one before every other turn. */
  anchor?: string;
  seq: number;
  turn: Bag;
}

/** The folder under a session's own where its chats' local turns are. */
const TURNS = 'turns';

/** A name as a file name: its SHA-256 in hex, as `outputs.ts` names one. */
const hashOf = (name: string): string => createHash('sha256').update(name, 'utf8').digest('hex');

/**
 * Whether a file holds a turn a client can read: the reference's own check of a
 * persisted turn, with the turn's id the one the file was kept under.
 * https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L171-L200
 */
const keptOf = (value: Bag): Kept | undefined => {
  const { version, turnId, anchor, seq, turn } = value;
  if (version !== 1 || typeof turnId !== 'string' || typeof seq !== 'number') return undefined;
  if (anchor !== undefined && typeof anchor !== 'string') return undefined;
  if (!isRecord(turn) || turn.id !== turnId || typeof turn.state !== 'string' || !Array.isArray(turn.responseParts)) return undefined;
  const message = bag(turn.message);
  if (typeof message.text !== 'string' || typeof bag(message.origin).kind !== 'string') return undefined;
  return { turnId, ...(anchor === undefined ? {} : { anchor }), seq, turn };
};

export function createLocalTurns(ctx: HostContext): LocalTurns {
  /** Each held chat's transcript ids, by the id its turns go by while they run. */
  const recordedAs = new Map<string, Map<string, string>>();

  /** A chat's folder in a session's own, or nothing where the store keeps none. */
  const folderOf = (session: string, chat: string): string | undefined => {
    const dir = ctx.kept.attachmentsDir?.(idOf(session));
    return dir === undefined ? undefined : join(dir, TURNS, hashOf(chat));
  };
  const fileOf = (session: string, chat: string, turnId: string): string | undefined => {
    const folder = folderOf(session, chat);
    return folder === undefined ? undefined : join(folder, `${hashOf(turnId)}.json`);
  };
  const isLocal = (session: string, chat: string, turnId: string): boolean => {
    const file = fileOf(session, chat, turnId);
    return file !== undefined && existsSync(file);
  };

  /** Every file a chat kept that this version wrote and that holds a turn, in no order. */
  const keptIn = (session: string, chat: string): Kept[] => {
    const folder = folderOf(session, chat);
    return folder === undefined ? [] : keptInFolder(folder);
  };
  /** The same, read from one chat's folder. */
  const keptInFolder = (folder: string): Kept[] => {
    if (!existsSync(folder)) return [];
    let names: string[];
    try { names = readdirSync(folder); }
    catch (error) {
      ctx.log(`could not read ${folder}: ${reason(error)}`);
      return [];
    }
    return names.flatMap((name) => {
      if (!name.endsWith('.json')) return [];
      const outcome = readJsonObject(join(folder, name));
      const kept = outcome.ok ? keptOf(outcome.value) : undefined;
      return kept === undefined ? [] : [kept];
    });
  };

  const turnRecordedAs = (chat: string, turnId: string, transcriptId: string): void => {
    const names = recordedAs.get(chat) ?? new Map<string, string>();
    names.set(turnId, transcriptId);
    recordedAs.set(chat, names);
  };

  const keepLocalTurn = (session: string, chat: string, turns: readonly Bag[], turnId: string): void => {
    const at = turns.findIndex((turn) => str(turn.id) === turnId);
    const file = fileOf(session, chat, turnId);
    if (at < 0 || file === undefined) return;
    /*
     * The turn it followed: the nearest earlier one that is no local turn of
     * its own, by the id the transcript holds it under.
     * https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L100-L109
     */
    let anchor: string | undefined;
    for (let before = at - 1; before >= 0; before -= 1) {
      const id = str(turns[before]?.id);
      if (id === undefined || isLocal(session, chat, id)) continue;
      anchor = recordedAs.get(chat)?.get(id) ?? id;
      break;
    }
    const seq = keptIn(session, chat).reduce((most, kept) => Math.max(most, kept.seq), 0) + 1;
    try {
      // The store's own writer: 0600 under a 0700 folder, renamed into place,
      // so a process killed mid-write leaves no half of one.
      writeJsonAtomic(file, {
        version: 1,
        turnId,
        ...(anchor === undefined ? {} : { anchor }),
        seq,
        turn: turns[at],
      }, { dirMode: 0o700 });
    }
    catch (error) {
      ctx.log(`could not keep the turn ${turnId} of ${chat}: ${reason(error)}`);
    }
  };

  /*
   * The reference's interleave: the local turns with no anchor first, then each
   * after the turn it followed, in the order they were kept, and one whose
   * anchor the transcript does not hold is dropped.
   * https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L202-L234
   *
   * A transcript can hold some local turns already: an ACP record keeps the
   * seed it was resumed with, and the seed carries the chat's local turns. Each
   * of those stays where the transcript has it, the others of its anchor go in
   * around it by `seq`, and none goes in a second time.
   */
  const withLocalTurns = <T>(session: string, chat: string, turns: readonly T[]): T[] => {
    const kept = keptIn(session, chat);
    if (kept.length === 0) return [...turns];
    const seqOf = new Map(kept.map((one) => [one.turnId, one.seq]));
    const held = new Set(turns.map((turn) => str(bag(turn).id)));
    // The local turns to put in, by anchor, each anchor's in `seq` order.
    const waiting = new Map<string | undefined, Kept[]>();
    for (const one of kept.filter((each) => !held.has(each.turnId)).sort((a, b) => a.seq - b.seq)) {
      waiting.set(one.anchor, [...(waiting.get(one.anchor) ?? []), one]);
    }
    const merged: T[] = [];
    // The turns before the first of the backend's own are the ones with no anchor.
    let anchor: string | undefined;
    const putIn = (before?: number): void => {
      const group = waiting.get(anchor) ?? [];
      while (group.length > 0 && (before === undefined || (group[0] as Kept).seq < before)) {
        merged.push((group.shift() as Kept).turn as unknown as T);
      }
    };
    for (const turn of turns) {
      const id = str(bag(turn).id);
      const seq = id === undefined ? undefined : seqOf.get(id);
      if (seq !== undefined) putIn(seq);
      else {
        putIn();
        anchor = id;
      }
      merged.push(turn);
    }
    putIn();
    return merged;
  };

  const transcriptOf = async (
    agent: Agent,
    id: string,
    at: SessionAt | undefined,
    session: string,
    chat: string,
  ): Promise<WireTurn<Turn>[] | undefined> => {
    const turns = await agent.transcript?.(id, at, ctx.outputsFor(session, chat));
    // A chat whose turns are all this host's own has no transcript, and reads
    // as the turns it keeps, as a nested session opens from its record.
    if (turns === undefined) return keptIn(session, chat).length > 0 ? withLocalTurns(session, chat, []) : undefined;
    return withLocalTurns(session, chat, turns);
  };

  const concreteTurnOf = (session: string, chat: string, turns: readonly Bag[], at: number): string | undefined => {
    for (let before = at; before >= 0; before -= 1) {
      const id = str(turns[before]?.id);
      if (id !== undefined && !isLocal(session, chat, id)) return id;
    }
    return undefined;
  };

  const forgetLocalTurns = (session: string, chat: string, turns: readonly Bag[]): void => {
    for (const turn of turns) {
      const id = str(turn.id);
      const file = id === undefined ? undefined : fileOf(session, chat, id);
      if (file === undefined) continue;
      try { rmSync(file, { force: true }); }
      catch (error) { ctx.log(`could not remove ${file}: ${reason(error)}`); }
    }
  };

  const copyLocalTurns = (session: string, from: string, to: string, turns: readonly Bag[]): void => {
    const names = recordedAs.get(from);
    const folder = folderOf(session, to);
    for (const turn of turns) {
      const id = str(turn.id);
      if (id === undefined) continue;
      const said = names?.get(id);
      if (said !== undefined) turnRecordedAs(to, id, said);
      const was = fileOf(session, from, id);
      if (folder === undefined || was === undefined || !existsSync(was)) continue;
      const now = join(folder, `${hashOf(id)}.json`);
      try {
        mkdirSync(folder, { recursive: true, mode: 0o700 });
        copyFileSync(was, now);
      }
      catch (error) { ctx.log(`could not copy ${was} to ${now}: ${reason(error)}`); }
    }
  };

  const forgetChatLocalTurns = (session: string, chat: string): void => {
    recordedAs.delete(chat);
    const folder = folderOf(session, chat);
    if (folder === undefined) return;
    try { rmSync(folder, { recursive: true, force: true }); }
    catch (error) { ctx.log(`could not remove ${folder}: ${reason(error)}`); }
  };

  const moveChatLocalTurns = (from: string, to: string, chat: string): void => {
    const was = folderOf(from, chat);
    const now = folderOf(to, chat);
    if (was === undefined || now === undefined || was === now || !existsSync(was)) return;
    try {
      mkdirSync(now, { recursive: true, mode: 0o700 });
      // File by file, as a chat's outputs move, so a folder the chat left there
      // before keeps what this move does not replace.
      for (const name of readdirSync(was)) renameSync(join(was, name), join(now, name));
      rmSync(was, { recursive: true, force: true });
    }
    catch (error) { ctx.log(`could not move ${was} to ${now}: ${reason(error)}`); }
  };

  const keptTurnsOf = (id: string): Bag[] => {
    const dir = ctx.kept.attachmentsDir?.(id);
    const turns = dir === undefined ? undefined : join(dir, TURNS);
    if (turns === undefined || !existsSync(turns)) return [];
    let chats: string[];
    try { chats = readdirSync(turns); }
    catch (error) {
      ctx.log(`could not read ${turns}: ${reason(error)}`);
      return [];
    }
    return chats.flatMap((chat) => keptInFolder(join(turns, chat)).map((kept) => kept.turn));
  };

  return {
    turnRecordedAs, keepLocalTurn, transcriptOf, withLocalTurns, concreteTurnOf,
    forgetLocalTurns, copyLocalTurns, forgetChatLocalTurns, moveChatLocalTurns, keptTurnsOf,
  };
}
