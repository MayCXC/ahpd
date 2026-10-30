import { posix } from '../../../tools/posix.ts';
import { machinePathOf } from '@ahpd/sdk';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { guardedMounts, gitInside, MACHINE_GIT_TARGET, runsAsHost } from '../src/gitdir.js';
import { dockerRuntime } from '../src/runtime.js';

/*
 * How a profile guards the git directory its machines see - decision
 * `a-machine-commits-in-its-own-repository-and-the-host-fetches-it`.
 *
 * `fetch` is the default and is what the rest of this package is about: a
 * machine gets a git directory of its own, and the whole of what it can reach
 * of the host's is in `computer-git-fetch.test.ts`, on a real Docker. `open` is
 * the operator's own choice for a machine they trust with the host's: the git
 * directory mounted writable in it, and nothing of it where the tree already
 * holds it, since the folder's own mount carries it there. So this file is the
 * guard itself, and the half of it this plan leaves as it was.
 */

/** A real repository with one commit and one linked worktree, every path resolved. */
const repository = () => {
  loose = mkdtempSync(join(tmpdir(), 'ahpd-git-guard-'));
  const repo = join(loose, 'repo');
  mkdirSync(repo);
  const run = (...args: string[]) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' });
  run('init', '-q', '-b', 'main');
  run('config', 'user.email', 'test@example.com');
  run('config', 'user.name', 'Test');
  mkdirSync(join(repo, 'src'));
  writeFileSync(join(repo, 'src', 'tracked.txt'), 'tracked\n');
  run('add', '-A');
  run('commit', '-q', '-m', 'first');
  const tree = join(loose, 'tree');
  run('worktree', 'add', '-q', '-b', 'work', tree);
  return { repo, tree, gitDir: join(repo, '.git'), state: join(loose, 'config') };
};

let loose: string | undefined;
afterEach(() => {
  if (loose !== undefined) rmSync(loose, { recursive: true, force: true });
  loose = undefined;
});

it('gives a machine a git directory of its own where no guard is named', () => {
  const { tree, gitDir, state } = repository();

  // `fetch` is the default, and nothing of the host's git directory reaches the
  // machine writable under it: the volume is its own, and no bind of the host's
  // is anything but read-only.
  const mounts = guardedMounts(gitDir, tree, state);
  expect(mounts?.volume).toBe(MACHINE_GIT_TARGET);
  expect((mounts?.binds ?? []).every((one) => one.readOnly)).toBe(true);
  expect(runsAsHost(gitDir, tree)).toBe(true);
});

it('mounts the host\'s git directory read-write where the tree does not hold it, under open', () => {
  const { tree, gitDir, state } = repository();

  // A linked worktree's git directory is not inside the tree, so the machine
  // gets a mount of it on its own - writable, which is the whole of what `open`
  // chooses - and no volume of its own. On Windows the tree's `.git` names its
  // entry by a drive path, so a file naming it by its machine path is bound
  // over it, read-only; elsewhere there is no gitfile.
  const mounts = guardedMounts(gitDir, tree, state, 'open');
  const file = mounts?.gitfile;
  const named = process.platform === 'win32' ? [{ path: file, target: machinePathOf(join(tree, '.git')), readOnly: true }] : [];
  expect(mounts).toEqual({ binds: [{ path: gitDir, readOnly: false }, ...named], ...(named.length > 0 ? { gitfile: file } : {}) });
  // Mounted on its own, so the machine's commands are still the host user's.
  expect(runsAsHost(gitDir, tree, 'open')).toBe(true);
});

// Windows only: elsewhere the machine path is the host's, and the tree's own `.git` is right.
it.skipIf(process.platform !== 'win32')('names a worktree\'s entry by its machine path under open, in a file of its own', () => {
  const { tree, gitDir, state } = repository();
  const file = guardedMounts(gitDir, tree, state, 'open')?.gitfile ?? '';
  expect(basename(file)).toMatch(/^open-[0-9a-f]{12}\.gitfile$/);
  expect(readFileSync(file, 'utf8')).toBe(`gitdir: ${machinePathOf(join(gitDir, 'worktrees', basename(tree)))}\n`);
  // The tree's own file is left as git wrote it.
  expect(readFileSync(join(tree, '.git'), 'utf8')).toMatch(/^gitdir: [A-Za-z]:/);
});

it('mounts nothing under open where the tree already holds the git directory', () => {
  const { repo, gitDir, state } = repository();

  // A main checkout's git directory is inside the tree, which the folder's own
  // mount already carries, so a second mount of the same path would be a
  // duplicate mount point and Docker would refuse the machine.
  expect(guardedMounts(gitDir, repo, state, 'open')).toBeUndefined();
  // And nothing is mounted for it, so the machine keeps the image's user.
  expect(runsAsHost(gitDir, repo, 'open')).toBe(false);
});

it('says a git directory is inside the tree however the tree is reached', () => {
  const { repo, gitDir } = repository();
  const link = join(dirname(repo), 'link');
  // A junction on Windows, which links a folder with no privilege and reads as a link.
  symlinkSync(repo, link, posix ? 'dir' : 'junction');

  // git answers real paths and a session's folder may be a link to the tree, so
  // the answer is on real paths: the git directory is inside either way, and
  // the machine reaches it through the folder's own mount.
  expect(gitInside(gitDir, repo)).toBe(true);
  expect(gitInside(gitDir, link)).toBe(true);
  expect(gitInside(`${link}/.git`, repo)).toBe(true);
  expect(guardedMounts(`${link}/.git`, link, join(dirname(repo), 'config'), 'open')).toBeUndefined();
});

/** The image: one with `git` in it and no entrypoint, which the runtime's `sleep infinity` would replace. */
const IMAGE = 'node:22';
const LABEL = 'ahpd.gitguard=1';
// Windows has no uid, and a machine made there runs as the image's own user.
const ME = process.getuid === undefined ? undefined : `${String(process.getuid())}:${String(process.getgid?.())}`;
/** The user a machine runs as, where this host has one to give it. */
const AS_ME = ME === undefined ? {} : { user: ME };

/**
 * The budget of a case that runs a real container: a fresh runner pulls
 * `node:22` first, which alone takes far longer than vitest's 5 s default.
 */
const DOCKER_CASE = 120_000;

/** Whether a Docker daemon that runs Linux images answers here, which is what the case below needs. */
const answers = (): boolean => {
  try {
    // A Windows runner's engine answers too, but runs no Linux image.
    return execFileSync('docker', ['version', '--format', '{{.Server.Os}}'], { stdio: 'pipe' }).toString().trim() === 'linux';
  }
  catch { return false; }
};

const DOCKER = answers();

/** The branch a worktree has checked out, as the host's git answers it. */
const headOf = (repo: string, branch: string): string =>
  execFileSync('git', ['-C', repo, 'log', '--oneline', '-1', branch], { encoding: 'utf8' }).trim();

it.skipIf(!DOCKER)('commits into the host\'s git directory from a machine its profile leaves open', async () => {
  const { repo, tree, gitDir, state } = repository();
  const docker = dockerRuntime({ command: 'docker', label: LABEL, configDir: state });
  const name = `ahpd-gitguard-open-${String(process.pid)}`;
  await docker.run({ name, image: IMAGE, label: LABEL, folder: tree, gitDir, gitGuard: 'open', ...AS_ME });
  try {
    writeFileSync(join(tree, 'src', 'tracked.txt'), 'changed in the machine\n');
    // The host's own git directory is mounted writable in the machine, so a
    // commit in there is a commit on the host - which is what `open` chooses,
    // and what `fetch`, the default, does not.
    expect((await docker.exec(name, ['git', '-C', machinePathOf(tree), 'add', '-A'])).code).toBe(0);
    expect((await docker.exec(name, ['git', '-C', machinePathOf(tree), 'commit', '-q', '-m', 'from the machine'])).code).toBe(0);
    expect(headOf(repo, 'work')).toContain('from the machine');
  }
  finally {
    await docker.remove(name).catch(() => {});
  }
}, DOCKER_CASE);
