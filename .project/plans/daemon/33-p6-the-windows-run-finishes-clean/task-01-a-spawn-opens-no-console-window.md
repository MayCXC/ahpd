---
title: A spawn opens no console window
status: todo
depends: []
layer: sdk, server, computer, agent-acp, agent-claude, tunnel-devtunnel
refs:
  - "[code://packages/sdk/src/repo/git.ts#L39](../../../../packages/sdk/src/repo/git.ts#L39) - one of the spawns"
---

## Objective

Every process that ahpd starts sets `windowsHide: true`, so a Windows daemon opens no console window.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:160` - `windowsHide` on the agent's spawn.
- `UPDATE: packages/agent-claude/src/spawn.ts:154` - `windowsHide` on Claude's spawn.
- `UPDATE: packages/computer/src/devcontainer.ts` - `windowsHide` at lines 465, 789, 804, 863 and 1114.
- `UPDATE: packages/computer/src/runtime.ts` - `windowsHide` at lines 884, 2380 and 2417.
- `UPDATE: packages/sdk/src/changes.ts:64-79` - `windowsHide` on both git calls.
- `UPDATE: packages/sdk/src/checkpoints.ts:31` - `windowsHide` on the git call.
- `UPDATE: packages/sdk/src/repo/git.ts:39` - `windowsHide` on the git call.
- `UPDATE: packages/sdk/src/repo/github.ts` - `windowsHide` at lines 65, 117 and 157.
- `UPDATE: packages/sdk/src/repo/worktrees.ts:43` - `windowsHide` on the git call.
- `UPDATE: packages/server/src/commands/restart.ts:397` - `windowsHide` on the restart's spawn.
- `UPDATE: packages/server/src/daemon.ts:515` - `windowsHide` on the daemon's spawn.
- `UPDATE: packages/server/src/install.ts:107` - `windowsHide` on the install's spawn.
- `UPDATE: packages/server/src/service.ts:323` - `windowsHide` on the service's spawn.
- `UPDATE: packages/tunnel-devtunnel/src/devtunnel.ts` - `windowsHide` at lines 58 and 70.

## Steps

1. Search `packages/*/src` for `spawn(`, `spawnSync(`, `execFile(`, `execFileSync(` and `fork(`.
2. Add `windowsHide: true` to each call that does not set it.
3. Compare the result with the Files list, and add any spawn the list does not name.
4. Run the gates.
5. Set this task and the plan row to `implemented`.

## Validation

- The search in step 1 finds no call without `windowsHide`.
- The gates pass on Linux.
