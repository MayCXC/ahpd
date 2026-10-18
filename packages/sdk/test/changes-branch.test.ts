import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gitChanges } from '../src/changes.js';
import { uriOf } from '../src/fileuri.js';

/*
 * Branch Changes: what the branch of a worktree session has, since it was cut.
 *
 * The scope a session with `isolation: worktree` carries, and where the counts
 * of its row come from. It is not the uncommitted changeset and not Session
 * Changes: a session's work is mostly commits, and `git status` says nothing
 * at all about a file that was committed on the branch. What is counted is
 * everything since the branch and its base parted, committed or not.
 */

let made: string[] = [];
afterEach(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
  made = [];
});

/** Git's own answer, which is what the assertions are about. */
const gitIn = (dir: string, ...args: string[]): string =>
  execFileSync('git', ['-C', dir, ...args], { stdio: 'pipe' }).toString();

/** One git command, for the ones whose output nobody reads. */
const runIn = (dir: string, ...args: string[]): void => { execFileSync('git', ['-C', dir, ...args], { stdio: 'pipe' }); };

/** A repository with a commit on `main`, which is what a worktree is cut from. */
const repository = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-branch-'));
  made.push(dir);
  runIn(dir, 'init', '-q', '-b', 'main');
  runIn(dir, 'config', 'user.email', 'test@example.com');
  runIn(dir, 'config', 'user.name', 'Test');
  return dir;
};

const commitAll = (dir: string, message: string): void => {
  runIn(dir, 'add', '-A');
  runIn(dir, 'commit', '-q', '-m', message);
};

/** A branch off `main` with two commits on it, and a third file not committed. */
const branched = (): string => {
  const dir = repository();
  writeFileSync(join(dir, 'base.txt'), 'base\n');
  commitAll(dir, 'base');
  runIn(dir, 'checkout', '-q', '-b', 'work');
  writeFileSync(join(dir, 'first.txt'), 'first\n');
  commitAll(dir, 'first');
  writeFileSync(join(dir, 'second.txt'), 'second\n');
  commitAll(dir, 'second');
  writeFileSync(join(dir, 'third.txt'), 'third\n');
  return dir;
};

describe('what a branch has since it was cut', () => {
  it('shows the two commits and the file that is not one as one list', async () => {
    const dir = branched();
    const source = gitChanges();
    // The scope is offered for a directory git answered for, which is what the
    // host has read before it asks: `git status` is cached per directory.
    await source.refresh?.(dir);

    const state = await source.state(dir, 's1', 'branch', 'main');

    /*
     * The two committed files are the whole reason this scope exists: they are
     * not in `git status` at all, so the uncommitted changeset has never heard
     * of them, and a row that counted only that would say this session did
     * nothing.
     */
    expect(state?.files.map((one) => one.id)).toEqual([
      uriOf(join(dir, 'first.txt')),
      uriOf(join(dir, 'second.txt')),
      uriOf(join(dir, 'third.txt')),
    ]);
    expect(await source.branchSummary?.(dir, 'main')).toEqual({ files: 3, additions: 3, deletions: 0 });
  });

  it('reads each side from the commit the branch parted from, and counts a rename as one', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'kept.txt'), 'one\n');
    writeFileSync(join(dir, 'gone.txt'), 'gone\n');
    writeFileSync(join(dir, 'moved.txt'), 'moved\n');
    commitAll(dir, 'base');
    runIn(dir, 'checkout', '-q', '-b', 'work');
    writeFileSync(join(dir, 'kept.txt'), 'one\ntwo\n');
    writeFileSync(join(dir, 'added.txt'), 'added\n');
    commitAll(dir, 'first');
    runIn(dir, 'mv', 'moved.txt', 'renamed.txt');
    runIn(dir, 'rm', '-q', 'gone.txt');
    commitAll(dir, 'second');
    // One more line, after the last commit: the branch's work and the working
    // tree's are the same list, and this row is both of them at once.
    writeFileSync(join(dir, 'kept.txt'), 'one\ntwo\nthree\n');
    writeFileSync(join(dir, 'fresh.txt'), 'fresh\nlines\n');

    const source = gitChanges();
    await source.refresh?.(dir);
    const state = await source.state(dir, 's1', 'branch', 'main');
    const rows = new Map((state?.files ?? []).map((one) => [one.id, one]));
    const at = (name: string) => rows.get(uriOf(join(dir, name)));

    expect([...rows.keys()].sort()).toEqual([
      uriOf(join(dir, 'added.txt')),
      uriOf(join(dir, 'fresh.txt')),
      uriOf(join(dir, 'gone.txt')),
      uriOf(join(dir, 'kept.txt')),
      uriOf(join(dir, 'renamed.txt')),
    ]);
    // The committed line and the uncommitted one, counted together.
    expect(at('kept.txt')?.edit.diff).toEqual({ added: 2, removed: 0 });
    // A file the fork point does not have is a creation, and one it has and
    // the tree does not is a deletion: a side is left out rather than emptied.
    expect(at('added.txt')?.edit.before).toBeUndefined();
    expect(at('gone.txt')?.edit.after).toBeUndefined();
    expect(at('gone.txt')?.edit.diff).toEqual({ added: 0, removed: 1 });
    // Everything of a file git was never told about is an addition.
    expect(at('fresh.txt')?.edit.diff).toEqual({ added: 2, removed: 0 });
    // A rename is read under the name it came from, so the row shows a move
    // rather than a file that is all new.
    expect(at('renamed.txt')?.edit.before?.uri).toEqual(uriOf(join(dir, 'moved.txt')));
    expect(await source.read?.(at('renamed.txt')?.edit.before?.content.uri as string))
      .toMatchObject({ data: 'moved\n' });
    /*
     * And the anchored side is the fork point rather than `HEAD`: the file's
     * version at the last commit has two lines, and the one this row is read
     * against has one. Reading the wrong end would show the session's own
     * committed work as if the branch had found it there.
     */
    expect(await source.read?.(at('kept.txt')?.edit.before?.content.uri as string))
      .toMatchObject({ data: 'one\n' });
    expect(gitIn(dir, 'show', 'HEAD:kept.txt')).toBe('one\ntwo\n');
    expect(await source.branchSummary?.(dir, 'main')).toEqual({ files: 5, additions: 5, deletions: 1 });
  });

  it('prefers the remote\'s copy of the base, which is where the branch was cut', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'base.txt'), 'base\n');
    commitAll(dir, 'base');
    const forked = gitIn(dir, 'rev-parse', 'HEAD').trim();
    writeFileSync(join(dir, 'later.txt'), 'later\n');
    commitAll(dir, 'pushed');
    // What the person actually forked from, and what the branch is compared
    // against: the remote has it and their own `main` is behind it, having
    // never been fetched since.
    runIn(dir, 'update-ref', 'refs/remotes/origin/main', gitIn(dir, 'rev-parse', 'HEAD').trim());
    runIn(dir, 'checkout', '-q', '-b', 'work');
    writeFileSync(join(dir, 'first.txt'), 'first\n');
    commitAll(dir, 'first');
    runIn(dir, 'update-ref', 'refs/heads/main', forked);

    const source = gitChanges();
    const state = await source.state(dir, 's1', 'branch', 'main');

    // `later.txt` was pushed before this branch existed, so it is the base's
    // work and not this session's, however far behind the local name is.
    expect(state?.files.map((one) => one.id)).toEqual([uriOf(join(dir, 'first.txt'))]);
  });

  it('falls back to HEAD for a base this repository has never had', async () => {
    const dir = branched();
    const source = gitChanges();

    const state = await source.state(dir, 's1', 'branch', 'never-heard-of-it');

    // Nothing of the branch's own commits, since HEAD is where they are: what
    // is left is the working tree, which is the one side there is.
    expect(state?.files.map((one) => one.id)).toEqual([uriOf(join(dir, 'third.txt'))]);
  });

  it('is offered to a session with a worktree, and to no other', async () => {
    const dir = branched();
    const source = gitChanges();
    await source.refresh?.(dir);

    // A session in a directory rather than in a worktree of its own: the host
    // passes no base, because there is no branch that is this session's.
    expect(source.scopes(dir, 's1').map((one) => one.id)).not.toContain('branch');
    expect(source.scopes(dir, 's1', 'main').find((one) => one.id === 'branch'))
      .toMatchObject({ label: 'Branch Changes', changeKind: 'branch' });
    // And a base is the whole of what it takes to answer one.
    expect(await source.branchSummary?.(dir)).toBeUndefined();
  });
});
