---
title: the daemon forgets its record on the way down
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/restart.ts#L177-L197](../../../../packages/server/src/commands/restart.ts#L177-L197) - `lifecycle.shutdown`, which exits after the way down"
  - "[code://packages/server/src/commands/run.ts#L1155](../../../../packages/server/src/commands/run.ts#L1155) - the `forget` step, which removes the record only when it names this pid"
---

## Objective

A daemon that stops removes its own `daemon.json`, after a shutdown request as well as after `ahpd stop`.
A restart is not changed: its successor keeps the record.

## Files

- `UPDATE: packages/server/src/commands/restart.ts:183-197` - `shutdown` calls `steps.forget()` after the way down and before `steps.exit`.
- `UPDATE: packages/server/test/server-restart.test.ts` - cases that a shutdown forgets the record before it exits.

## Steps

1. Open `packages/server/test/server-restart.test.ts`, which tests `lifecycle`.
2. Add a case: `shutdown` calls `forget` after `down` resolves and before `exit(0)`.
3. Add a case: when `down` rejects, `shutdown` still calls `forget` before `exit(1)`.
4. Run both cases and see them fail.
5. In `lifecycle.shutdown`, call `steps.forget()` in both arms of `going.then`, before `steps.exit`.
6. Put each `steps.forget()` call in a `try`, so a failed removal still reaches `steps.exit`.
7. Run the cases again and see them pass.
8. Check that the restart cases in the same file still pass, with no change to them.

## Validation

- The new cases pass, and they fail without step 5.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand on Windows: send a shutdown request to a started daemon. `daemon.json` is gone.

## Resume

Done 2026-10-13. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/test/server-restart.test.ts` - three cases in the `lifecycle` describe, after the existing stop-failure one. Steps 1 to 4 and 8. `forgets its record once the way down is complete, before it exits` and `forgets its record even when the way down failed, before it exits with 1` are the two the steps name; the third, `exits even when forgetting the record itself throws`, is step 6's `try`, which no step named a case for. The two named cases assert the `down`/`forget`/`exit` order and not the whole of what was said, so what the way down logs around them stays task 03's business. All three failed before step 5: the first with `[ 'down', 'exit 0' ]`, the second with the `forget` missing. 46 cases before, 49 after.
- `packages/server/src/commands/restart.ts` - `lifecycle.shutdown` calls `steps.forget()` in both arms of `going.then`, each in a `try` with an empty `catch` and a comment, before that arm's `steps.exit`. Steps 5 and 6.
- `packages/server/test/shutdown-method.test.ts` - the two cases that drive a shutdown through `daemonShutdown` and assert everything that ran. Steps 5 and 8, and see below.

Judgement calls the plan does not decide:

- The empty `catch` says nothing, not even to the log. The record is a file beside the daemon's own; a failure to remove it is the same failure `forget` already swallows internally (`daemon.ts:523`), and a line here would be a line on every stop of a deployment whose configuration folder has gone read-only. What matters is reaching the exit, and the `try` is what says the removal is not on the way there.
- The cases assert `forget` between `down` and `exit` and not the pid handed to it. `forget([process.pid])` is `run.ts`'s step and is already covered by `daemon.test.ts`, which holds that a pid that is not the named one is left alone.

What the plan did not know:

- Two existing cases are not restart cases and could not pass unchanged, so step 8's "no change to them" holds only for the restart ones. `refuses a restart once a stop has begun` and `goes down once for two stops` in the same describe assert the whole sequence a shutdown says, and both now expect `['down', 'forget', 'exit 0']`. Every case about restarting in place is unchanged, which is what the step is about: `restartInPlace` reaches `forget` through its own step, and `restartInPlace` and `answerRestartSignal` cases are untouched.
- `packages/server/test/shutdown-method.test.ts`, which the plan does not name, drives the real `lifecycle` too. Its two cases that assert what ran now expect `['stopping', 'forget', 'exit 0']`. The plan names only `server-restart.test.ts` as the test file for this task.

Validation:

- The new cases pass, and they failed without step 5.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on the four packages in one command, with `--maxWorkers=2 --testTimeout=10000`: 242 files and 4361 tests pass.
- The Windows check by hand is not run: this build is on Linux.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
