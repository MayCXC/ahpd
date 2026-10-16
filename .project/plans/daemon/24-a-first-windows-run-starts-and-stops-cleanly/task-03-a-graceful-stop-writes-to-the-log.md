---
title: a graceful stop writes to the log
status: done
depends: [task-02-daemon-forgets-its-record-going-down.md]
layer: server
refs:
  - "[code://packages/server/src/commands/restart.ts#L177-L197](../../../../packages/server/src/commands/restart.ts#L177-L197) - `lifecycle.shutdown`, which logs only a failure today"
  - "[code://packages/server/src/commands/restart.ts#L60](../../../../packages/server/src/commands/restart.ts#L60) - `restart: stopping`, the log line of a restart"
---

## Objective

A graceful stop writes `stopping` to `daemon.log` when it starts and `stopped` when the way down is complete.
This is the line the checklists of daemon/20 and daemon/21 look for.

## Files

- `UPDATE: packages/server/src/commands/restart.ts:183-197` - `shutdown` logs `stopping` before `steps.down()` and `stopped` after it resolves.
- `UPDATE: packages/server/test/server-restart.test.ts` - the log lines of a shutdown, in the same file as task 02.

## Steps

1. Add a case: `shutdown` logs `stopping` before `down` runs, and `stopped` before `exit(0)`.
2. Add a case: a second `shutdown` while the first runs logs nothing more.
3. Run both cases and see them fail.
4. In `lifecycle.shutdown`, call `steps.log('stopping')` after the `going !== undefined` check and before `steps.down()`.
5. Call `steps.log('stopped')` in the resolve arm, before the `forget` of task 02.
6. Leave the failure arm as it is: it logs `Could not stop cleanly`.
7. Run the cases again and see them pass.

## Validation

- The new cases pass, and they fail without steps 4 and 5.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand on Windows: `ahpd stop` and a shutdown request each add `stopping` and `stopped` to `daemon.log`.

## Resume

Done 2026-10-13. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/test/server-restart.test.ts` - two cases in the `lifecycle` describe, in the same file as task 02. Steps 1 to 3 and 7. `logs stopping before the way down, and stopped once it is complete` asserts `['stopping', 'down']` as soon as `shutdown` returns - the line is written and the way down has begun - and the whole sequence `['stopping', 'down', 'stopped', 'forget', 'exit 0']` once it settles. `logs nothing more for a second stop while the first runs` asserts the two log lines and no third. Both failed before step 4 with `[ 'down' ]`. 49 cases before, 51 after.
- `packages/server/src/commands/restart.ts` - `STOPPING` and `STOPPED`, two constants beside `COULD_NOT_STOP`, `steps.log(STOPPING)` after the `going !== undefined` check and before `steps.down()`, and `steps.log(STOPPED)` as the first thing in the resolve arm, before task 02's `forget`. Steps 4 and 5.
- `packages/server/test/server-restart.test.ts`, the three shutdown cases that already existed - `logs and exits with 1 when a stop's way down fails`, `refuses a restart once a stop has begun` and `goes down once for two stops` - now expect the two lines. Steps 3 and 7.
- `packages/server/test/shutdown-method.test.ts` - the two cases that assert everything a shutdown ran, and the stub the file's `down` is. See below.

Judgement calls the plan does not decide:

- The step's `steps.log('stopping')` is a constant rather than a literal, because `restartAtTerminal` reads the log for a *different* line that also begins with `restart: stopping`. Naming the two words once is what keeps a later change to either from being made in one place and missed in the other.
- Step 6's failure arm is asserted by the case that was already there: it now expects `['stopping', 'Could not stop cleanly: the listener would not close', 'exit 1']`, so it holds that a way down that failed says why and never claims `stopped`. No case was added for it.
- The second-stop case asserts the two log lines rather than the whole sequence, which `goes down once for two stops` already asserts. The step asks for a case about the log lines, and this is the claim the step names.

What the plan did not know:

- The three shutdown cases that already existed could not keep their expectations, as in task 02: `['down', 'exit 0']` becomes `['stopping', 'down', 'stopped', 'forget', 'exit 0']`. The plan names only new cases for this task.
- `packages/server/test/shutdown-method.test.ts` is the second file that drives the real `lifecycle`, and the plan names only `server-restart.test.ts`. Its stub `down` recorded the word `stopping`, which is now also the lifecycle's own first line, so the two could not be told apart in the assertion. The stub records `raise stopping` instead, which is what the comment above it already said it stands in for, and its two cases now expect `['log stopping', 'raise stopping', 'log stopped', 'forget', 'exit 0']`.
- `stopping` is written by the lifecycle and not by the `stopping` *event*. `run.ts`'s `down` raises that event with `stamp`, so a plugin with a `stopping` handler adds its own lines after the lifecycle's, and a daemon with no plugin listening would otherwise leave nothing in the log saying a stop was asked for. That distinction is why the lines are here and not in `down`.

Validation:

- The new cases pass, and they failed without steps 4 and 5.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on the four packages in one command, with `--maxWorkers=2 --testTimeout=10000`: 242 files and 4363 tests pass.
- The by-hand check is not run. Its Windows half is not this machine, and running `ahpd start` and `ahpd stop` by hand on this one is denied in this mode; the daemon that writes these lines is exercised as a process by `server-cli-start.test.ts`, which is part of the run above, but no case there reads these two lines back.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
