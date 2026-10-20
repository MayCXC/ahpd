---
title: A client's path is read by the host's rules
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: sdk, server, bot, tests
refs:
  - "[code://packages/sdk/src/fileuri.ts](../../../../packages/sdk/src/fileuri.ts) - `localPath`, a URI with no drive on Windows"
  - "[code://packages/sdk/src/resources.ts](../../../../packages/sdk/src/resources.ts) - `pathOf`, which refuses a URI naming another machine"
  - "[code://packages/sdk/src/tools/session.ts](../../../../packages/sdk/src/tools/session.ts) - `pathOf`, the folder `set_workspace` and `create_session` are given"
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts) - `browsable`, the folders a host serves"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `workspaceFor`, a bot's folder"
  - "[code://packages/server/src/commands/automation.ts](../../../../packages/server/src/commands/automation.ts) - `folderOfDirectory`"
---

## Objective

On a Windows host, every path and `file:` URI a client or an agent sends is read by the host's own rules, and the Windows run's path, mode and cleanup cases pass.

## Files

- `UPDATE: packages/sdk/src/fileuri.ts` - a URI with no drive is decoded by POSIX rules on Windows, where Node's reader refused it and left its escapes in.
- `UPDATE: packages/sdk/src/resources.ts` - a URI naming another machine is refused on every system; on Windows it was read as a network path. A URI with no drive is read as `localPath` reads it.
- `UPDATE: packages/sdk/src/tools/session.ts` - `pathOf` reads a path with `isAbsolute` and `resolve`, so `set_workspace` and `create_session` take a Windows folder.
- `UPDATE: packages/sdk/src/host.ts` - `browsable` resolves the folders it serves, so a folder's facts are kept and read under one spelling.
- `UPDATE: packages/bot/src/provider.ts` - a bot's folder is `join(root, slug)`.
- `UPDATE: packages/server/src/commands/automation.ts` - `folderOfDirectory` reads a URI with `localPath`.
- `UPDATE: packages/*/test` - expected paths and URIs come from `join`, `resolve` and `uriOf`; a mode check, a bash command line and a link to a file are POSIX-only with their reasons; four cleanups are awaited with retries; `--import` takes a URL; a restart case outlasts Windows' timer.

## Steps

1. Take the path, mode and cleanup failures from the Windows run of PR 25.
2. Find each cause, and fix the product where it read a path or a URI by POSIX rules.
3. Refuse a `file:` URI with a host, which on Windows would make the daemon connect to a server a client named.
4. Build the tests' expectations the system's way, and skip what is POSIX by nature with its reason.
5. Run the tests and the typecheck.
6. Set this task and the plan row to `implemented`.

## Validation

- The files this task names pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, in the runner-like setup: the host file, tool, attachment, catalogue, GitHub, bot, cofold, server and mode tests pass.
`pnpm -s typecheck` and `pnpm -s boundary` pass.
On Windows, `set_workspace` and `create_session` refused or mangled every Windows folder, a session's GitHub facts never arrived for a host whose folder was given in POSIX form, and a `file://server/...` URI would have been opened as a network path.
The Linux half of Validation is the CI run of the branch.
