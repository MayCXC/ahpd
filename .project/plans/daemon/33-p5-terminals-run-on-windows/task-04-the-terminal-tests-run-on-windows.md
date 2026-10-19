---
title: The terminal tests run on Windows
status: implemented
depends: [task-03-a-terminal-stops-on-windows.md]
layer: sdk
refs:
  - "[code://packages/sdk/test/wire.test.ts#L299](../../../../packages/sdk/test/wire.test.ts#L299) - a host test with `shellTerminals()`"
  - "[code://packages/sdk/test/users-gate-dispatch.test.ts#L25](../../../../packages/sdk/test/users-gate-dispatch.test.ts#L25) - another"
---

## Objective

The tests that start a real terminal pass on Windows.
A command in them is one that PowerShell and a POSIX shell both run.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's list that fails on a terminal.

## Steps

1. Take the files in p1's list that start `shellTerminals`.
2. Find the command line each test sends.
3. Use a command both shells run, such as `echo`, or pick one by system.
4. Compare output with line ends removed, because PowerShell writes `\r\n`.
5. Run the sdk tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes these files, with no skip.
- The sdk tests pass on Linux.

## Resume

Implemented. `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass. The sdk suite passes 3004 tests with `--maxWorkers=2 --testTimeout=10000`.

Step 1 takes files from p1's list. p1 is not built. No Windows job is in `.github/workflows/ci.yml`, and the parent plan's Resume has no list. The files were taken from the tree instead, the departure this task depends on. The sdk test files that start `shellTerminals` are twelve, plus `support/host.ts`. Two more, `host-terminals.test.ts` and `host-tools.test.ts`, reach the real store through `machine()`, so they are in scope too.

Steps 2 and 3 found almost nothing to change. The commands sent to a real shell are `echo`, `pwd`, `sleep`, `sleep 30`, `exit 3`, `exit 5`, `git commit -am x`, `process.execPath`, and `echo` with `args` in the ACP fixture. All of them are commands PowerShell runs as well: `pwd`, `sleep` and `echo` are aliases there, and the arithmetic in `echo OWNER-$((1+1))` is a PowerShell subexpression. Two tests passed `command: 'true'`, which is a POSIX program and not a PowerShell command, so both now pass `echo`: `host-tools.test.ts` and `host-close.test.ts`.

Step 4 had no work. No test compares shell output exactly. The comparisons are `toContain`, `includes`, or the ACP fixture's `.trim()`, so a `\r\n` does not reach any of them.

Validation: the sdk tests pass on Linux. The first half, that the Windows job passes these files, cannot be checked here: there is no Windows job. These files also carry POSIX `cwd` values (`file:///tmp`, `file:///home/softov`), which are p2's to fix and keep the files from passing until p2 lands.

The first full run failed one case in `nested-proxy.test.ts` under load. It passed alone, and the second full run passed all 3004.

The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` again. The restore was denied here, so Softov reverts it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.

**Windows run, 2026-10-18, on Windows 10 (Node 24.12.0), at `71166379` plus this fix.**
`pnpm exec vitest run packages/sdk/test/pty.test.ts` passes 26 of 26 on Windows.
At `71166379` it failed 4: two OSC 7 cases, one exit code and one `close`.
CI run 39109275334 failed 9, but it ran `bf3dba63`, which is before `3328b293`; the other 5 were fixed by `3328b293`.
What was fixed:
- `close` threw `kill EINVAL` for a shell that never started. On Windows, Node throws that from `child.kill()` when the child has no pid. `close` now returns when there is no pid, since there is nothing to end.
- A command run through PowerShell exited 1 where the program exited 7. `-Command` exits 0 or 1 by `$?`. `terminals.ts` now adds a line after the command that exits with `$LASTEXITCODE`, or 1 for a failed cmdlet. This is a product fix: a `!` command's exit code was wrong on Windows.
- The two OSC 7 cases sent `file:///tmp/...`, which has no drive on Windows. They now build their URIs with `uriOf` from `resolve('/tmp')`, as p3 did in `worktrees.test.ts`.
No case in `pty.test.ts` runs a POSIX-only command any more, so none skips.
`host-terminals.test.ts` and `sessiontools.test.ts` still fail 3 cases each on Windows, with or without this fix, so this task's validation is not met yet:
- `host-terminals`, "starts a shell where the client said" and "reports the directory it is in": `EPERM` removing the test's temp folder. Probably the shell still holds the folder as its working directory when the cleanup runs. This is a terminal on Windows, so it is this task's.
- `host-terminals`, "runs a command typed during a turn": `Cannot read properties of undefined (reading 'success')`. Cause not read yet.
- `sessiontools`, "matches a directory with a space": the filter answers `[]`. A path case, p2's.
- `sessiontools`, "refuses a call with no turn running" and "refuses the 51st session": the second times out at 5 s. Cause not read yet.

**Windows run, 2026-10-19, on Softov's Windows machine in the runner-like setup.**
`host-terminals.test.ts` passes 24 of 24, `pty.test.ts` and `shellenv.test.ts` pass, and `conformance.test.ts` passes.
`sessiontools.test.ts` passes since p6 task 12.
What was fixed:
- "starts a shell where the client said" and "reports the directory it is in": the shell still had the folder as its working directory, and Windows does not remove that folder. Each case now disposes its terminal before the cleanup.
- "runs a command typed during a turn": the case waited for any `chat/turnComplete`, and the first turn's arrived before PowerShell had run the queued command. `ended` takes a turn id, and the case waits for the command's own turn.
- `pty.test.ts`, `shellenv.test.ts` and `conformance.test.ts` started a shell in `/tmp`, which Windows does not have, and Node reported the missing folder as `spawn pwsh.exe ENOENT`. They start it in `tmpdir()`.
- `users-gate-dispatch.test.ts` and `users-gate-names.test.ts` left shells running in the folder their cleanup removed. The helpers' `host` keeps every host it made, and the cleanup closes each first.
No case skips.
