/**
 * What each pool key used in the minute of the clock.
 *
 * A minute limit cannot be read from the usage store: `fileUsage` sums a pool
 * by day, and a day is not an answer to "this minute". So the totals a minute
 * limit reads are kept here, in memory, one figure per key for the minute in
 * progress and one for the minute before it.
 *
 * Two buckets and no more. A window that has rolled on is a window nobody can
 * be charged in, so the older bucket is dropped as the minute turns rather than
 * kept as a history that grows with every key the host has ever seen.
 *
 * The meter is in memory, so a restart clears it and a second daemon keeps its
 * own. What a restart loses is one minute of counting, which is the most a
 * minute limit can be wrong by.
 */

import { minuteOf } from './periods.js';

/** What a pool key used in one minute. */
interface Bucket {
  /** The minute counted from the epoch, as `minuteOf` names it. */
  minute: number;
  /** The amount added in that minute. */
  sum: number;
}

/** What each pool key used in the current minute and in the one before it. */
export interface MinuteMeter {
  /** Add `amount` to what `key` used in the minute of `at`, which is now unless said. */
  add(key: string, amount: number, at?: Date): void;
  /** What `key` used in the minute of `at`, which is now unless said. Zero when it used nothing. */
  sum(key: string, at?: Date): number;
}

/**
 * A meter over the last two minutes of every key it was told about.
 *
 * `add` is what turns the window: a key's buckets are the minute of `at` and
 * the one before it, so an add in a newer minute starts a fresh sum and drops
 * the buckets older than the new minute's own predecessor.
 */
export function createMinuteMeter(): MinuteMeter {
  /** The buckets of each key, newest first. */
  const held = new Map<string, Bucket[]>();

  return {
    add: (key, amount, at = new Date()): void => {
      const minute = minuteOf(at);
      const kept = held.get(key) ?? [];
      const found = kept.find((bucket) => bucket.minute === minute);
      if (found !== undefined) {
        found.sum += amount;
        return;
      }
      const newest = kept[0];
      // A minute two back has turned, so nothing can be charged in it, and its
      // add does not move the window that has turned since.
      if (newest !== undefined && minute < newest.minute - 1) return;
      // A record written after the minute turned still counts in the minute it
      // is in, which is the one before the window and still kept.
      if (newest !== undefined && minute < newest.minute) {
        held.set(key, [{ minute, sum: amount }, ...kept]);
        return;
      }
      // A minute that has just begun keeps the one before it, for a record
      // still being written; a later one drops both.
      const before = kept.filter((bucket) => bucket.minute === minute - 1);
      held.set(key, [{ minute, sum: amount }, ...before]);
    },

    sum: (key, at = new Date()): number => {
      const minute = minuteOf(at);
      const found = held.get(key)?.find((bucket) => bucket.minute === minute);
      return found === undefined ? 0 : found.sum;
    },
  };
}
