---
title: The last three Windows cases pass
status: implemented
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs](../../../../packages/agent-acp/test/fixtures/acp-server.mjs) - `nextSession`, the id the fake ACP server gives a session"
  - "[code://packages/sdk/test/changes-branch.test.ts](../../../../packages/sdk/test/changes-branch.test.ts) - the branch cases, a dozen git processes each"
  - "[code://packages/sdk/test/wire.test.ts](../../../../packages/sdk/test/wire.test.ts) - the case that drives a daemon's worth of traffic"
---

## Objective

The three cases the Windows run of PR 29 failed pass on Windows.

## Files

- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - a session's id is a random UUID, as a real server's is. It was the server's pid and a counter, and Windows hands a gone process's pid to the next one, so two servers in one test file named their sessions the same and the catalogue read one's turns as the other's.
- `UPDATE: packages/sdk/test/changes-branch.test.ts` - the branch cases get 20 s.
- `UPDATE: packages/sdk/test/wire.test.ts` - the traffic case gets 20 s.

## Steps

1. Take the three failures of the Windows run of PR 29.
2. Find each cause.
3. Fix the fake server's ids, and give the two slow cases the room their processes take on Windows.
4. Run the tests and the typecheck.
5. Set this task and the plan row to `implemented`.

## Validation

- The files this task names pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, in the runner-like setup, the agent-acp suite, `changes-branch.test.ts` and `wire.test.ts` pass.
Alone, the branch cases take one to two seconds each and the traffic case three and a half; beside the rest of the suite on the runner, the branch file took 18 s for five cases.
`pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch.
