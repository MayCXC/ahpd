---
title: A spawn opens no console window
status: done
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
- `UPDATE: packages/sdk/src/sessions/changes.ts:64-79` - `windowsHide` on both git calls.
- `UPDATE: packages/sdk/src/sessions/checkpoints.ts:31` - `windowsHide` on the git call.
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

## Resume

Implemented 2026-10-18. `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
The touched cases pass on Linux. That is 190 in the sdk files, 271 in the server, agent-claude and tunnel files, and 147 in the computer and agent-acp files.

Files changed:
- `packages/agent-acp/src/connection.ts:160` - `windowsHide` on the ACP server's spawn.
- `packages/agent-claude/src/spawn.ts:154` - `windowsHide` on Claude's spawn.
- `packages/computer/src/devcontainer.ts` - `windowsHide` on `runCli` and on the four spawns inside the dev container backend.
- `packages/computer/src/gitdir.ts:444` - `windowsHide` on `seedOf`'s `spawnSync('git', ...)`.
- `packages/computer/src/parts.ts:331` - `windowsHide` on `packOf`'s `spawnSync('pnpm', ...)`.
- `packages/computer/src/runtime.ts` - `windowsHide` on both `spawn` calls and the `spawnSync('git', ...)` in `hostGit`.
- `packages/sdk/src/sessions/changes.ts:64,79` - `windowsHide` on both git calls.
- `packages/sdk/src/sessions/checkpoints.ts:31` - `windowsHide` on the git call.
- `packages/sdk/src/repo/git.ts:39` - `windowsHide` on the git call.
- `packages/sdk/src/repo/github.ts` - `windowsHide` on all three `gh` calls.
- `packages/sdk/src/repo/worktrees.ts:43` - `windowsHide` on the git call.
- `packages/server/src/commands/restart.ts:397` - `windowsHide` on the restart's spawn.
- `packages/server/src/daemon.ts:515` - `windowsHide` on the daemon's spawn.
- `packages/server/src/install.ts:107` - `windowsHide` on the install's spawn.
- `packages/server/src/pty.ts:30` - `windowsHide` on the `--probe` spawn.
- `packages/server/src/service.ts:323` - `windowsHide` on the service's spawn.
- `packages/tunnel-devtunnel/src/devtunnel.ts` - `windowsHide` on both `devtunnel` spawns.

Past the Files section: step 3's search found three spawns the list does not name. They are the three above at `gitdir.ts:444`, `parts.ts:331` and `pty.ts:30`. They are in the change. `packages/computer/src/ssh.ts:180`, `packages/sdk/src/machines/terminals.ts:37,420` and `packages/sdk/src/sessions/nested.ts:198` already set the option and are unchanged.

The search in step 1 now answers every `spawn`, `spawnSync`, `execFile` and `execFileSync` call in `packages/*/src` with `windowsHide: true`. `fork` is not imported anywhere in `src`. Nothing Windows-only was run: this host is Linux, so the console window itself is for task 03's run or Softov's machine.
