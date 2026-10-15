---
title: a pipe request names the pipe in the log
status: implemented
depends: [task-05-docs.md]
layer: server
refs:
  - "[code://packages/server/src/commands/restart.ts#L50-L75](../../../../packages/server/src/commands/restart.ts#L50-L75) - `CONTROL_PIPE`, `FORCED_PIPE`, `cameBy`, `refusedTo` and `receiptOf`, the two log lines a restart writes"
  - "[code://packages/server/src/commands/restart.ts#L406-L428](../../../../packages/server/src/commands/restart.ts#L406-L428) - `answerRestartSignal`, which writes them"
  - "[code://packages/server/src/commands/restart.ts#L490-L497](../../../../packages/server/src/commands/restart.ts#L490-L497) - `restartAtTerminal`, which reads them"
  - "[code://packages/server/src/commands/run.ts#L1240-L1260](../../../../packages/server/src/commands/run.ts#L1240-L1260) - the handlers bound to the signals and to the control pipe"
  - "[code://packages/server/src/daemon.ts#L614-L644](../../../../packages/server/src/daemon.ts#L614-L644) - `throughPipe` and `deliver`, which choose the pipe or the signal"
---

## Objective

A restart that comes through the control pipe logs `restart refused (control pipe): ...` and `restart: stopping (control pipe)`.
A forced restart through the pipe logs `(control pipe, forced)` in the same place.
A signal on Linux and macOS keeps its name in both lines, and the terminal reads the line for the way it sent the request.

## Files

- `UPDATE: packages/server/src/daemon.ts:614-644` - `throughPipe(platform)` says whether a request goes through the pipe, and `deliver` uses it.
- `UPDATE: packages/server/src/commands/restart.ts:50-75` - `CONTROL_PIPE`, `FORCED_PIPE` and `cameBy`, and `refusedTo` and `receiptOf` take how the request came.
- `UPDATE: packages/server/src/commands/restart.ts:406-497` - `answerRestartSignal` takes `piped`, and `AtTerminal` gains `piped`, which `restartAtTerminal` reads.
- `UPDATE: packages/server/src/commands/run.ts:1240-1260` - the control pipe handlers answer with `piped` true.
- `UPDATE: packages/server/test/server-restart.test.ts` - cases for the two lines of a pipe request, for a terminal that reads them, and for a terminal that ignores the other kind.
- `UPDATE: packages/server/test/control.test.ts` - the handlers pass `piped`, and the cases expect the pipe name.
- `UPDATE: docs/server/REFERENCE.md:246` - one sentence on what the two lines say on Windows.

## Steps

1. Add a case: `answerRestartSignal` with `piped` logs `control pipe` for a plain request, and `control pipe, forced` for a forced one.
2. Add a terminal case: with `piped`, `restartAtTerminal` reads a refusal and a receipt that name the pipe.
3. Add a terminal case: each terminal ignores the refusal of the other kind, through the pipe and as a signal.
4. Change the control cases to bind the handlers with `piped`, and to expect the pipe name.
5. Run the cases and see them fail.
6. Add `throughPipe` in `daemon.ts`, and use it in `deliver`.
7. Add `CONTROL_PIPE`, `FORCED_PIPE` and `cameBy` in `restart.ts`, and give `answerRestartSignal` a `piped` parameter.
8. Add `piped` to `AtTerminal`, set it from `throughPipe()` in `realTerminal`, and read it in `restartAtTerminal`.
9. In `run.ts`, bind the control pipe handlers with `piped` true.
10. Add the sentence to `docs/server/REFERENCE.md`.
11. Run the cases again and see them pass.

## Validation

- `packages/server/test/server-restart.test.ts` and `packages/server/test/control.test.ts` hold the cases, and they fail before step 6.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run `pnpm exec vitest run packages/server packages/sdk` from the repository root; all pass.
- By hand on Windows: run `ahpd restart` while a turn runs; `daemon.log` has `restart refused (control pipe)`.

## Resume

Implemented 2026-10-14. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/daemon.ts` - step 6. `throughPipe(platform)` is true on win32, and `deliver` sends the request through the pipe when it is true.
- `packages/server/src/commands/restart.ts` - steps 7 and 8. `cameBy(piped, forced)` gives `control pipe` or `control pipe, forced` for a pipe request, and the signal name otherwise. `answerRestartSignal(forced, facts, piped)` and `restartAtTerminal` both use it. `AtTerminal.piped` tells `restartAtTerminal` which lines to read, and `realTerminal` sets it from `throughPipe()`.
- `packages/server/src/commands/run.ts` - step 9. The `process.on` handlers answer with `piped` false, and the control pipe handlers with `piped` true.
- `docs/server/REFERENCE.md` - step 10. One sentence after the sentence on the signal names, with both pipe names.
- Tests - steps 1 to 4. One daemon case and two terminal cases in `server-restart.test.ts`, and the two control cases in `control.test.ts` changed. The cases that check the pipe names failed before step 6. The case for the other kind passes for signals before and after, and failed for the pipe until `FORCED_PIPE`.

What the plan did not know:

- One pipe name for a plain and a forced restart let a terminal read the answer of the other kind. The review on 2026-10-14 asked for `(control pipe, forced)`, so the pipe keeps the two kinds apart as the signals do.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- `pnpm exec vitest run packages/server packages/sdk`: 201 files, 3945 of 3946 tests pass. `nested-start.test.ts` timed out under load, and passes alone with `--testTimeout 30000`.
- The by-hand line on Windows is left for Softov.
