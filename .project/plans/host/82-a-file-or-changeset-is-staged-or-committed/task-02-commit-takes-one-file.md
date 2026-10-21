---
title: Commit takes one file
status: done
depends: [03]
layer: sdk
refs:
  - "[code://packages/sdk/src/sessions/changes.ts#L227-L256](../../../../packages/sdk/src/sessions/changes.ts#L227-L256) - `COMMIT` and `commitConfirmation`"
  - "[code://packages/sdk/src/sessions/changes.ts#L1328-L1364](../../../../packages/sdk/src/sessions/changes.ts#L1328-L1364) - commit in `invoke`"
---

## Objective

Commit takes one file or the whole changeset.
On one file it commits that path only, and other staged files stay staged.

## Files

- `UPDATE: packages/sdk/src/sessions/changes.ts:227-256` - `scopes: ['changeset', 'resource']`; the confirmation names the message, then what the whole changeset takes.
- `UPDATE: packages/sdk/src/sessions/changes.ts:1328-1364` - with a resource target, commit that path only.
- `UPDATE: packages/sdk/test/commit.test.ts` - one file, with another file staged and a third unstaged.
- `UPDATE: docs/sdk/AHP.md:697-710` - commit takes a file or the whole changeset.

## Steps

1. Add `'resource'` to the scopes of `COMMIT`.
2. Start the confirmation with "Commit as 'X'?".
3. End it with "The whole changeset takes 3 staged files." or "The whole changeset takes 4 files, 1 untracked."
4. With a resource target, refuse a folder and a path outside the directory, as discard does.
5. Run `git add -- <path>` so that git knows an untracked file.
6. Run `git commit --only -m <message> -- <path>`.
7. On a renamed row, pass the old path and the new path to both commands.
8. Answer as the whole-changeset commit does: the short sha and the subject.

## Validation

- One file commits that file's working-tree content, staged or not.
- Another staged file is still staged after the commit.
- An untracked file commits as a new file.
- A deleted file commits as a deletion.
- A renamed file commits as one rename.
- The whole-changeset commit works as before.
- The gates pass.

## Resume

- **Implemented** 2026-10-11 on `build/host82`, commit `4c4f5b8`.
- `packages/sdk/src/sessions/changes.ts:226-256` gives `COMMIT` the scopes `['changeset', 'resource']`. The confirmation is "Commit as 'X'? The whole changeset takes 3 staged files." or "Commit as 'X'? The whole changeset takes 4 files, 1 untracked."
- `packages/sdk/src/sessions/changes.ts:1339-1355` reads a resource target before the message is written. It refuses a path outside the directory and the folder itself, as discard does. On a renamed row it takes the old path from the row's `before` URI, so both paths go to git.
- `packages/sdk/src/sessions/changes.ts:1380-1403` runs `git add -- <paths>` for the paths that are on disk, then `git commit --only -m <message> -- <paths>`. The answer is the short sha and the subject, as for the whole changeset.
- **Departure 1.** `git add` is run only on paths that exist on disk. `add` refuses a path that is in neither the working tree nor the index. A staged deletion and the old path of a staged rename are such paths. `commit --only` records a missing path as deleted.
- **Departure 2.** The confirmation text changed in `commit.test.ts` and in `changes-refresh.test.ts:183`, which waited on the old sentence.
- `packages/sdk/test/commit.test.ts:559` adds 8 tests. They cover the scopes, an unstaged file with another file left staged, a staged file and an untracked file. They also cover the two kinds of deletion, the two kinds of rename, and the two refusals. The file has 45 tests.
- Gates: `pnpm build`, `pnpm typecheck` and `pnpm boundary` pass. The sdk suite passes 2760 tests in 141 files, and the server suite passes 901 tests in 46 files.
