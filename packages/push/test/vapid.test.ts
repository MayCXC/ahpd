import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { loadVapid } from '../src/vapid.js';
import { posix } from '../../../tools/posix.ts';

/*
 * The host's VAPID key pair.
 *
 * The pair is a file under the daemon's configuration folder, so every case
 * here is a folder of this test's own: one that has never had a pair, one that
 * has the pair a load made, and one whose file a person or a disk broke.
 */

/** A temporary directory removed after the test that made it. */
let loose: string | undefined;
afterEach(() => {
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});

/** A directory of this test's own, kept until the test ends. */
const dir = (): string => (loose ??= mkdtempSync(join(tmpdir(), 'ahpd-vapid-')));

it('makes a pair at the first load, and keeps the same one after', () => {
  const where = dir();
  const first = loadVapid(where, () => {});
  expect(first).toBeDefined();
  // The public key a browser takes is the 65-octet uncompressed point.
  expect(Buffer.from(first?.publicKey ?? '', 'base64url')).toHaveLength(65);
  expect(Buffer.from(first?.publicKey ?? '', 'base64url')[0]).toBe(0x04);

  const second = loadVapid(where, () => {});
  expect(second?.publicKey).toBe(first?.publicKey);
});

it.skipIf(!posix)('writes the pair at a mode only its owner may read', () => {
  const where = dir();
  loadVapid(where, () => {});
  expect(statSync(join(where, 'push-vapid.json')).mode & 0o777).toBe(0o600);
});

it('logs one line and answers no pair when the file is not JSON', () => {
  const where = dir();
  writeFileSync(join(where, 'push-vapid.json'), '{');
  const problems: string[] = [];
  expect(loadVapid(where, (line) => { problems.push(line); })).toBeUndefined();
  expect(problems).toHaveLength(1);
  // Not replaced: every subscription was made against the pair this file holds.
  expect(readFileSync(join(where, 'push-vapid.json'), 'utf8')).toBe('{');
});

it('logs one line and answers no pair when the file holds no P-256 pair', () => {
  const where = dir();
  writeFileSync(join(where, 'push-vapid.json'), JSON.stringify({ privateKey: { kty: 'EC', crv: 'P-256', x: 'short', y: 'short' } }));
  const problems: string[] = [];
  expect(loadVapid(where, (line) => { problems.push(line); })).toBeUndefined();
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain('P-256');
});
