---
title: a start logs its stages and waits 60 s
status: implemented
depends: []
layer: server
refs:
  - "[code://packages/server/src/daemon.ts#L65-L70](../../../../packages/server/src/daemon.ts#L65-L70) - `READY_TIMEOUT_MS`, 20 s today"
  - "[code://packages/server/src/commands/run.ts#L233](../../../../packages/server/src/commands/run.ts#L233) - `stamp`, which writes a log line to stderr"
  - "[code://packages/server/src/commands/run.ts#L584-L587](../../../../packages/server/src/commands/run.ts#L584-L587) - `pty()`, which runs a probe process first"
  - "[code://packages/server/src/commands/run.ts#L877](../../../../packages/server/src/commands/run.ts#L877) - `loadPlugins`"
  - "[code://packages/server/src/commands/run.ts#L971-L1029](../../../../packages/server/src/commands/run.ts#L971-L1029) - the listen, the `listening` event and `startingChecks`"
---

## Objective

`ahpd start` waits 60 s for the announcement.
The daemon writes one log line before each start stage, so a start that times out shows where it stopped.

## Files

- `UPDATE: packages/server/src/daemon.ts:70` - `READY_TIMEOUT_MS` becomes `60_000`.
- `UPDATE: packages/server/src/commands/run.ts` - one `stamp` before each start stage.

## Steps

1. Set `READY_TIMEOUT_MS` to `60_000` in `daemon.ts`, and keep its comment true.
2. Check that `SUCCESSOR_WAIT_MS` in `restart.ts` still derives from `READY_TIMEOUT_MS`.
3. In `run.ts`, call `stamp('start: terminals')` before the `pty()` call.
4. Call `stamp('start: plugins')` before `loadPlugins`.
5. Call `stamp('start: listen')` before the `listen` or `overStdio` call.
6. Call `stamp('start: listening')` before the `raise` of the `listening` event.
7. Call `stamp('start: checks')` before `startingChecks()`.
8. Check that no stamp writes to stdout, because over stdio stdout is the protocol.
9. Find tests that read `daemon.log` or stderr line by line, and update any that break.

## Validation

- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand: `ahpd start`, then read `daemon.log`. The five `start:` lines come before the announcement.

## Resume

Done 2026-10-13. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/daemon.ts` - `READY_TIMEOUT_MS` is `60_000`. Step 1. The comment keeps what it said about `SUCCESSOR_WAIT_MS` and gains a paragraph on why a minute: the pseudoterminal probe, the plugins and npm the first time are what a first start waits on, and the stamped stages are what a start that still did not make it is read for.
- `packages/server/src/commands/run.ts` - four statements and one hoist. Steps 3 to 7. `stamp('start: terminals')` with `const terminalBinding = await pty()` lifted out of the `base` object literal, which is the first thing in it that awaited; the literal now spreads `terminalBinding`. Then `stamp('start: plugins')` above `loadPlugins`, `stamp('start: listen')` above the `options.stdio ? await overStdio(...) : await listen(...)`, `stamp('start: listening')` inside `if (!options.stdio)` and directly above `raise`, and `stamp('start: checks')` above `startingChecks()`. All five share one comment above the first, which says why a stage is written before it begins.
- `packages/server/src/commands/restart.ts` - one word in `CHECK_WAIT_MS`'s comment, "twenty seconds" to "a minute", which step 1 made false. Not one of the task's Files.
- `packages/server/test/server-cli-start.test.ts` - one case, `logs each stage of a start before it begins, and all of them before the announcement`. Step 9, and see below. 13 cases before, 14 after.

Judgement calls the plan does not decide:

- The stage lines are not said over stdio. `start: listening` is inside the `if (!options.stdio)` block, since over stdio there is no address and `run.ts` does not raise the event there either. A stdio start therefore logs four of the five, and the validation's five are the socket start's, which is what `ahpd start` is.
- The `pty()` hoist is above `const base`, not inside the literal. `stamp` before the call is what the step is about, and a stamp between two properties of an object literal is a statement in the middle of an expression.
- Nothing about step 9 needed changing: no case asserted the daemon's own stderr or `daemon.log` line by line. The cases that read `daemon.log` all read it with `toContain`, and `daemon.test.ts`'s line-exact ones drive a fake announcing child rather than `runForeground`.

What the plan did not know:

- The five lines had no case at all, and this task's only check for them was by hand. `runForeground` is not reachable from a unit case, so the claim was going to be unverified on this machine. Step 9's "find tests that read `daemon.log`" is where that is fixed: the new case in `server-cli-start.test.ts` starts a real detached daemon, reads its log, and holds that the five stamped lines are there in order and before the announcement. Run against the code before step 3 it fails on the empty list.
- `restart.ts:246` said the daemon's own start gives a successor "twenty seconds", which step 1 made false. The constant is `READY_TIMEOUT_MS` and the word is now "a minute"; the plan did not list `restart.ts` among this task's files.
- `SUCCESSOR_WAIT_MS` needed nothing (step 2): it is `READY_TIMEOUT_MS + 5_000` at `restart.ts:31`, so it is 65 s now, and the margin over the daemon's own answer is what it was.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on the four packages in one command, with `--maxWorkers=2 --testTimeout=10000`: 242 files and 4364 tests pass.
- The five `start:` lines before the announcement are read off a real daemon's log by the new case, which is this validation's by-hand line run as a case instead. Running `ahpd start` by hand on this machine is denied in this mode, and the Windows half is not this machine.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
