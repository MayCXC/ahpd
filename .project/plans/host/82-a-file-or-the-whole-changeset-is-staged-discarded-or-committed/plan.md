---
title: A file or the whole changeset is staged, unstaged, discarded or committed
domain: host
status: active
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
refs:
  - "[code://packages/sdk/src/changes.ts#L227-L285](../../../../packages/sdk/src/changes.ts#L227-L285) - `COMMIT`, `commitConfirmation`, `DISCARD`, `STAGE` and `UNSTAGE`, each with its scopes"
  - "[code://packages/sdk/src/changes.ts#L1328-L1432](../../../../packages/sdk/src/changes.ts#L1328-L1432) - `invoke` for commit, discard, stage and unstage"
  - "[code://packages/sdk/src/changes.ts#L588-L680](../../../../packages/sdk/src/changes.ts#L588-L680) - `look()`, which reads `git status` and drops the path a rename came from"
  - "[code://packages/sdk/src/host/resourcemethods.ts#L300-L315](../../../../packages/sdk/src/host/resourcemethods.ts#L300-L315) - no target is the changeset, and the host refuses a target kind the operation does not list"
  - "[code://packages/sdk/test/commit.test.ts](../../../../packages/sdk/test/commit.test.ts) - the commit tests over a real repository"
  - "[code://docs/AHP.md#L697-L710](../../../../docs/AHP.md#L697-L710) - what the docs say each operation takes"
  - https://github.com/microsoft/vscode/blob/51ac693b174/src/vs/platform/agentHost/node/agentHostCommitOperationProvider.ts#L53 - VS Code's commit takes the changeset only
  - https://github.com/microsoft/vscode/blob/51ac693b174/src/vs/platform/agentHost/node/agentHostDiscardChangesOperationProvider.ts#L45-L47 - VS Code's discard takes one file only
---

## Goal

A client asks for one file or for the whole changeset when it stages, unstages, discards or commits.
Today stage, unstage and discard take one file, and commit takes the whole changeset only.
A renamed file also says which path it came from, so a client can show it as a rename.

ahpc's plan screen/11 is the client side.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "scopes:" packages/sdk/src/changes.ts` - commit has `['changeset']`; discard, stage, unstage and revert have `['resource']`.
- `rg -n "target\?.kind \?\? 'changeset'" packages/sdk/src/host` - the host already passes a call with no target as the changeset.
- `rg -n "/\[RC\]/" packages/sdk/src/changes.ts` - `look()` skips the record that names the old path of a rename.

### Gaps

- A rename's row has the new path on both sides, so a client sees it as an edit.
- The commit confirmation counts the whole changeset, which is wrong for one file.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| Stage, unstage and discard also take the whole changeset; the client sends one call with no target | Softov, 2026-10-11, asked "For stage, unstage and discard, how should All files work?", answered "host takes the whole set" | 01 |
| Commit also takes one file, and commits that path only; other staged files stay staged | Softov, 2026-10-11, asked "For commit, how should This file work?", answered "host commits one file" | 02 |
| Revert keeps one file only | (defaulted: Softov named commit, discard, stage and unstage) | - |
| A rename's `before` URI is the path it came from, and its content is read from HEAD at that path | (defaulted: the protocol shows a rename as two URIs, and the client derives its letter from that) | 03 |
| No new `_meta` key for the git letter; the client derives it from `before`, `after` and `ahpd.staged` | (defaulted: the protocol and the current `_meta` carry everything but the rename) | 03 |
| The discard confirmation names no file: "Discard these changes? This cannot be undone." | (defaulted: one confirmation serves both targets) | 01 |
| The commit confirmation names the message and what the whole changeset takes: "Commit as 'X'? The whole changeset takes 3 staged files." | (defaulted: one confirmation serves both targets) | 02 |

## Proposed architecture

- **Data flow** - a rename's row gets `before.uri` from the old path; nothing else in a row changes.
- **Event flow** - `invoke` reads `target`: none is the whole directory, a resource is one path.
- **Layer responsibilities** - `packages/sdk/src/changes.ts` only; the host already routes both target kinds.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Stage, unstage and discard take the whole changeset](task-01-stage-unstage-and-discard-take-the-whole-changeset.md) | implemented | - |
| [02 - Commit takes one file](task-02-commit-takes-one-file.md) | implemented | 03 |
| [03 - A rename names the path it came from](task-03-a-rename-names-the-path-it-came-from.md) | implemented | - |

## Risks and tradeoffs

- Discard on the whole changeset removes untracked files too. That cannot be undone, and the confirmation says so.
- Both new scopes go past VS Code, which offers commit on the changeset only and discard on one file only. VS Code's client reads `scopes` and shows only what it uses, so nothing breaks there.
- Commit on a renamed row commits both paths, or git records an add and a delete in two commits.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are implemented on `build/host82`. See [implemented.md](implemented.md).
- **Next action:** Softov reviews the build.
- **Open questions:** none.

## Final verification checklist

- [x] `pnpm build`, `pnpm typecheck` and `pnpm boundary` pass.
- [x] `commit.test.ts` covers each operation on one file and on the whole changeset, over a real repository.
- [x] A rename test shows the old path in `before` and the new one in `after`.
- [x] `docs/AHP.md` says what each operation takes.
- [x] `plans/index.md` updated.
