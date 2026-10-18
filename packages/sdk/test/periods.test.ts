/*
 * Where a day, a week, a month and a total begin, and when the calendar ones
 * reset.
 *
 * The cases are the ends of a month and a year, because those are what an
 * ordinary day's arithmetic gets wrong: a day is not always the next `date + 1`
 * and a month's last day is the one whose midnight is somebody else's month.
 */

import { expect, it } from 'vitest';
import { periodOf } from '../src/periods.js';

/** `periodOf`, with the instant spelled as a string. */
const start = (zone: string, period: 'day' | 'week' | 'month' | 'total', now: string, from?: string) =>
  periodOf(zone, period, new Date(now), from);

it('answers the day and the midnight after it, across a month\'s end', () => {
  expect(start('UTC', 'day', '2026-01-31T15:00:00.000Z')).toEqual({
    from: '2026-01-31T00:00:00.000Z',
    resets: '2026-02-01T00:00:00.000Z',
  });
});

it('answers the day and the midnight after it, across a year\'s end', () => {
  expect(start('UTC', 'day', '2026-12-31T23:30:00.000Z')).toEqual({
    from: '2026-12-31T00:00:00.000Z',
    resets: '2027-01-01T00:00:00.000Z',
  });
});

it('answers the Monday of the week and the Monday after it, across a month\'s end', () => {
  // Wednesday the 30th, so the week began on Monday the 28th and resets on the
  // 5th of the month after.
  expect(start('UTC', 'week', '2026-09-30T12:00:00.000Z')).toEqual({
    from: '2026-09-28T00:00:00.000Z',
    resets: '2026-10-05T00:00:00.000Z',
  });
});

it('answers the Monday of the week and the Monday after it, across a year\'s end', () => {
  // Friday the 1st of January, whose Monday is in the year before.
  expect(start('UTC', 'week', '2027-01-01T12:00:00.000Z')).toEqual({
    from: '2026-12-28T00:00:00.000Z',
    resets: '2027-01-04T00:00:00.000Z',
  });
});

it('answers the first of the month and the first of the next, across a year\'s end', () => {
  expect(start('UTC', 'month', '2026-12-15T12:00:00.000Z')).toEqual({
    from: '2026-12-01T00:00:00.000Z',
    resets: '2027-01-01T00:00:00.000Z',
  });
  // And a month whose end is not a leap of anything, from its last day.
  expect(start('UTC', 'month', '2026-01-31T23:59:59.999Z')).toEqual({
    from: '2026-01-01T00:00:00.000Z',
    resets: '2026-02-01T00:00:00.000Z',
  });
});

it('begins a period at midnight in the zone, not at midnight in UTC', () => {
  // Monday the 5th at 01:00 in America/Campo_Grande, which is UTC-4: the day
  // began four hours before in UTC.
  expect(start('America/Campo_Grande', 'day', '2026-10-05T05:00:00.000Z')).toEqual({
    from: '2026-10-05T04:00:00.000Z',
    resets: '2026-10-06T04:00:00.000Z',
  });
  expect(start('America/Campo_Grande', 'week', '2026-10-05T05:00:00.000Z')).toEqual({
    from: '2026-10-05T04:00:00.000Z',
    resets: '2026-10-12T04:00:00.000Z',
  });
});

it('answers a total from the row\'s own from, and never a reset', () => {
  // A total counts everything since its row began, so the epoch is behind every
  // record a store can hold.
  expect(start('UTC', 'total', '2026-10-07T12:00:00.000Z')).toEqual({ from: '1970-01-01T00:00:00.000Z' });
  expect(start('UTC', 'total', '2026-10-07T12:00:00.000Z', '2026-01-05T00:00:00.000Z'))
    .toEqual({ from: '2026-01-05T00:00:00.000Z' });
});
