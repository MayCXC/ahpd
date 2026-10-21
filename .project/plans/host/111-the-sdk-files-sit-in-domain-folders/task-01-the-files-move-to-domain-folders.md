---
title: The files move to domain folders
status: implemented
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src](../../../../packages/sdk/src) - the files that move"
  - "[code://packages/sdk/src/index.ts](../../../../packages/sdk/src/index.ts) - the exports, whose import paths change"
  - "[code://packages/sdk/test](../../../../packages/sdk/test) - the tests, whose import paths change"
---

## Objective

Each top-level file of `packages/sdk/src` that belongs to a domain moves to a folder for that domain.
Every import, every `.project` ref and every doc that names an old path names the new one.

| Folder | Files |
| --- | --- |
| `access/` | `users`, `people`, `issuers`, `tokens`, `policy`, `policies`, `decide`, `vault`, `commandautoapprover` |
| `usage/` | `usage`, `meter`, `charge`, `periods`, `scopes` |
| `resources/` | `resources`, `records`, `recordschannel`, `fileuri`, `attachments` |
| `plugins/` | `plugins`, `pluginparts`, `clientplugins`, `validate`, `enablement` |
| `automations/` | `automations`, `triggers`, `triggerpresets`, `cron`, `calllinks`, `wakemessage` |
| `sessions/` | `sessions`, `nested`, `remotesession`, `checkpoints`, `catalog`, `paging`, `changes`, `changewords`, `debuglogs` |
| `machines/` | `computers`, `machine`, `terminals`, `agents`, `shellenv` |
| `utils/` | `values`, `toolinput`, `jsonfile`, `frozen`, `timing`, `zip`, `pair`, `configvalues` |

The files `index`, `host`, `listen`, `rpc`, `version` and `vscoderootconfig` stay at the top level.

## Files

- `UPDATE: packages/sdk/src` - move 52 files with `git mv` to the folders in the table, and correct their relative imports.
- `UPDATE: packages/sdk/src/index.ts` - export from the new paths.
- `UPDATE: packages/sdk/test` - import from the new paths.
- `UPDATE: packages` - correct the tests in other packages that import a moved file by its path.
- `UPDATE: docs` - correct each path to a moved file.
- `UPDATE: .project` - correct each `code://` ref and each link to a moved file.
- `UPDATE: .project/plans/host/00-host.md` - name the domain folders, and correct the paths that are in `src/repo/` now.

## Steps

1. Move each file in the table with `git mv` and no other change in the same command.
2. Correct every relative import in `packages/sdk/src` until `pnpm -s typecheck` passes.
3. Correct the imports in `packages/sdk/test` and in the tests of other packages.
4. Write a script that replaces `packages/sdk/src/<file>.ts` with `packages/sdk/src/<folder>/<file>.ts` for each moved file.
5. Run the script on `.project` and `docs`, and keep the line numbers in each ref.
6. Make sure that no ref to `packages/sdk/src/types/` changed.
7. Update the Packages line in `00-host.md`.
8. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
- The vitest suite passes from the repository root.
- The `packages/computer` tests can time out on this machine, as they do on main.
- `rg "packages/sdk/src/<file>\.ts"` for each moved file finds nothing in `.project`, `docs` or `packages`.
- `ls packages/sdk/src/*.ts` shows only the six files that stay.

## Resume

- **Done so far:** every step. The 52 files in the table moved with `git mv` and kept their names. The imports in `packages/sdk/src`, `packages/sdk/test` and the other packages' tests follow them. A script replaced the old paths in `.project` and `docs`, and a check confirmed that only the inserted folder segment changed there. `00-host.md` names the eight domain folders. `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass. A default-worker run exited 1. The two-worker run this machine needs under load passed 387 files and 6463 tests, with 1 file and 22 tests skipped. `packages/sdk/test/fixtures/wire.jsonl` was unchanged after the tests.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:**
  - `src/terminals.ts` moves to `machines/`, and `src/host/terminals.ts` stays where it is.
  - A link in `.project` has `../` before `packages`, so match the path, not the start of the line.
  - `packages/sdk/test/fixtures/resource-write.json` still names the old `resources.ts` path in its `about` prose. It was left alone because the file is copied byte for byte into ahpc.
