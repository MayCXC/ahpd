import { BOT_BODIES, DEFAULT_SESSION, isBotColor, isSlug } from './record.js';
import type { BotRecord } from './record.js';
import type { RecordChange, RecordCollection } from '@ahpd/sdk';

/**
 * The bots this daemon keeps, in the record store the host gave it.
 *
 * The `bots` collection holds one record per bot, with `instructions` as its
 * body - the field a person writes in the Markdown half of the file. A bot is a
 * record somebody is looking at rather than a tree anybody edits, so a record
 * per bot is what lets a person read one, copy one between hosts, and see at a
 * glance what this daemon holds.
 *
 * A deleted slug leaves a tombstone in `bots-gone`. The slug is what a client
 * has the address of, so a bot deleted and made again under the same name would
 * be a different bot answering to a name somebody already knows; the tombstone
 * is what makes a re-make `-32010` rather than a surprise.
 *
 * The collections answer later, so every read here is answered from a cache
 * that `ready` loads once and the collection's watch keeps current. That is
 * what lets `all`, `get` and `gone` stay synchronous: the provider reads ten
 * times and writes twice, and only the writes wait.
 *
 * No file and no format is named here. What a record looks like on disk is the
 * record store's business, and a plugin that keeps the records in a database
 * takes that business over with one `registerRecords` call.
 */

/** One change to the bots that this store did not make. */
export interface BotChange {
  /** What happened to the bot. */
  type: 'added' | 'updated' | 'deleted';
  /** The bot as it is now; for `deleted`, the record as it was when it went. */
  bot: BotRecord;
  /** The bot as it was before, when the type is `updated`; nothing otherwise. */
  before: BotRecord | undefined;
}

export interface BotStore {
  /** Every bot, in no particular order. */
  all(): BotRecord[];
  /** One bot, or nothing when the slug has none. */
  get(slug: string): BotRecord | undefined;
  /** Whether this slug had a bot that was deleted. */
  gone(slug: string): boolean;
  /** Read both collections into the cache, once. Every read waits for this. */
  ready(): Promise<void>;
  /** Keep one bot, replacing what the slug held, once the collection has it. */
  put(record: BotRecord): Promise<void>;
  /** Delete one bot, leaving the tombstone behind, once the collection has both. */
  remove(slug: string): Promise<void>;
  /**
   * Hear each change to the collection that this store did not make.
   *
   * The provider gives one, and tells the watchers and the catalogue from it:
   * a bot a person edited by hand reaches both as any other edit does.
   */
  onChange(heard: (change: BotChange) => void): void;
}

/**
 * What one record said, where it is a bot this host can use.
 *
 * The store knows no plugin's record shape, so every field is checked here: a
 * record a person edited by hand can say anything, and a store that answered
 * something else is caught by the same check.
 *
 * Two keys are filled in rather than checked, because a bot with no word for
 * them and a bot whose word nobody has read are the same bot: the body it is
 * drawn with, and the name of the back session a message wakes.
 */
const kept = (said: unknown): BotRecord | undefined => {
  if (typeof said !== 'object' || said === null || Array.isArray(said)) return undefined;
  const one = said as Record<string, unknown>;
  if (typeof one['id'] !== 'string' || !isSlug(one['id'])) return undefined;
  if (typeof one['name'] !== 'string' || one['name'].trim() === '') return undefined;
  if (typeof one['workspace'] !== 'string' || typeof one['owner'] !== 'string') return undefined;
  if (typeof one['createdAt'] !== 'string' || typeof one['updatedAt'] !== 'string') return undefined;
  if (!isBotColor(one['color'])) return undefined;
  if (!Array.isArray(one['labels']) || one['labels'].some((label) => typeof label !== 'string')) return undefined;
  // A body is a tag, so any word is kept, and a file with none is drawn with
  // the first suggestion rather than left out of the listing.
  const body = typeof one['body'] === 'string' && one['body'].trim() !== '' ? one['body'] : BOT_BODIES[0];
  /*
   * And a back session's name, which a file that names none has as `work`: a
   * bot this host answers always names the session a message wakes, so nothing
   * that reads one has to know what the default is. Whether the name is one a
   * session can have is not asked here - a hand-written name that is no name is
   * refused where the message arrives, by the wake.
   */
  const session = typeof one['session'] === 'string' && one['session'].trim() !== '' ? one['session'].trim() : DEFAULT_SESSION;
  const rest: Record<string, unknown> = { ...one, body, session };
  return rest as unknown as BotRecord;
};

/** Whether two records say the same thing, whatever order their fields are in. */
const same = (one: BotRecord, other: BotRecord): boolean => {
  const left = one as unknown as Record<string, unknown>;
  const right = other as unknown as Record<string, unknown>;
  for (const field of new Set([...Object.keys(left), ...Object.keys(right)])) {
    if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) return false;
  }
  return true;
};

/**
 * The bots in one record store, over the `bots` and `bots-gone` collections.
 *
 * `onProblem` is told about each record that was there and could not be used,
 * one line each, and the store keeps everything else.
 */
export function botStore(
  bots: RecordCollection,
  graves: RecordCollection,
  onProblem: (line: string) => void,
): BotStore {
  /** Every bot this store has read, by slug. */
  const held = new Map<string, BotRecord>();
  /** Every slug that had a bot and lost it. */
  const dead = new Set<string>();
  /** The one load of both collections, which every read waits for. */
  let loading: Promise<void> | undefined;
  /** The provider's ear for a change this store did not make. */
  let heard: ((change: BotChange) => void) | undefined;
  /*
   * The slugs this store is writing or removing right now.
   *
   * A collection tells its watchers what a put or a remove did, its own caller
   * included, and that caller moves the cache itself once the collection has
   * answered. The echo is dropped here rather than compared away, because at
   * the moment it arrives the cache has not moved yet.
   */
  const writing = new Set<string>();

  /** Leave the tombstone a slug needs, if it is not there already. */
  const bury = async (slug: string): Promise<void> => {
    if (dead.has(slug)) return;
    await graves.put({ id: slug, deletedAt: new Date().toISOString() });
  };

  /**
   * Take one change the store did not make, once the collection has it.
   *
   * A record a person edited by hand can say anything, so it is read as any
   * other record is, through `kept`. The two fields a hand edit may not change
   * are refused here, because nothing before this point has seen the record.
   */
  const take = async (change: RecordChange): Promise<void> => {
    if (change.type === 'deleted') {
      const before = held.get(change.id);
      // A slug nothing here held: this store has no change to make or to tell.
      if (before === undefined) return;
      held.delete(change.id);
      /*
       * A bot deleted by hand leaves the tombstone a delete through the scheme
       * leaves. The record is gone and nothing says who took it, so the name is
       * spent rather than handed to another bot.
       */
      await bury(change.id);
      dead.add(change.id);
      heard?.({ type: 'deleted', bot: before, before: undefined });
      return;
    }
    const said = await bots.get(change.id);
    // It went again before this read: the delete that follows says so.
    if (said === undefined) return;
    const one = kept(said);
    if (one === undefined) {
      onProblem(`bots/${change.id} is not a bot record; the bot was left as it was`);
      return;
    }
    const before = held.get(one.id);
    if (before !== undefined && before.owner !== one.owner) {
      onProblem(`bots/${one.id} changed owner; the bot was left as it was`);
      return;
    }
    if (before !== undefined && before.workspace !== one.workspace) {
      onProblem(`bots/${one.id} changed workspace; the bot was left as it was`);
      return;
    }
    // A write of what is already here moved nothing, and is not a change.
    if (before !== undefined && same(before, one)) return;
    held.set(one.id, one);
    heard?.({ type: before === undefined ? 'added' : 'updated', bot: one, before });
  };

  /**
   * Read both collections into the cache, once.
   *
   * A collection waits for the fold that names the record store, so this cannot
   * run while the plugin applies: it is a promise the first call waits for, not
   * something `apply` does before it returns.
   */
  const load = async (): Promise<void> => {
    /*
     * The watch first, so a change made while the two listings are read is
     * taken as well. The collection opens on its first call either way, and a
     * watch asked for before that sees everything from the moment it opens.
     */
    bots.watch((change) => {
      if (writing.has(change.id)) return;
      take(change).catch((error: unknown) => {
        onProblem(`bots/${change.id} could not be read: ${String(error)}`);
      });
    });
    for (const said of await bots.list()) {
      const one = kept(said);
      if (one === undefined) {
        onProblem(`bots/${said.id} is not a bot record; it was left out`);
        continue;
      }
      held.set(one.id, one);
    }
    // A tombstone is a record too, and only its id is read: it says which slug
    // was a bot, never what that bot was.
    for (const said of await graves.list()) dead.add(said.id);
  };

  const ready = (): Promise<void> => {
    loading ??= load();
    return loading;
  };

  /** In the order a listing shows them, which is the order a slug sorts in. */
  const sorted = (): BotRecord[] => [...held.values()].sort((one, other) => (one.id < other.id ? -1 : one.id > other.id ? 1 : 0));

  return {
    all: sorted,
    get: (slug) => held.get(slug),
    gone: (slug) => dead.has(slug),
    ready,
    onChange: (one) => { heard = one; },
    put: async (record) => {
      writing.add(record.id);
      try {
        // The collection first: a write that failed is a cache that never moved.
        await bots.put({ ...record });
      }
      finally {
        writing.delete(record.id);
      }
      held.set(record.id, record);
    },
    remove: async (slug) => {
      writing.add(slug);
      try {
        // The tombstone first, so a failure between the two leaves a name that
        // can never be made again rather than one that quietly can.
        await bury(slug);
        await bots.remove(slug);
      }
      finally {
        writing.delete(slug);
      }
      held.delete(slug);
      dead.add(slug);
    },
  };
}
