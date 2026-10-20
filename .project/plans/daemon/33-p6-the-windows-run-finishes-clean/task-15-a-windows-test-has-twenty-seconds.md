---
title: A Windows test has twenty seconds
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://vitest.config.ts](../../../../vitest.config.ts) - `testTimeout`"
  - "[code://packages/sdk/test/host-attachments.test.ts](../../../../packages/sdk/test/host-attachments.test.ts) - `until`, a wait by the clock"
---

## Objective

A process-heavy case on a busy Windows runner has the time its processes take, and a wait that runs out fails where it ran out.

## Files

- `UPDATE: vitest.config.ts` - `testTimeout` is 20 s on Windows and 5 s elsewhere, by [On Windows, a test has twenty seconds](../../../decisions/on-windows-a-test-has-twenty-seconds.md).
- `UPDATE: packages/sdk/test/worktrees.test.ts` - `GIT_HEAVY` goes: its 15 s was for Windows, where it now cut the limit short.
- `UPDATE: packages/sdk/test/nested-start.test.ts`, `sessiontools.test.ts`, `changes-branch.test.ts`, `wire.test.ts` - their limits for Windows alone go.
- `UPDATE: packages/sdk/test/host-attachments.test.ts` - `until` waits by the clock and fails when it runs out. It counted 200 zero-delay ticks, which a busy runner spent before a file was written, and the case went on as though the wait had been answered.
- `UPDATE: packages/sdk/test/operations.test.ts` - the busy-turn case holds its turn open for a second per chunk and waits by the clock for the announcement. It waited four ticks for a turn of about 40 ms, so a busy machine either had not announced yet or had already ended the turn.

## Steps

1. Take the failures of the Windows runs of PRs 25, 29 and 30 that were timeouts of cases passing alone.
2. Set the Windows limit once in the configuration, and remove the limits that were there for Windows alone.
3. Make the attachments and operations waits ones by the clock.
4. Run the tests and the typecheck.
5. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes, run after run, with no timeout of a case that passes alone.
- The Linux jobs pass with the 5 s default.

## Resume

Done 2026-10-19. Not reviewed.

The Windows run of PR 30 failed five cases: four timeouts in `changewords.test.ts` and `host-github.test.ts`, whose files take 40 s and 19 s there on every run, and the attachments wait.
On Softov's Windows machine, in the runner-like setup, the files this task names pass, and `host-attachments.test.ts` passed three runs in a row.
A full `pnpm -s test:unit` there, which failed about fifteen cases to load before, failed one, the operations case, and that case passes three runs in a row now.
`pnpm -s typecheck` and `pnpm -s boundary` pass.
The first half of Validation needs more than one CI run; the Linux half is the CI run of the branch.
