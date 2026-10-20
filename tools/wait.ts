/*
 * How long a case waits for a condition by the clock before it fails.
 *
 * Most of the case's own budget - 20 s on Windows and 5 s elsewhere, in
 * `vitest.config.ts` - so a slow runner is given the time the case has, and
 * the wait still fails with its own words before vitest times the case out. A
 * fixed 3 s ran out on a busy Windows runner while two attachments were still
 * being written.
 */
export const WAIT_MS = process.platform === 'win32' ? 15_000 : 4_000;
