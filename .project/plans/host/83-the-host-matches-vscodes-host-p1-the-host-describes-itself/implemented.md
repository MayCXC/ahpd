---
title: The host describes itself as VS Code's host does - implemented
date: 2026-10-11
refs:
  - git://3dccb89
  - "[code://packages/sdk/src/host/root.ts](../../../../packages/sdk/src/host/root.ts)"
  - "[code://packages/sdk/src/host/handshake.ts](../../../../packages/sdk/src/host/handshake.ts)"
---

The host tells VS Code what machine it runs on and which build it is. A window that delegates work can filter hosts on the machine, and its Output channel names the build. A `#` in the chat input completes a file name.

## What was built

- [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts) - root `_meta['vscode.agentHost.resources']` with platform, architecture, CPU count and memory.
- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `hostBuild` and `vscode.ahpSessionUris` in the root, and `#` as a completion trigger.
- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - `#` completes files, as `@` does.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4013 of 4013 tests pass after the rebase onto main.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- none.

## Left for later

- The check by hand: VS Code's window shows the host version in its Output channel.
