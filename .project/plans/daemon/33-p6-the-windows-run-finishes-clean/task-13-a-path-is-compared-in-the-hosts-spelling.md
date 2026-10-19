---
title: A path is compared in the host's spelling
status: implemented
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: sdk, computer, tests
refs:
  - "[code://packages/sdk/src/commandautoapprover.ts](../../../../packages/sdk/src/commandautoapprover.ts) - `patternsAllow`, a write's path against the auto-approve patterns"
  - "[code://packages/sdk/src/changes.ts](../../../../packages/sdk/src/changes.ts) - `folded`, the key a changeset's side is kept under"
  - "[code://packages/computer/src/runtime.ts](../../../../packages/computer/src/runtime.ts) - `within`, where a host path is inside a machine"
  - "[code://packages/computer/test/fixtures/docker.mjs](../../../../packages/computer/test/fixtures/docker.mjs) - `mountParts`, the fake docker's mounts"
  - "[code://packages/sdk/test/users-gate-helpers.ts](../../../../packages/sdk/test/users-gate-helpers.ts) - `host`, which closes what it made"
---

## Objective

On a Windows host, a path is compared with a pattern, a key or a mount in the spelling Windows reads it in, and the last cases of the Windows run pass.

## Files

- `UPDATE: packages/sdk/src/commandautoapprover.ts` - `patternsAllow` tests a path with `/` separators on Windows. A pattern is written with `/`, so the denial for `.git` never matched `C:\repo\.git\config` while the allow-all pattern did: a redirect into `.git` was auto-approved on Windows.
- `UPDATE: packages/sdk/src/changes.ts` - `folded` makes the separators one on Windows, so a side a checkpoint named with `/` is the file a URI names with `\`.
- `UPDATE: packages/computer/src/runtime.ts` - `within` compares a path and a mount's source with one separator and no case on Windows, and gives the rest inside the machine with `/`.
- `UPDATE: packages/computer/test/fixtures/docker.mjs` - `mountParts` keeps a drive letter in a mount's source, as `manifest.ts` does.
- `UPDATE: packages/sdk/test/users-gate-helpers.ts` - `host` keeps every host it made, and the cleanup closes each before the folder goes: a shell left running holds its folder on Windows.
- `UPDATE: packages/*/test` - a case's folder is one the system has, from `tmpdir()`, and its URIs come from `uriOf`; a file a shell would write is written directly; a folder link is a junction on Windows; the devtunnel case with a shell-script CLI is POSIX-only with its reason; waits that counted timer ticks wait on the clock or on a promise; two slow cases get 20 s.

## Steps

1. Take the failures left in the Windows run of PR 25 after task 12.
2. Find each cause, and fix the product where it compared a Windows path in POSIX spelling.
3. Build the tests' folders and URIs the system's way, and close what a case started before its folder is removed.
4. Replace waits counted in zero-delay timer ticks with clock or promise waits where Windows' timer made them run out.
5. Run the tests and the typecheck.
6. Set this task and the plan row to `implemented`.

## Validation

- The files this task names pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, in the runner-like setup, every file the Windows run of PR 25 failed passes on its own.
A full `pnpm -s test:unit` run there ends with timeouts only, in a different set of files each run, and each of those files passes alone: the machine runs 340 files at once and its zero-delay timer takes 15 ms.
`pnpm -s typecheck` and `pnpm -s boundary` pass.
On Windows, a command that redirected into `.git` was auto-approved, a session in a machine with an explicit mount was not found inside it, and a session's changeset missed a file a checkpoint had named with `/`.
In `agent-cofold-fork.test.ts`, the wait for a turn in a forked chat always ran out, because the case never subscribed to that chat; its waits now fail when they run out.
The Linux half of Validation is the CI run of the branch.
