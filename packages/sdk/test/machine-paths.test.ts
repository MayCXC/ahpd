import { expect, it } from 'vitest';
import { hostPathOf, machinePathOf } from '../src/machines/machine.js';

/*
 * A host path as it is inside a machine, and back.
 *
 * Both rules are asked by name, so a Linux run checks the Windows one too: on
 * Linux the pair is the path itself, and only the Windows rule translates.
 */

it('mounts a Windows folder at its drive-style path, with either separator', () => {
  expect(machinePathOf('C:\\Users\\ana\\proj', 'win32')).toBe('/c/Users/ana/proj');
  expect(machinePathOf('C:/Users/ana/proj', 'win32')).toBe('/c/Users/ana/proj');
  expect(machinePathOf('d:\\work\\', 'win32')).toBe('/d/work');
});

it('mounts a drive itself at its letter', () => {
  expect(machinePathOf('C:\\', 'win32')).toBe('/c');
  expect(machinePathOf('C:', 'win32')).toBe('/c');
  expect(hostPathOf('/c', 'win32')).toBe('C:\\');
});

it('reads a drive-style machine path back as the Windows path it names', () => {
  expect(hostPathOf('/c/Users/ana/proj', 'win32')).toBe('C:\\Users\\ana\\proj');
  expect(hostPathOf(machinePathOf('C:\\Users\\ana\\proj', 'win32'), 'win32')).toBe('C:\\Users\\ana\\proj');
});

it('leaves a machine path that names no drive as it is', () => {
  // A part, or anything else that lives only inside the machine.
  expect(hostPathOf('/ahpd/pi', 'win32')).toBe('/ahpd/pi');
  expect(hostPathOf('/opt/ahpd/node/bin', 'win32')).toBe('/opt/ahpd/node/bin');
});

it('is the path itself on Linux and macOS, both ways', () => {
  for (const platform of ['linux', 'darwin'] as const) {
    expect(machinePathOf('/home/ana/proj', platform)).toBe('/home/ana/proj');
    expect(hostPathOf('/home/ana/proj', platform)).toBe('/home/ana/proj');
    // A one-letter folder at the root is a folder there, not a drive.
    expect(hostPathOf('/c/work', platform)).toBe('/c/work');
  }
});
