/**
 * The day, week and month a total is cut over, in a named zone.
 *
 * A period begins at local midnight rather than at UTC midnight: a person whose
 * week starts on their Monday should not be handed a week that began the
 * evening before. `Intl` is the only zoned clock this repository holds, and it
 * answers in words rather than in numbers, so the wall clock is put back
 * together by hand and the arithmetic below is ordinary UTC arithmetic on it.
 *
 * The helpers were `usage.ts`'s own until the store needed the same zone to key
 * its totals by. One module, so the boundary a period is read over and the day
 * a record is kept under are cut in the same place.
 */

import { EPOCH } from '../resources/records.js';
import type { Period } from '../types/policies.js';

/**
 * One instant as the wall clock in `zone` reads it.
 *
 * A `Date` whose UTC fields are that wall time, so the arithmetic below is
 * ordinary UTC arithmetic on a clock that is not UTC: `Intl` is the only zoned
 * clock this repository holds, and it answers in words rather than in numbers,
 * so the parts are put back together by hand.
 */
export const shown = (zone: string, at: Date): Date => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const field = (what: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((one) => one.type === what)?.value);
  return new Date(Date.UTC(field('year'), field('month') - 1, field('day'), field('hour'), field('minute'), field('second')));
};

/** How far `zone` is from UTC at that instant, in milliseconds east of it. */
export const offsetAt = (zone: string, at: Date): number => shown(zone, at).getTime() - at.getTime();

/**
 * The instant a local calendar day begins.
 *
 * Twice, because a zone that changes its offset at midnight would otherwise put
 * the answer on the wrong side of its own change: the first guess asks what the
 * offset was at local midnight read as UTC, and the second asks again at the
 * instant that gave.
 */
export const startOfDay = (zone: string, local: Date): Date => {
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const guess = midnight - offsetAt(zone, new Date(midnight));
  return new Date(midnight - offsetAt(zone, new Date(guess)));
};

/** The zone the periods are cut in, and what is said about one that cannot be read. */
export const zoneOf = (wanted: string | undefined, told: (message: string) => void): string => {
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (wanted === undefined || wanted.trim() === '') return here;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: wanted }).format(new Date());
    return wanted;
  } catch {
    told(`usage.timezone ${wanted} is not a zone this host can read, so usage is cut in ${here}.`);
    return here;
  }
};

/** The local day `back` days before the local day `from` falls on. */
const earlier = (from: Date, back: number): Date =>
  new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - back));

/** The Monday of the local week `local` falls in, which is the week already under way. */
export const mondayOf = (local: Date): Date => earlier(local, (local.getUTCDay() + 6) % 7);

/** The first of the local month `local` falls in. */
export const firstOf = (local: Date): Date =>
  new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1));

/** Where a period begins, and where the next one does. */
export interface PeriodStart {
  /** The first instant inside the period, ISO 8601. */
  from: string;
  /** The first instant after it, ISO 8601; absent for `total`, which never resets. */
  resets?: string;
}

/**
 * Where `period` begins in `zone`, and when it resets.
 *
 * `day`, `week` and `month` begin at local midnight of today, of this Monday and
 * of the 1st, and reset at the local midnight after them. `total` begins at the
 * row's own `from`, because a total counts everything since then and never
 * resets; a row with no `from` begins at the epoch, which is behind every record
 * a store can hold.
 */
export const periodOf = (zone: string, period: Period, now: Date, from?: string): PeriodStart => {
  if (period === 'total') return from === undefined ? { from: EPOCH } : { from };
  const local = shown(zone, now);
  const begin = period === 'day' ? local : period === 'week' ? mondayOf(local) : firstOf(local);
  const next = period === 'day'
    ? earlier(local, -1)
    : period === 'week'
      ? earlier(begin, -7)
      : new Date(Date.UTC(begin.getUTCFullYear(), begin.getUTCMonth() + 1, 1));
  return { from: startOfDay(zone, begin).toISOString(), resets: startOfDay(zone, next).toISOString() };
};
