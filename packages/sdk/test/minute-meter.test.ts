/*
 * The meter a `minute` limit reads, and where a minute begins.
 *
 * The meter is the one total finer than a day, so what it has to hold is the
 * minute in progress and the one before it: a window that has rolled on is a
 * window nobody can be charged in, and a key left behind must not grow into a
 * history. The clock is fixed, because a test that waits a minute is a test
 * nobody runs.
 */

import { describe, expect, it } from 'vitest';
import { createMinuteMeter } from '../src/usage/minute.js';
import { periodOf } from '../src/usage/periods.js';

const at = (iso: string): Date => new Date(iso);

describe('createMinuteMeter', () => {
  it('sums two adds in one minute', () => {
    const meter = createMinuteMeter();
    meter.add('policy:A3/tokens', 100, at('2026-10-20T12:00:05.000Z'));
    meter.add('policy:A3/tokens', 50, at('2026-10-20T12:00:59.999Z'));
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:00:30.000Z'))).toBe(150);
  });

  it('starts a key at zero in the next minute, and keeps the one before it', () => {
    const meter = createMinuteMeter();
    meter.add('policy:A3/tokens', 100, at('2026-10-20T12:00:05.000Z'));
    meter.add('policy:A3/tokens', 20, at('2026-10-20T12:01:05.000Z'));
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:01:30.000Z'))).toBe(20);
    // The minute before is still a window a call can be checked in, while its
    // records are still being written.
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:00:30.000Z'))).toBe(100);
  });

  it('drops a key unused for two minutes', () => {
    const meter = createMinuteMeter();
    meter.add('policy:A3/tokens', 100, at('2026-10-20T12:00:05.000Z'));
    meter.add('policy:A3/tokens', 7, at('2026-10-20T12:02:05.000Z'));
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:02:30.000Z'))).toBe(7);
    // The minute it began in is two minutes back, so nothing counts it any more.
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:00:30.000Z'))).toBe(0);
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:01:30.000Z'))).toBe(0);
  });

  it('adds a late record to the minute it is in, and never turns the window back', () => {
    const meter = createMinuteMeter();
    meter.add('policy:A3/tokens', 100, at('2026-10-20T12:01:05.000Z'));
    // A record written after one from the next minute still counts where it was.
    meter.add('policy:A3/tokens', 20, at('2026-10-20T12:00:30.000Z'));
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:00:45.000Z'))).toBe(20);
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:01:15.000Z'))).toBe(100);
    // A minute two back is gone, and its add does not move the window.
    meter.add('policy:A3/tokens', 5, at('2026-10-20T11:59:30.000Z'));
    expect(meter.sum('policy:A3/tokens', at('2026-10-20T12:01:15.000Z'))).toBe(100);
  });

  it('answers zero for a key it was never told about', () => {
    expect(createMinuteMeter().sum('policy:none/tokens', at('2026-10-20T12:00:00.000Z'))).toBe(0);
  });
});

describe('periodOf a minute', () => {
  it('begins at the minute of the clock in UTC, whatever the zone, and resets a minute later', () => {
    const start = periodOf('America/Campo_Grande', 'minute', at('2026-10-20T12:00:37.500Z'));
    expect(start).toEqual({ from: '2026-10-20T12:00:00.000Z', resets: '2026-10-20T12:01:00.000Z' });
  });
});
