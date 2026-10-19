---
title: A test reads nothing of the machine it runs on
status: implemented
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://tools/test-tmpdir.ts](../../../../tools/test-tmpdir.ts) - `core.autocrlf=false` for every git of the run"
  - "[code://packages/agent-acp/test/agent-acp-plugin.test.ts](../../../../packages/agent-acp/test/agent-acp-plugin.test.ts) - no API key from the machine, and `until` by the clock"
  - "[code://packages/server/test/cli.ts](../../../../packages/server/test/cli.ts) - the cleanup waits for the daemons it killed"
  - "[code://packages/sdk/test/worktrees.test.ts](../../../../packages/sdk/test/worktrees.test.ts) - `GIT_HEAVY`, and an awaited cleanup"
---

## Objective

A test's answer does not depend on the git config, the environment or the speed of the machine it runs on.

## Files

- `UPDATE: tools/test-tmpdir.ts` - `GIT_CONFIG_COUNT` sets `core.autocrlf=false` for the run.
- `UPDATE: packages/agent-acp/test/agent-acp-plugin.test.ts` - `CODEX_API_KEY` and `OPENAI_API_KEY` are removed for the codex case, and `until` waits by the clock.
- `UPDATE: packages/server/test/cli.ts` - the cleanup waits for each killed pid with `gone`, then removes the folder with retries.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - the three blocks that make a host and a tree have 15 s, and the cleanup is awaited with retries.
- `UPDATE: packages/agent-cofold/test/agent-cofold-autoapproval.test.ts` - the shell expected is the platform's.

## Steps

1. Reproduce the CRLF cases with a scratch system config that sets `core.autocrlf=true`, as Git for Windows does on a runner.
2. Set `core.autocrlf=false` for the run in the global setup, where the run's temp folder is set.
3. Remove the machine's keys for the codex preset case, and wait by the clock in `until`, since a 1 ms timer is about 15 ms on Windows.
4. Wait for the killed daemons before removing a CLI case's home, which a dying daemon wrote into on Linux (`ENOTEMPTY` on main after #20).
5. Give the git-heavy worktree blocks 15 s, and await their cleanup.
6. Expect PowerShell from cofold's shell check on Windows.
7. Run the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- The cases pass on Windows with `core.autocrlf=true` in the system config and an API key in the environment.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, in the runner-like setup with `core.autocrlf=true`: the worktree, changes, commit, agent-acp plugin and cofold autoapproval tests pass.
The timeout is not raised for the whole suite: of the 15 tests the runner timed out, the control tests were a hang (task 09) and the rest were each a cause of their own.
The Linux half of Validation is the CI run of the branch.
