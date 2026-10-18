import { expect, it } from 'vitest';
import { mountParts } from '../src/manifest.js';

/*
 * Plan daemon/33 p6 task 02: a profile mount from a Windows host is
 * `C:\work:/work`, where the drive's colon comes before the one that divides
 * the pair. Read as a POSIX string it is a source named `C` and a target of
 * `\work:/work`, so the check refuses a mount that is one.
 */
it('reads a drive letter as part of the source', () => {
  expect(mountParts('C:\\work:/work')).toEqual({ source: 'C:\\work', target: '/work' });
});

it('keeps the drive when the mount is read-only', () => {
  expect(mountParts('C:\\work:/work:ro')).toEqual({ source: 'C:\\work', target: '/work' });
});
