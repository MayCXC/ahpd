/*
 * Where `@ahpd/server` is installed, read off folders this test makes.
 *
 * The update replaces the package the running code came from, so the first
 * question it asks is which npm install that is: a global one, whose prefix npm
 * is given with `-g`, or a folder whose own `package.json` made it a project,
 * which npm is given with `--prefix`. A checkout and a linked package are the
 * two it cannot replace, and both are refused with the same sentence naming the
 * folder that would have to be updated by hand.
 *
 * The Windows cases are paths a Windows machine would have, with the folder
 * checks answered by the test: the layout is what is being read, and it does not
 * change because the suite runs on Linux.
 */

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installPlace } from '../src/selfupdate.js';

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'ahpd-place-')); });
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

/** A folder holding a `package.json`, which is what a prefix install and a checkout both have. */
const manifestIn = (folder: string): string => {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'package.json'), `${JSON.stringify({ name: '@ahpd/server', version: '1.0.0' })}\n`);
  return folder;
};

/** The sentence a refusal threw. */
const refusal = (work: () => unknown): string => {
  try { work(); }
  catch (error) { return error instanceof Error ? error.message : String(error); }
  throw new Error('it was not refused');
};

describe('the install place', () => {
  it('answers the prefix of a global install on Linux and macOS', () => {
    const prefix = join(root, 'usr-local');
    const server = manifestIn(join(prefix, 'lib', 'node_modules', '@ahpd', 'server'));
    for (const platform of ['linux', 'darwin'] as const) {
      expect(installPlace({ root: server, platform })).toEqual({ kind: 'global', prefix });
    }
  });

  it('answers the prefix of a global install on Windows', () => {
    const prefix = 'C:\\Users\\ana\\AppData\\npm';
    const server = 'C:\\Users\\ana\\AppData\\npm\\node_modules\\@ahpd\\server';
    // Nothing of npm's own making is at the prefix: the folder only holds the
    // packages npm installed there.
    expect(installPlace({ root: server, platform: 'win32', exists: () => false, real: (path) => path }))
      .toEqual({ kind: 'global', prefix });
  });

  it('answers a folder with its own package.json as a prefix install', () => {
    const folder = join(root, 'project');
    const server = manifestIn(join(folder, 'node_modules', '@ahpd', 'server'));
    manifestIn(folder);
    expect(installPlace({ root: server, platform: 'linux' })).toEqual({ kind: 'prefix', prefix: folder });

    // The same layout on Windows is a project too when the folder says so, and
    // a global install only when it does not.
    const windows = 'C:\\work\\project';
    const windowsServer = 'C:\\work\\project\\node_modules\\@ahpd\\server';
    const exists = (path: string): boolean => path.endsWith('package.json');
    expect(installPlace({ root: windowsServer, platform: 'win32', exists, real: (path) => path }))
      .toEqual({ kind: 'prefix', prefix: windows });
  });

  it('refuses a linked package, naming the link and nothing behind it', () => {
    const install = join(root, 'lib', 'node_modules', '@ahpd');
    mkdirSync(install, { recursive: true });
    const elsewhere = manifestIn(join(root, 'source'));
    const link = join(install, 'server');
    symlinkSync(elsewhere, link, 'dir');

    const said = refusal(() => installPlace({ root: link, platform: 'linux' }));
    expect(said).toContain(link);
    expect(said).not.toContain(elsewhere);
    expect(said).toContain('by hand');
  });

  it('refuses a checkout, naming the folder and nothing else', () => {
    const checkout = manifestIn(join(root, 'packages', 'server'));
    const said = refusal(() => installPlace({ root: checkout, platform: 'linux' }));
    expect(said).toContain(checkout);
    expect(said).toContain('by hand');
  });

  it('refuses a folder whose package.json would make it a prefix npm did not install into', () => {
    const folder = join(root, 'project');
    manifestIn(folder);
    // `<dir>/node_modules/@ahpd/server` with no package.json at `<dir>` is not
    // an install this update can name a prefix for.
    const server = join(folder, 'node_modules', '@ahpd', 'server');
    expect(refusal(() => installPlace({ root: server, platform: 'linux' }))).toContain(server);
  });
});
