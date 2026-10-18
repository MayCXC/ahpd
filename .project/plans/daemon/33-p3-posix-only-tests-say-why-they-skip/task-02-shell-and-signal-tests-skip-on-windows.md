---
title: Shell and signal tests skip on Windows
status: implemented
depends: [task-01-one-helper-names-a-posix-only-case.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - `shellOf`"
  - "[code://packages/sdk/test/nested-process.test.ts#L90](../../../../packages/sdk/test/nested-process.test.ts#L90) - `sh -c`"
  - "[code://packages/sdk/test/pty.test.ts#L192](../../../../packages/sdk/test/pty.test.ts#L192) - a process group"
---

## Objective

A test that starts `sh` outside a terminal, or sends a POSIX signal, skips on Windows with its reason.
A test that starts `shellTerminals` is left to p5.
A test that names `/bin/sh` only as a value runs on both systems.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's list that fails on `sh` or on a signal.

## Steps

1. Take the files in p1's list that fail on `sh` or on a signal.
2. Find the cases in each file that start `sh` or send a signal.
3. Skip each one with `it.skipIf(!posix)`.
4. Write the reason beside each skip: a POSIX shell or a process group.
5. Leave a case that passes `/bin/sh` as a value unchanged.
6. Run the sdk tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes these files, and its log counts the skips.
- The sdk tests on Linux skip nothing new.

## Resume

Done 2026-10-18. Not reviewed.

Four files run a `#!/bin/sh` script as a program on `PATH`. None of them is in the CI failure list, because the run timed out at 300 s before it reached them. They are in the plan's Reconnaissance, so they are built here.

- `packages/sdk/test/git-locks.test.ts`: one case, skipped. It finds git with `sh -c 'command -v git'` and puts a `#!/bin/sh` git first on `PATH`.
- `packages/sdk/test/changes-locks.test.ts`: one case, skipped. Same setup, for the changes source.
- `packages/sdk/test/git-hardened.test.ts`: three cases skipped. The first case only checks `gitArgv` and still runs. The three run a `#!/bin/sh` git on `PATH`.
- `packages/sdk/test/github.test.ts`: three cases skipped. The API cases still run. The three run a `#!/bin/sh` gh on `PATH`.

`it.skipIf(!posix)` comes from `../../../tools/posix.ts`. Each skip has a line above it saying it needs a POSIX shell outside a terminal. On Linux `posix` is true, so nothing is skipped there.

No signal case was skipped. `nested-process.test.ts` sends real signals but `test:unit` excludes it, so the Windows job never runs it. `pty.test.ts` starts `shellTerminals` and is p5's. The signals in `nested-proxy.test.ts` and `container-relay.test.ts` are stubs, not signals sent to a process.

`/bin/sh` as a `defaultShell` value stays unchanged, as step 5 says. That is `users-gate-dispatch.test.ts`, `users-gate-names.test.ts` and `session-fixed-key.test.ts`.

Gates run: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass. Vitest on `packages/sdk` with `--maxWorkers=2 --testTimeout=10000`: 149 files and 2990 tests pass.

`packages/sdk/test/fixtures/wire.jsonl` was rewritten by the run and could not be restored: `git checkout --` and `git restore` are both denied in this mode. It needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` from Softov.
