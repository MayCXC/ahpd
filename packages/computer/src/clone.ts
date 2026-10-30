/**
 * How a session's code reaches a machine on another box's Docker.
 *
 * A machine on this host reads the host's objects through a read-only mount,
 * and a machine on another box has no path of this host's to mount. So its
 * repository is seeded from a git bundle of the tree's `HEAD`, made here and
 * copied in: the bundle holds every object the checkout needs, and no
 * credential reaches the box. The work comes back the way it does from any
 * machine with a repository of its own, by bring-back.
 */

import { gitArgv } from '@ahpd/sdk';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Where a seed bundle is put in a machine, and removed from once fetched. */
export const SEED_BUNDLE = '/tmp/ahpd-seed.bundle';

/**
 * The ref a bundle-seeded machine keeps the commit it was seeded at in.
 *
 * Bring-back measures a machine's work from the host's own branch, which a
 * machine on another box may not have: a person who commits on the host after
 * the seed makes a commit the machine never received. This ref is a commit
 * both sides have, so a bundle of the machine's work can be measured from it.
 */
export const SEED_REF = 'refs/ahpd/seed';

/** One git command in a tree on this host, with the argv every git here runs. */
const hostGit = (root: string, args: string[]): { code: number; stdout: string; stderr: string } => {
  const held = spawnSync('git', gitArgv(root, args), { encoding: 'utf8', windowsHide: true });
  return { code: held.status ?? 1, stdout: held.stdout ?? '', stderr: held.stderr ?? '' };
};

/**
 * A bundle of the tree's `HEAD`, in a directory only this process may read.
 *
 * `drop` removes it, whether the copy worked or not.
 */
export const bundleOfTree = (root: string): { file: string; drop: () => void } => {
  const scratch = mkdtempSync(join(tmpdir(), 'ahpd-seed-'));
  const file = join(scratch, 'seed.bundle');
  const drop = (): void => { rmSync(scratch, { recursive: true, force: true }); };
  const made = hostGit(root, ['bundle', 'create', '-q', file, 'HEAD']);
  if (made.code !== 0) {
    drop();
    throw new Error(`git bundle in ${root} exited ${String(made.code)}: ${made.stderr.trim() || 'no output'}`);
  }
  return { file, drop };
};

/**
 * The tree's `origin`, as a machine's checkout names it, or nothing.
 *
 * An `http:` or `https:` address may carry a user and a password, which is a
 * credential, so both are left out: the machine never pushes, and the address
 * is there so its checkout looks like any other.
 */
export const originOf = (root: string): string | undefined => {
  const said = hostGit(root, ['remote', 'get-url', 'origin']);
  const url = said.code === 0 ? said.stdout.trim() : '';
  if (url === '') return undefined;
  if (!/^https?:\/\//iu.test(url)) return url;
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  }
  catch { return undefined; }
};
