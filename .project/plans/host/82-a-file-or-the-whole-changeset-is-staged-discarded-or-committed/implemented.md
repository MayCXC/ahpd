---
title: A file or the whole changeset is staged, unstaged, discarded or committed - implemented
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/changes.ts](../../../../packages/sdk/src/changes.ts)"
  - "[code://packages/sdk/test/commit.test.ts](../../../../packages/sdk/test/commit.test.ts)"
  - "[code://packages/sdk/test/changes-uris.test.ts](../../../../packages/sdk/test/changes-uris.test.ts)"
  - "[code://docs/AHP.md](../../../../docs/AHP.md)"
---

Stage, unstage, discard and commit each take one file or the whole changeset.
A call with no target is the whole changeset.
A renamed file's row has the old path in `before` and the new path in `after`.

## What was built

- [`code://packages/sdk/src/changes.ts`](../../../../packages/sdk/src/changes.ts) - `look()` keeps the old path of an `R` record and uses it for `before`. A rename from outside the directory is a new file.
- [`code://packages/sdk/src/changes.ts`](../../../../packages/sdk/src/changes.ts) - `DISCARD`, `STAGE` and `UNSTAGE` take the changeset scope. With no target, `invoke` acts on `.`. Discard runs `restore` and then `clean` on the whole directory. In a repository with no commit, discard on the whole changeset is refused.
- [`code://packages/sdk/src/changes.ts`](../../../../packages/sdk/src/changes.ts) - `COMMIT` takes the resource scope. One file is committed with `git commit --only`, and a renamed row passes both paths. The confirmation names the message first and then what the whole changeset takes.
- [`code://packages/sdk/test/commit.test.ts`](../../../../packages/sdk/test/commit.test.ts) - each operation on the whole changeset, and commit on one file over each kind of change.
- [`code://packages/sdk/test/changes-uris.test.ts`](../../../../packages/sdk/test/changes-uris.test.ts) - a rename's two URIs, from the repository root and from a subfolder.
- [`code://docs/AHP.md`](../../../../docs/AHP.md) - what each operation takes, and a rename's two URIs.

## Verified

- `pnpm build`, `pnpm typecheck` and `pnpm boundary` pass.
- The sdk suite passes 2760 tests in 141 files. The server suite passes 901 tests in 46 files.
- Reviewed on 2026-10-11, merged onto main: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages` pass, 5123 tests in 294 files.
- A scratch repository showed that discard on the whole changeset keeps ignored files, a nested repository and files outside the folder.

## Departures from the plan

- Discard on a folder that holds only untracked files: `restore` fails with "did not match", and that failure is not an error.
- `clean` through `git -C` on a folder that git does not track removes the files and then fails on the folder itself. Discard fails only when untracked files are left.
- Commit on one file runs `git add` only on the paths that are on disk. `add` refuses a staged deletion and the old path of a staged rename.
- A rename from outside the directory counts the file's lines, not the rename's numstat.

## Left for later

- Commit on the whole changeset with an empty index runs `add -A` over the whole repository, not only the session's folder. That was so before this plan.
