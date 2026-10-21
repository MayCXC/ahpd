/**
 * The on/off decisions that outlive one session.
 *
 * A client's toggle carries a decision per scope - global, folder, session -
 * and the session's is the session's own. The other two are kept here, so a
 * plugin somebody switched off for every session stays off in the next one, and
 * a plugin switched off in a folder stays off in every session working there.
 *
 * The scopes and their order are VS Code's: the most specific decision wins,
 * the session's before the folder's before the global one, and a customization
 * nothing was decided about is on. A decision that says what it would inherit
 * is not kept, so a folder agreeing with every session says nothing and a
 * global decision of on says nothing either. A reader therefore tells "this
 * scope decided" from "this scope says nothing" by the decision being there.
 *
 * `memoryEnablement` holds the decisions in memory, which is what a test and a
 * host embedded in something short-lived want. A daemon keeps the same store
 * over a state file.
 */

import { str } from '../utils/values.js';
import type { Bag } from '../types/common.js';

/** What a customization nobody switched off is, and so what a decision nobody made stands for. */
const ON = true;

/**
 * How many decisions one store keeps.
 *
 * A key is derived from where a customization came from, so a plugin that is
 * gone leaves a decision nothing can name again. This bounds how many of those
 * a store accumulates: over this many, the decision set longest ago goes
 * first. VS Code's host caps its global and folder decisions at the same
 * number, for the same reason.
 */
const DECISIONS = 512;

/**
 * The key a customization's global and folder decisions are kept under, or
 * nothing where this host keeps none for it.
 *
 * A plugin is keyed by the URI it was announced at. That is what names it again
 * after a restart: the copy on this host's disk is named from the URI and a
 * revision token, so a decision keyed by where a copy landed would be lost the
 * moment the client published a new revision.
 *
 * An MCP server of a plugin is keyed by that plugin with the server's name
 * after it, which `ofPlugin` names - the same server name under another plugin
 * is another decision. A server with no plugin behind it, which is one this
 * host or a backend reported, is keyed by its name alone.
 *
 * Every other type has no key. VS Code's host keeps decisions for plugins and
 * MCP servers only, and those are the two a customization switch reaches.
 */
export const enablementKeyOf = (customization: Bag, ofPlugin?: string): string | undefined => {
  const type = str(customization.type);
  if (type === 'plugin') {
    const uri = str(customization.uri) ?? '';
    return uri === '' ? undefined : uri;
  }
  if (type !== 'mcpServer') return undefined;
  const name = str(customization.name) ?? '';
  return ofPlugin === undefined || ofPlugin === '' ? `mcpServers#${name}` : `${ofPlugin}#mcp=${name}`;
};

/**
 * The global and folder decisions of a host.
 *
 * A getter answers nothing where no decision was made, rather than the value in
 * force. A decision that equals what it would inherit is never kept, so only
 * the reader knows which scope a customization is switched off at - and it has
 * to, because that scope is what the entries it publishes name. What a missing
 * decision stands for is the global one for a folder, and on for a global one.
 */
export interface EnablementStore {
  /** The decision for every session, or nothing where every session is left to the customization's own answer. */
  global(key: string): boolean | undefined;
  /** The decision one folder holds, or nothing where that folder follows the decision for every session. */
  folder(dir: string, key: string): boolean | undefined;
  /** Decide every session. `undefined` clears the decision. */
  setGlobal(key: string, on: boolean | undefined): void;
  /** Decide one folder. `undefined` clears the decision. */
  setFolder(dir: string, key: string, on: boolean | undefined): void;
}

/**
 * Every decision a store holds, by scope.
 *
 * The shape a store over a file writes down, and the shape it reads back: the
 * decisions for every session by key, and each folder's decisions by key.
 */
export interface HeldDecisions {
  global: Record<string, boolean>;
  folders: Record<string, Record<string, boolean>>;
}

/**
 * A store that can hand over what it holds.
 *
 * What a store over a file needs and a host does not: the daemon writes every
 * decision down after each change, and a store that could only be asked one
 * key at a time would have nothing to write. Kept off `EnablementStore`, which
 * is the whole of what a host is handed.
 */
export interface HeldEnablementStore extends EnablementStore {
  /** Every decision this store holds, as a store over a file writes it down. */
  held(): HeldDecisions;
}

/** Where one decision lives: for every session, or in one folder. */
type Place = { scope: 'global'; key: string } | { scope: 'folder'; dir: string; key: string };

/** Whether two entries of the order name one decision. */
const same = (a: Place, b: Place): boolean => {
  if (a.scope === 'global' || b.scope === 'global') return a.scope === 'global' && b.scope === 'global' && a.key === b.key;
  return a.dir === b.dir && a.key === b.key;
};

/**
 * The decisions, held for the life of the process.
 *
 * One store over two maps and the order the decisions were set in, which is
 * what the cap is applied to. A decision that says what it would inherit is
 * dropped rather than kept, and a global decision takes every folder decision
 * that now agrees with it with it - so what the maps hold is decisions, and
 * nothing that only repeats another one.
 */
export function memoryEnablement(): HeldEnablementStore {
  /** Every decision for every session, by key. */
  const global = new Map<string, boolean>();
  /** Every folder's decisions, by folder and then key. */
  const folders = new Map<string, Map<string, boolean>>();
  /**
   * Every decision this store holds, the one set longest ago first.
   *
   * Held rather than derived, because this order is the order the decisions
   * were written in and a map has none. A decision cleared and set again moves
   * to the youngest end, which is the decision a person has just made.
   */
  const order: Place[] = [];

  /** What a folder that says nothing stands for. */
  const inheritOf = (key: string): boolean => global.get(key) ?? ON;

  /** Drop one decision from the maps. */
  const forget = (one: Place): void => {
    if (one.scope === 'global') { global.delete(one.key); return; }
    const held = folders.get(one.dir);
    held?.delete(one.key);
    if (held !== undefined && held.size === 0) folders.delete(one.dir);
  };

  /** Drop one decision from the order, wherever in it it sits. */
  const unorder = (one: Place): void => {
    const at = order.findIndex((held) => same(held, one));
    if (at !== -1) order.splice(at, 1);
  };

  /** Put one decision at the youngest end of the order, and drop the decisions over the cap. */
  const ordered = (one: Place): void => {
    unorder(one);
    order.push(one);
    while (order.length > DECISIONS) {
      const oldest = order.shift();
      if (oldest !== undefined) forget(oldest);
    }
  };

  /**
   * Drop every folder decision that now says what it would inherit.
   *
   * A global decision moves what every folder that says nothing stands for, so
   * a folder decision the same as the new one is one nothing reads any more.
   */
  const agreeWith = (key: string): void => {
    const inherits = inheritOf(key);
    for (const [dir, held] of [...folders]) {
      if (held.get(key) !== inherits) continue;
      held.delete(key);
      if (held.size === 0) folders.delete(dir);
      unorder({ scope: 'folder', dir, key });
    }
  };

  return {
    global: (key) => global.get(key),
    folder: (dir, key) => folders.get(dir)?.get(key),

    // Every decision as one object, which is what a store over a file writes
    // down. A store that holds none answers two empty records rather than
    // nothing, so the file always holds the same two fields.
    held: () => ({
      global: Object.fromEntries(global),
      folders: Object.fromEntries([...folders].map(([dir, into]) => [dir, Object.fromEntries(into)])),
    }),

    setGlobal: (key, on) => {
      // A decision that says what every session already does is not kept: it
      // would shadow the next one, and a reader could not tell the two apart.
      if (on === undefined || on === ON) {
        global.delete(key);
        unorder({ scope: 'global', key });
      }
      else {
        global.set(key, on);
        ordered({ scope: 'global', key });
      }
      agreeWith(key);
    },

    setFolder: (dir, key, on) => {
      const held = folders.get(dir);
      // The same rule one scope down, against what this folder would inherit.
      if (on === undefined || on === inheritOf(key)) {
        held?.delete(key);
        if (held !== undefined && held.size === 0) folders.delete(dir);
        unorder({ scope: 'folder', dir, key });
        return;
      }
      const into = held ?? new Map<string, boolean>();
      into.set(key, on);
      folders.set(dir, into);
      ordered({ scope: 'folder', dir, key });
    },
  };
}
