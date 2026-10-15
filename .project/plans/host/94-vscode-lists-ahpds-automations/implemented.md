---
title: VS Code lists ahpd's automations - implemented
date: 2026-10-15
refs:
  - git://e24a066f
  - "[code://packages/sdk/src/host/handshake.ts#L307-L310](../../../../packages/sdk/src/host/handshake.ts#L307-L310)"
  - "[code://packages/sdk/test/automations.test.ts#L421-L437](../../../../packages/sdk/test/automations.test.ts#L421-L437)"
---

A host with an automation store answers `_meta['vscode.autonomousAutomations']: true` on `initialize`, so VS Code's window lists and creates its automations.

## What was built

- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - the flag in the initialize `_meta`, under the same condition as the `automations` capability.
- [`code://packages/sdk/test/automations.test.ts`](../../../../packages/sdk/test/automations.test.ts) - two cases: a host with automations sends the flag, and a host with no automation store does not.

## Verified

- The case for the flag failed before the change and passes after it.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass, and `tools/` is unchanged.
- Vitest on sdk, server, agent-claude, agent-acp, agent-cofold and bot passes 4905 of 4905 tests.
- By hand, Softov, 2026-10-15, on the branch: VS Code's window lists the automations, runs one and creates one. An edit in VS Code shows in ahpw at once.

## Departures from the plan

- None.
