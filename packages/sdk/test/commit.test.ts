import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { metaKeys } from '../../../tools/wire.mjs';
import { gitChanges } from '../src/changes.js';
import type { ChangeWords, ChangeWordsMode, ChangesetOperationContext } from '../src/types/changes.js';

/*
 * Staging and the commit form's arguments, on a real repository.
 *
 * Git is real because the question is what the index holds: the `_meta` a row
 * carries is `git status`'s two letters, and a commit that covers a selection
 * is `git add` and `git commit` run against that selection. A scripted source
 * would only prove the script.
 */

let made: string[] = [];
afterEach(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
  made = [];
});

const git = (dir: string, ...args: string[]): string =>
  execFileSync('git', ['-C', dir, ...args], { stdio: 'pipe' }).toString().trim();

/** Porcelain status with its two columns kept, which `git`'s trim would eat. */
const porcelain = (dir: string): string =>
  execFileSync('git', ['-C', dir, 'status', '--porcelain'], { stdio: 'pipe' }).toString().trimEnd();

/** A repository on `main` with one committed file. */
const repository = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-commit-'));
  made.push(dir);
  execFileSync('git', ['init', '-q', '-b', 'main', dir]);
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  writeFileSync(join(dir, 'tracked.txt'), 'one\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'first');
  return dir;
};

const invoke = (
  dir: string,
  meta: Record<string, unknown>,
  context: ChangesetOperationContext = {},
) => {
  const source = gitChanges();
  if (source.invoke === undefined) throw new Error('gitChanges() no longer runs operations');
  return source.invoke({ ...context, dir, session: 'ahp-session:/s', scope: 'uncommitted', operationId: 'commit', meta });
};

/** One invocation of any operation, pointed at a `file://` resource. */
const operate = (
  dir: string,
  operationId: string,
  resource?: string,
  context: ChangesetOperationContext = {},
) => {
  const source = gitChanges();
  if (source.invoke === undefined) throw new Error('gitChanges() no longer runs operations');
  return source.invoke({
    ...context,
    dir,
    session: 'ahp-session:/s',
    scope: 'uncommitted',
    operationId,
    ...(resource === undefined ? {} : { target: { kind: 'resource' as const, resource } }),
  });
};

describe('staging, as the changeset reports it', () => {
  it('marks a staged change and a working-tree change apart, and an untracked file as unstaged', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    writeFileSync(join(dir, 'fresh.txt'), 'new\n');
    git(dir, 'add', 'tracked.txt');
    const source = gitChanges();
    const state = await source.state?.(dir, 'ahp-session:/s', 'uncommitted');
    const meta = Object.fromEntries((state?.files ?? []).map((file) => [file.id, file._meta]));
    expect(meta[`file://${dir}/tracked.txt`]).toEqual({ 'ahpd.staged': true, 'ahpd.unstaged': false });
    expect(meta[`file://${dir}/fresh.txt`]).toEqual({ 'ahpd.staged': false, 'ahpd.unstaged': true });
  });

  it('says both when a staged file changed again, because a commit form must not hide half', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    git(dir, 'add', 'tracked.txt');
    writeFileSync(join(dir, 'tracked.txt'), 'three\n');
    const source = gitChanges();
    const state = await source.state?.(dir, 'ahp-session:/s', 'uncommitted');
    expect(state?.files?.[0]?._meta).toEqual({ 'ahpd.staged': true, 'ahpd.unstaged': true });
  });

  it('writes no `_meta` key on a row but the two a commit form is drawn from', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    writeFileSync(join(dir, 'fresh.txt'), 'new\n');
    git(dir, 'add', 'tracked.txt');
    const source = gitChanges();
    const state = await source.state?.(dir, 'ahp-session:/s', 'uncommitted');
    /*
     * The same census the wire test runs over the whole capture, over the rows
     * this file makes. `_meta` is the protocol's one open bag, so nothing else
     * closes it: a third key here reaches every client with no schema
     * noticing, and the two that are there are what a commit form is drawn
     * from.
     */
    expect([...new Set(metaKeys({ state }).map((one) => one.key))].sort()).toEqual(['ahpd.staged', 'ahpd.unstaged']);
  });

  it('keeps a staged rename as one row under its new name', async () => {
    const dir = repository();
    git(dir, 'mv', 'tracked.txt', 'new.txt');
    const source = gitChanges();
    const state = await source.state?.(dir, 'ahp-session:/s', 'uncommitted');
    const rows = state?.files ?? [];
    expect(rows.map((one) => one.id)).toEqual([`file://${dir}/new.txt`]);
    expect(rows[0]?._meta).toEqual({ 'ahpd.staged': true, 'ahpd.unstaged': false });
  });

  it('keeps a working-tree rename as one row under its new name', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'Data.txt'), 'data\n');
    git(dir, 'add', 'Data.txt');
    git(dir, 'commit', '-q', '-m', 'data');
    renameSync(join(dir, 'Data.txt'), join(dir, 'new.txt'));
    git(dir, 'add', '-N', 'new.txt');
    // Git's own view: the rename is in the working-tree column.
    expect(porcelain(dir)).toBe(' R Data.txt -> new.txt');
    const source = gitChanges();
    const state = await source.state?.(dir, 'ahp-session:/s', 'uncommitted');
    const rows = state?.files ?? [];
    expect(rows.map((one) => one.id)).toEqual([`file://${dir}/new.txt`]);
    expect(rows[0]?.edit.after).toBeDefined();
  });
});

describe('a session in a subfolder of its repository', () => {
  /** A repository with a committed `sub/kept.txt`, a new `sub/new.txt` and a new file at the root. */
  const nested = (): { dir: string; sub: string } => {
    const dir = repository();
    const sub = join(dir, 'sub');
    mkdirSync(sub);
    writeFileSync(join(sub, 'kept.txt'), 'kept\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'sub');
    writeFileSync(join(sub, 'new.txt'), 'one\ntwo\nthree\n');
    writeFileSync(join(dir, 'root.txt'), 'root\n');
    return { dir, sub };
  };

  it('lists a new file under its real path, and nothing outside the folder', async () => {
    const { dir, sub } = nested();
    const state = await gitChanges().state?.(sub, 'ahp-session:/s', 'uncommitted');
    const rows = state?.files ?? [];
    expect(rows.map((one) => one.id)).toEqual([`file://${dir}/sub/new.txt`]);
    expect(rows[0]?.edit.after?.uri).toBe(`file://${dir}/sub/new.txt`);
    expect(rows[0]?.edit.diff).toEqual({ added: 3, removed: 0 });
  });

  it('reads a changed file\'s before from the commit, and counts it', async () => {
    const { dir, sub } = nested();
    writeFileSync(join(sub, 'kept.txt'), 'kept\nmore\n');
    const source = gitChanges();
    await source.refresh?.(sub);
    const state = await source.state?.(sub, 'ahp-session:/s', 'uncommitted');
    const row = (state?.files ?? []).find((one) => one.id === `file://${dir}/sub/kept.txt`);
    expect(row?.edit.diff).toEqual({ added: 1, removed: 0 });
    const before = row?.edit.before?.content?.uri;
    expect(before).toBeDefined();
    expect((await source.read?.(before as string))?.data).toBe('kept\n');
  });

  it('stages and unstages a file from its row', async () => {
    const { dir, sub } = nested();
    const state = await gitChanges().state?.(sub, 'ahp-session:/s', 'uncommitted');
    const id = state?.files?.[0]?.id as string;
    await operate(sub, 'stage', id);
    expect(porcelain(dir)).toContain('A  sub/new.txt');
    await operate(sub, 'unstage', id);
    expect(porcelain(dir)).toContain('?? sub/new.txt');
  });
});

describe('the commit the changeset offers', () => {
  const offered = async (dir: string, subject: string) => {
    const source = gitChanges();
    await source.refresh?.(dir);
    return source.operations?.(dir, 'ahp-session:/s', 'uncommitted', { subject })
      ?.find((one) => one.id === 'commit')?.confirmation;
  };

  it('asks with the staged count and the subject when anything is staged', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'a.txt'), 'a\n');
    writeFileSync(join(dir, 'b.txt'), 'b\n');
    git(dir, 'add', 'a.txt', 'b.txt');
    git(dir, 'commit', '-q', '-m', 'both');
    writeFileSync(join(dir, 'a.txt'), 'a2\n');
    writeFileSync(join(dir, 'b.txt'), 'b2\n');
    git(dir, 'add', 'a.txt');
    expect(await offered(dir, 'Fix the build')).toBe("Commit as 'Fix the build'? The whole changeset takes 1 staged file.");
  });

  it('counts every file and the untracked ones when nothing is staged', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'a.txt'), 'a\n');
    writeFileSync(join(dir, 'b.txt'), 'b\n');
    git(dir, 'add', 'a.txt', 'b.txt');
    git(dir, 'commit', '-q', '-m', 'both');
    writeFileSync(join(dir, 'a.txt'), 'a2\n');
    writeFileSync(join(dir, 'b.txt'), 'b2\n');
    writeFileSync(join(dir, 'c.txt'), 'c\n');
    expect(await offered(dir, 'Fix the build')).toBe("Commit as 'Fix the build'? The whole changeset takes 3 files, 1 untracked.");
  });
});

describe('committing what is staged', () => {
  it('commits the index when anything is staged, and leaves the rest uncommitted', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'a.txt'), 'a\n');
    writeFileSync(join(dir, 'b.txt'), 'b\n');
    git(dir, 'add', 'a.txt', 'b.txt');
    git(dir, 'commit', '-q', '-m', 'both');
    writeFileSync(join(dir, 'a.txt'), 'a2\n');
    writeFileSync(join(dir, 'b.txt'), 'b2\n');
    writeFileSync(join(dir, 'c.txt'), 'c\n');
    git(dir, 'add', 'a.txt');
    const said = await invoke(dir, { 'ahpd.commit': { message: 'Only a\n\nand why' } });
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('Only a');
    expect(git(dir, 'log', '-1', '--format=%b')).toBe('and why');
    expect(git(dir, 'show', 'HEAD:a.txt')).toBe('a2');
    expect(git(dir, 'show', 'HEAD:b.txt')).toBe('b');
    // The file nobody staged and the untracked one are still there.
    expect(porcelain(dir)).toBe(' M b.txt\n?? c.txt');
    expect(said?.message).toContain('Only a');
  });

  it('commits the staged half of a file whose working tree moved on', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    git(dir, 'add', 'tracked.txt');
    writeFileSync(join(dir, 'tracked.txt'), 'three\n');
    await invoke(dir, { 'ahpd.commit': { message: 'Staged half' } });
    expect(git(dir, 'show', 'HEAD:tracked.txt')).toBe('two');
    expect(porcelain(dir)).toBe(' M tracked.txt');
  });

  it('falls back to the session title when no message is given', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    const source = gitChanges();
    if (source.invoke === undefined) throw new Error('gitChanges() no longer runs operations');
    await source.invoke({ dir, session: 'ahp-session:/s', scope: 'uncommitted', operationId: 'commit', subject: 'Fix the kqueue build' });
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('Fix the kqueue build');
  });

  it('stages everything and commits it when the index holds nothing', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    writeFileSync(join(dir, 'fresh.txt'), 'new\n');
    await invoke(dir, { 'ahpd.commit': { message: 'All of it' } });
    expect(porcelain(dir)).toBe('');
    expect(git(dir, 'show', '--stat', '--format=', 'HEAD')).toContain('fresh.txt');
  });

  it('counts any staged entry in a repository with no commit yet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ahpd-commit-'));
    made.push(dir);
    execFileSync('git', ['init', '-q', '-b', 'main', dir]);
    git(dir, 'config', 'user.email', 'test@example.com');
    git(dir, 'config', 'user.name', 'Test');
    writeFileSync(join(dir, 'first.txt'), 'one\n');
    git(dir, 'add', 'first.txt');
    await invoke(dir, { 'ahpd.commit': { message: 'First' } });
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('First');
    expect(git(dir, 'show', '--stat', '--format=', 'HEAD')).toContain('first.txt');
  });
});

describe('the key a commit message arrives under', () => {
  /** What the commit on top of `main` went in with. */
  const subjectOf = (dir: string): string => git(dir, 'log', '-1', '--format=%s');

  it('takes the message from `ahpd.commit`, this host\'s own name for it', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    await invoke(dir, { 'ahpd.commit': { message: 'Under my own name' } });
    expect(subjectOf(dir)).toBe('Under my own name');
  });

  it('ignores `ahp.commit`, a name this host no longer reads', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    await invoke(dir, { 'ahp.commit': { message: 'Under the old name' } });
    expect(subjectOf(dir)).toBe('Changes from an agent session');
  });

  it('takes it from `ahpd.commit` when a client sends both names', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    await invoke(dir, { 'ahpd.commit': { message: 'The new name' }, 'ahp.commit': { message: 'The old name' } });
    expect(subjectOf(dir)).toBe('The new name');
  });
});

/*
 * Where the words come from when the person gave none.
 *
 * The setting is the host's - `rootConfig.changeWords` reaches the source on
 * `ChangesetOperationContext` - so what is under test here is what the source
 * does with each mode. The two that ask are in `changewords.test.ts`, where the
 * prompt and the split of an answer live.
 */
describe('the mode that says where a commit message comes from', () => {
  /** The setting as the host hands it over: a mode, and an ask when it is one that asks. */
  const setting = (mode: ChangeWordsMode, ask?: ChangeWords['ask']): ChangeWords =>
    ({ setting: { mode }, ...(ask === undefined ? {} : { ask }) });

  it('refuses a commit with no message when the mode is forced', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    await expect(invoke(dir, {}, { changeWords: setting('forced') }))
      .rejects.toThrow('A commit message is required.');
    // Refused before anything was staged, so the tree is exactly as it was.
    expect(porcelain(dir)).toBe(' M tracked.txt');
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('first');
  });

  it('commits under a typed message in forced mode, because the mode is about the person giving none', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    await invoke(dir, { 'ahpd.commit': { message: 'Said it myself' } }, { changeWords: setting('forced') });
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('Said it myself');
  });

  it('keeps the session title as the words when nothing says otherwise', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    const said = await invoke(dir, {}, { subject: 'Fix the kqueue build' });
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('Fix the kqueue build');
    // Nothing fell back, so the operation says nothing about a mode.
    expect(said?.message).toBe('Committed ' + git(dir, 'rev-parse', '--short', 'HEAD') + ': Fix the kqueue build');
  });

  it('says nothing about falling back in the mode that is the fallback', async () => {
    const dir = repository();
    writeFileSync(join(dir, 'tracked.txt'), 'two\n');
    const said = await invoke(dir, {}, { subject: 'Fix the kqueue build', changeWords: setting('session-title') });
    expect(said?.message).not.toContain('session title was used');
  });
});

describe('what a resource target may name', () => {
  /**
   * A repository with `top.txt` and `sub/inside.txt` committed and then
   * changed, so the session's folder `sub/` is a subdirectory of the
   * repository and `../top.txt` is still inside git.
   */
  const nested = (): { repo: string; dir: string } => {
    const repo = repository();
    mkdirSync(join(repo, 'sub'));
    writeFileSync(join(repo, 'top.txt'), 'one\n');
    writeFileSync(join(repo, 'sub', 'inside.txt'), 'one\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'nested');
    writeFileSync(join(repo, 'top.txt'), 'two\n');
    writeFileSync(join(repo, 'sub', 'inside.txt'), 'two\n');
    return { repo, dir: join(repo, 'sub') };
  };

  it('refuses a target above the folder, by `..`, by a decoded one and by a symlink', async () => {
    const { repo, dir } = nested();
    symlinkSync(join(repo, 'top.txt'), join(dir, 'link.txt'));
    const refused = 'That file is not in this directory.';
    await expect(operate(dir, 'discard', `file://${repo}/sub/../top.txt`)).rejects.toThrow(refused);
    await expect(operate(dir, 'discard', `file://${repo}/sub/%2E%2E/top.txt`)).rejects.toThrow(refused);
    await expect(operate(dir, 'discard', `file://${dir}/link.txt`)).rejects.toThrow(refused);
    expect(porcelain(repo)).toContain(' M top.txt');
    expect(porcelain(repo)).toContain(' M sub/inside.txt');
  });

  it('stages a link inside the folder as the link, not the file it points at', async () => {
    const { repo, dir } = nested();
    symlinkSync('inside.txt', join(dir, 'alias.txt'));
    await operate(dir, 'stage', `file://${dir}/alias.txt`);
    expect(git(repo, 'diff', '--cached', '--name-only')).toBe('sub/alias.txt');
  });

  it('discards a file inside the folder and refuses the folder itself', async () => {
    const { repo, dir } = nested();
    const said = await operate(dir, 'discard', `file://${dir}/inside.txt`);
    expect(said?.message).toContain('inside.txt');
    expect(porcelain(repo)).toBe(' M top.txt');
    await expect(operate(dir, 'discard', `file://${dir}`)).rejects.toThrow();
  });
});

describe('staging from the changeset', () => {
  /** A tree with `a.txt` and `b.txt` changed and `new/c.txt` untracked. */
  const dirty = (): string => {
    const dir = repository();
    writeFileSync(join(dir, 'a.txt'), 'one\n');
    writeFileSync(join(dir, 'b.txt'), 'one\n');
    git(dir, 'add', 'a.txt', 'b.txt');
    git(dir, 'commit', '-q', '-m', 'both');
    writeFileSync(join(dir, 'a.txt'), 'two\n');
    writeFileSync(join(dir, 'b.txt'), 'two\n');
    mkdirSync(join(dir, 'new'));
    writeFileSync(join(dir, 'new', 'c.txt'), 'one\n');
    return dir;
  };

  const offered = async (dir: string, subject: string) => {
    const source = gitChanges();
    await source.refresh?.(dir);
    return source.operations?.(dir, 'ahp-session:/s', 'uncommitted', { subject }) ?? [];
  };

  it('offers stage and unstage on the uncommitted changeset', async () => {
    const ids = (await offered(dirty(), 'Fix the build')).map((one) => one.id);
    expect(ids).toContain('stage');
    expect(ids).toContain('unstage');
  });

  it('stages a file, a folder under it, and the folder itself', async () => {
    const dir = dirty();
    await operate(dir, 'stage', `file://${dir}/a.txt`);
    expect(porcelain(dir)).toBe('M  a.txt\n M b.txt\n?? new/');
    const commit = (await offered(dir, 'Fix the build')).find((one) => one.id === 'commit');
    expect(commit?.confirmation).toBe("Commit as 'Fix the build'? The whole changeset takes 1 staged file.");

    await operate(dir, 'stage', `file://${dir}/new/`);
    expect(porcelain(dir)).toBe('M  a.txt\n M b.txt\nA  new/c.txt');

    await operate(dir, 'stage', `file://${dir}`);
    expect(porcelain(dir)).toBe('M  a.txt\nM  b.txt\nA  new/c.txt');
  });

  it('unstages one file and leaves the rest, and the folder takes everything', async () => {
    const dir = dirty();
    await operate(dir, 'stage', `file://${dir}`);
    expect(porcelain(dir)).toBe('M  a.txt\nM  b.txt\nA  new/c.txt');

    await operate(dir, 'unstage', `file://${dir}/a.txt`);
    expect(porcelain(dir)).toBe(' M a.txt\nM  b.txt\nA  new/c.txt');

    await operate(dir, 'unstage', `file://${dir}`);
    expect(porcelain(dir)).toBe(' M a.txt\n M b.txt\n?? new/');
  });

  it('stages a clean file without an error', async () => {
    const dir = repository();
    const said = await operate(dir, 'stage', `file://${dir}/tracked.txt`);
    expect(said?.message).toContain('tracked.txt');
  });

  it('unstages in a repository with no commit yet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ahpd-commit-'));
    made.push(dir);
    execFileSync('git', ['init', '-q', '-b', 'main', dir]);
    git(dir, 'config', 'user.email', 'test@example.com');
    git(dir, 'config', 'user.name', 'Test');
    writeFileSync(join(dir, 'first.txt'), 'one\n');
    git(dir, 'add', 'first.txt');
    await operate(dir, 'unstage', `file://${dir}/first.txt`);
    expect(porcelain(dir)).toBe('?? first.txt');
  });
});

describe('the whole changeset as a target', () => {
  /**
   * A repository with `top.txt` and `sub/inside.txt` committed, both changed,
   * `sub/staged.txt` committed and changed and staged, and an untracked file
   * in `sub/new/` and at the root. The session's folder is `sub/`.
   */
  const nested = (): { repo: string; dir: string } => {
    const repo = repository();
    mkdirSync(join(repo, 'sub'));
    writeFileSync(join(repo, 'top.txt'), 'one\n');
    writeFileSync(join(repo, 'sub', 'inside.txt'), 'one\n');
    writeFileSync(join(repo, 'sub', 'staged.txt'), 'one\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'nested');
    writeFileSync(join(repo, 'top.txt'), 'two\n');
    writeFileSync(join(repo, 'sub', 'inside.txt'), 'two\n');
    writeFileSync(join(repo, 'sub', 'staged.txt'), 'two\n');
    git(repo, 'add', 'sub/staged.txt');
    mkdirSync(join(repo, 'sub', 'new'));
    writeFileSync(join(repo, 'sub', 'new', 'c.txt'), 'one\n');
    writeFileSync(join(repo, 'root.txt'), 'root\n');
    return { repo, dir: join(repo, 'sub') };
  };

  it('offers stage, unstage and discard on one file and on the whole changeset', async () => {
    const { dir } = nested();
    const source = gitChanges();
    await source.refresh?.(dir);
    const offered = source.operations?.(dir, 'ahp-session:/s', 'uncommitted', {}) ?? [];
    for (const id of ['stage', 'unstage', 'discard']) {
      expect(offered.find((one) => one.id === id)?.scopes).toEqual(['resource', 'changeset']);
    }
    expect(offered.find((one) => one.id === 'discard')?.confirmation).toBe('Discard these changes? This cannot be undone.');
  });

  it('stages every change under the folder, untracked included, and nothing outside it', async () => {
    const { repo, dir } = nested();
    const said = await operate(dir, 'stage');
    expect(said?.message).toBe('Staged every change');
    expect(porcelain(repo)).toBe('M  sub/inside.txt\nA  sub/new/c.txt\nM  sub/staged.txt\n M top.txt\n?? root.txt');
  });

  it('unstages every change under the folder and leaves the working tree as it was', async () => {
    const { repo, dir } = nested();
    git(repo, 'add', 'top.txt');
    await operate(dir, 'stage');
    const said = await operate(dir, 'unstage');
    expect(said?.message).toBe('Unstaged every change');
    expect(porcelain(repo)).toBe(' M sub/inside.txt\n M sub/staged.txt\nM  top.txt\n?? root.txt\n?? sub/new/');
    expect(git(repo, 'show', ':sub/inside.txt')).toBe('one');
    expect(git(repo, 'diff', '--', 'sub/inside.txt')).toContain('+two');
  });

  it('discards every change under the folder, untracked files too, and nothing outside it', async () => {
    const { repo, dir } = nested();
    const said = await operate(dir, 'discard');
    expect(said?.message).toBe('Discarded every change');
    expect(porcelain(repo)).toBe(' M top.txt\n?? root.txt');
    expect(git(repo, 'show', 'HEAD:sub/staged.txt')).toBe('one');
  });

  it('discards a folder that holds only untracked files', async () => {
    const { repo } = nested();
    const said = await operate(join(repo, 'sub', 'new'), 'discard');
    expect(said?.message).toBe('Discarded every change');
    expect(porcelain(repo)).not.toContain('sub/new');
  });

  it('refuses to discard every change in a repository with no commit yet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ahpd-commit-'));
    made.push(dir);
    execFileSync('git', ['init', '-q', '-b', 'main', dir]);
    writeFileSync(join(dir, 'first.txt'), 'one\n');
    writeFileSync(join(dir, 'second.txt'), 'two\n');
    git(dir, 'add', 'first.txt');
    await expect(operate(dir, 'discard')).rejects.toThrow('Nothing to discard to: this repository has no commit yet.');
    expect(existsSync(join(dir, 'first.txt'))).toBe(true);
    expect(existsSync(join(dir, 'second.txt'))).toBe(true);
  });

  it('still refuses a folder named as a resource for discard', async () => {
    const { dir } = nested();
    await expect(operate(dir, 'discard', `file://${dir}`)).rejects.toThrow('That operation takes one file, not a folder.');
  });
});

describe('committing one file', () => {
  /** A commit of the file at `resource` alone, under `message`. */
  const commitOne = (dir: string, resource: string, message: string) => {
    const source = gitChanges();
    if (source.invoke === undefined) throw new Error('gitChanges() no longer runs operations');
    return source.invoke({
      dir,
      session: 'ahp-session:/s',
      scope: 'uncommitted',
      operationId: 'commit',
      target: { kind: 'resource', resource },
      meta: { 'ahpd.commit': { message } },
    });
  };

  /** A tree with `a.txt` changed and unstaged, `b.txt` changed and staged, and `c.txt` changed and unstaged. */
  const three = (): string => {
    const dir = repository();
    for (const name of ['a.txt', 'b.txt', 'c.txt']) writeFileSync(join(dir, name), 'one\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'three');
    for (const name of ['a.txt', 'b.txt', 'c.txt']) writeFileSync(join(dir, name), 'two\n');
    git(dir, 'add', 'b.txt');
    return dir;
  };

  /** The paths the last commit touched, with git's status letter for each. */
  const touched = (dir: string): string => git(dir, 'show', '--name-status', '-M', '--format=', 'HEAD');

  it('offers commit on one file and on the whole changeset', async () => {
    const dir = three();
    const source = gitChanges();
    await source.refresh?.(dir);
    const commit = source.operations?.(dir, 'ahp-session:/s', 'uncommitted', {})?.find((one) => one.id === 'commit');
    expect(commit?.scopes).toEqual(['changeset', 'resource']);
  });

  it('commits the working tree of an unstaged file, and leaves the staged one staged', async () => {
    const dir = three();
    const said = await commitOne(dir, `file://${dir}/a.txt`, 'Only a');
    expect(touched(dir)).toBe('M\ta.txt');
    expect(git(dir, 'show', 'HEAD:a.txt')).toBe('two');
    expect(porcelain(dir)).toBe('M  b.txt\n M c.txt');
    expect(said?.message).toBe(`Committed ${git(dir, 'rev-parse', '--short', 'HEAD')}: Only a`);
  });

  it('commits a staged file and only that file', async () => {
    const dir = three();
    git(dir, 'add', 'c.txt');
    await commitOne(dir, `file://${dir}/b.txt`, 'Only b');
    expect(touched(dir)).toBe('M\tb.txt');
    expect(porcelain(dir)).toBe(' M a.txt\nM  c.txt');
  });

  it('commits an untracked file as a new file', async () => {
    const dir = three();
    writeFileSync(join(dir, 'fresh.txt'), 'new\n');
    await commitOne(dir, `file://${dir}/fresh.txt`, 'Fresh');
    expect(touched(dir)).toBe('A\tfresh.txt');
    expect(porcelain(dir)).toBe(' M a.txt\nM  b.txt\n M c.txt');
  });

  it('commits a deleted file as a deletion, staged or not', async () => {
    const dir = three();
    rmSync(join(dir, 'a.txt'));
    await commitOne(dir, `file://${dir}/a.txt`, 'Drop a');
    expect(touched(dir)).toBe('D\ta.txt');
    git(dir, 'rm', '-q', '-f', 'c.txt');
    await commitOne(dir, `file://${dir}/c.txt`, 'Drop c');
    expect(touched(dir)).toBe('D\tc.txt');
    expect(porcelain(dir)).toBe('M  b.txt');
  });

  it('commits a staged rename as one rename', async () => {
    const dir = three();
    git(dir, 'mv', 'tracked.txt', 'moved.txt');
    await commitOne(dir, `file://${dir}/moved.txt`, 'Move');
    expect(touched(dir)).toBe('R100\ttracked.txt\tmoved.txt');
    expect(porcelain(dir)).toBe(' M a.txt\nM  b.txt\n M c.txt');
  });

  it('commits a working-tree rename as one rename', async () => {
    const dir = three();
    renameSync(join(dir, 'tracked.txt'), join(dir, 'moved.txt'));
    git(dir, 'add', '-N', 'moved.txt');
    await commitOne(dir, `file://${dir}/moved.txt`, 'Move');
    expect(touched(dir)).toBe('R100\ttracked.txt\tmoved.txt');
    expect(porcelain(dir)).toBe(' M a.txt\nM  b.txt\n M c.txt');
  });

  it('refuses the folder itself and a file outside it', async () => {
    const dir = three();
    await expect(commitOne(dir, `file://${dir}`, 'All')).rejects.toThrow('That operation takes one file, not a folder.');
    await expect(commitOne(join(dir, 'sub'), `file://${dir}/a.txt`, 'Out')).rejects.toThrow('That file is not in this directory.');
    expect(git(dir, 'log', '-1', '--format=%s')).toBe('three');
  });
});
