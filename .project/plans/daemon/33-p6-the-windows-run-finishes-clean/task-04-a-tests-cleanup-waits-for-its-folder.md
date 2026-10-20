---
title: A test's cleanup waits for its folder
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://tools/test-tmpdir.ts#L21](../../../../tools/test-tmpdir.ts#L21) - the run's removal"
---

## Objective

A test's removal of its temporary folder does not fail on `EBUSY` while a process lets go of it.

## Files

- `UPDATE: packages/sdk/test` - each removal in task 03's list that fails on `EBUSY`.
- `UPDATE: tools/test-tmpdir.ts:21` - the run's removal retries too.

## Steps

1. Take the `EBUSY` failures from task 03's list.
2. Find the `rmSync` or `rm` call in each one.
3. Add `maxRetries: 5` and `retryDelay: 100` to it.
4. Find the process that holds the folder, if a retry does not clear it.
5. Stop that process before the removal.
6. Run the gates.
7. Set this task and the plan row to `implemented`.

## Validation

- The Windows job's log has no `EBUSY`.
- The gates pass on Linux.

## Resume

Implemented 2026-10-19, on Windows with no git identity and a short-name temp folder, as the runner has.
Step 3's sync retries did not clear the folders: what holds one is let go on the event loop, which `rmSync`'s retries block, so the removals that failed are now `await rm(...)` from `node:fs/promises` with the same `maxRetries: 5` and `retryDelay: 100`, in `agent-acp-ports`, `agent-acp-trust`, `agent-acp`, `changes-refresh`, `host-files`, `host-github` and `host-terminals`; `tools/test-tmpdir.ts` keeps `rmSync` with the retries, since it runs after every worker has exited.
Step 4 found the process: on Windows `connectAcp` never stopped an ACP server, because `process.kill(-pid)` throws there; it is fixed in `packages/agent-acp/src/connection.ts` by [the Windows close decision](../../../decisions/on-windows-an-acp-servers-leftovers-are-ended-after-it-exits.md), and `agent-acp-trust` and `agent-acp` now await `session.close()` before the removal.
The two `agent-acp-catalog` cases that wait on a close get 15 s, since a server that keeps running after its stdin closes is ended after the connection's 5 s grace.
Verified here: `packages/agent-acp/test` went from 17 failures to 7, none of them `EBUSY` or `EPERM`, and no fixture server is left running after it; `pnpm typecheck` passes.
Not verified: the Windows job's log, and the gates on Linux; both are the PR's.
