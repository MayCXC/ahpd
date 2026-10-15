---
title: The shutdown method runs the way down
status: implemented
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/run.ts#L788-L798](../../../../packages/server/src/commands/run.ts#L788-L798) - `diagnostics.shutdown`, the line that changes"
  - "[code://packages/server/src/commands/run.ts#L1201-L1203](../../../../packages/server/src/commands/run.ts#L1201-L1203) - the control pipe, which already calls `way.shutdown`"
  - "[code://packages/sdk/test/diagnostics.test.ts](../../../../packages/sdk/test/diagnostics.test.ts) - the existing cases for the `shutdown` method"
---

## Objective

`diagnostics.shutdown` calls `way.shutdown()` and sends no signal, so a `shutdown` request stops the daemon gracefully on Windows too.

## Files

- `UPDATE: packages/server/src/commands/run.ts:788-798` - `diagnostics.shutdown` calls the lifecycle's `shutdown`; the comment says so.
- `UPDATE: packages/server/src/commands/run.ts:1110-1149` - after `way` is made, the shutdown that `diagnostics` calls is bound to it.
- `CREATE: packages/server/test/shutdown-method.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* row.
2. Declare a `let` holder for the shutdown before `diagnostics`, and set it to `way.shutdown` after the line that makes `way`.
3. Make `diagnostics.shutdown` call that holder, and send no signal.
4. When the holder is not set yet, keep today's `SIGTERM` to the daemon's own process.
5. Update the comment on `diagnostics.shutdown` to say it runs the same way down as `ahpd stop`.
6. Update the comment at `packages/sdk/src/host/admission.ts:184` that says `shutdown` is `SIGTERM`.
7. Add the test cases below, with the smallest seam that reaches `runForeground` or the holder.

## Validation

- `shutdown-method.test.ts`: a `shutdown` request on a running daemon raises `stopping` before the exit.
- `shutdown-method.test.ts`: a `shutdown` request sends no signal to the daemon's own process.
- `diagnostics.test.ts`: the existing `shutdown` cases still pass.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

Done 2026-10-13. Every step is built.
A `shutdown` request now runs the lifecycle's way down.
It raises `stopping`, closes the plugin connections, closes the listeners and calls `host.close()`, and it sends no signal.

The plan's *Gaps* named two ways to cover a request that arrives before the way down exists: wait for it, or stop as today.
This build stops as today.
`diagnostics.shutdown` is called from a timer in `vscodemethods.ts:430` (`void Promise.resolve(logs.close()).then(() => stop())`), so it is a `() => void` with nothing to await.
Waiting would mean changing the sdk's port or the method's shape, which the plan's *Layer responsibilities* rules out.
The window is short: `diagnostics` is built at `run.ts:794`, the socket is bound at `:959-986`, and `way` is made at `:1110`.

File by file:

- `packages/server/src/commands/run.ts` - a `let wayDown: (() => void) | undefined` before `const base: HostOptions = {`, with a comment on why neither object can be made first. The host is handed a shutdown that reads the holder, and the lifecycle is built from the host (step 2). `diagnostics.shutdown` is `daemonShutdown(() => wayDown)` (step 3). The block above it now says the shutdown runs the same way down `ahpd stop` does (step 5). `wayDown = way.shutdown;` is the line after `const way = lifecycle({...})` closes, above the two `process.on` lines (step 2). `daemonShutdown` is exported after `runForeground`. It calls the holder when it is set, and otherwise keeps `process.kill(process.pid, 'SIGTERM')` (step 4).
- `packages/sdk/src/host/admission.ts` - the comment at `:184` now says `shutdown` stops the daemon (step 6). It said `shutdown` is `SIGTERM` to the daemon, which was the wrong reason for a right rule. The rule above it is untouched: the method is in neither grant table, so it is refused by omission.
- `packages/server/test/shutdown-method.test.ts` - three cases, `CREATE` (step 7).

The three cases, and the seam they reach (step 7):

- *runs the way down, which raises stopping, and exits only after it* - a real `lifecycle` whose `down` and `exit` record what ran. Both are driven through `daemonShutdown(() => way.shutdown)`. The way down is asserted before the promise settles, so the exit cannot run ahead of it.
- *sends no signal to this daemon's own process* - the same, with `process.kill` spied and `SIGTERM` never sent.
- *keeps the signal while there is no way down yet* - the holder answers `undefined`, and the call is `process.kill(process.pid, 'SIGTERM')`.

The seam is `daemonShutdown`, one new export beside `apiOrigins` and `runForeground`.
A run of the whole daemon is not a seam: `runForeground` binds a socket, loads plugins and opens stores.
The test imports the same `lifecycle` the daemon does, so the stopping step it drives is the real one and not a stand-in for it.

Where the plan and the code agree:

- Every step matched the code as written. The ref line ranges held: `diagnostics.shutdown` at the old `:788-798`, the control pipe's `way.shutdown` at `:1202`, and the `admission.ts` comment at `:184`, all as named.
- The plan says the method answers first, the logs close, then the way down runs. Nothing here changes that: the sdk still does the answering and the closing, and the daemon only changes what the stop reaches.

Seen, and not this task's:

- `docs/sdk/AHP.md:850` already says "`shutdown` answers `{}` and then stops the daemon the way `ahpd stop` does". That sentence was untrue on Windows before this change and is true now. The task's Files list does not name it, so it is unchanged, and no doc contradicts the new behaviour.
- `run.ts:1151`, the `stop` a restart gives a successor it started, still sends `SIGTERM` and is still a hard kill on Windows. That is the plan's second risk and is left alone.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0. The schema is byte-identical (508 definitions from 506 exported types, 633 closed objects) and is not in the diff.
- vitest over the four packages in one command, `--maxWorkers=2 --testTimeout=15000`: 242 files and 4344 tests pass, 391s. `shutdown-method.test.ts` is 3 of them.
- Against the unfixed behaviour, the no-signal case fails at `shutdown-method.test.ts:54` - `expected "kill" to not be called at all, but actually been called 1 times`, with `[<pid>, "SIGTERM"]`. The whole file against that behaviour kills the worker running it, which is what the old line did to a real daemon. Restored, the 3 cases pass.

Left:

- By hand on Windows: after `shutdown`, the daemon log shows the way down. Not done here.
- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by the suite - 33 lines, the known endpoint-and-`_meta` churn, none of it this task's. `git checkout` and `git restore` are both denied in this session, so it is left as the suite wrote it. Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before committing.
- Nothing is committed. This task's own files are the three above.
