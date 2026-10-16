---
title: A customization is switched for all sessions or a folder - implemented
date: 2026-10-11
refs:
  - git://f4bd337
  - "[code://packages/sdk/src/enablement.ts](../../../../packages/sdk/src/enablement.ts)"
  - "[code://packages/server/src/enablement.ts](../../../../packages/server/src/enablement.ts)"
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
---

A customization switched off for every session, or for one folder, stays off in each new session there. The daemon keeps these decisions in `customizations-state.json`, so they outlive a restart. A toggle switches every open session that the change reaches, as VS Code's own host does.

## What was built

- [`code://packages/sdk/src/enablement.ts`](../../../../packages/sdk/src/enablement.ts) - `enablementKeyOf`, the `EnablementStore` interface and `memoryEnablement()`, with a cap of 512 keys.
- [`code://packages/server/src/enablement.ts`](../../../../packages/server/src/enablement.ts) - `fileEnablement`, the store on the state file.
- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - `customizationStatePath()`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the state file in `wholeFiles`, and the store passed to the host.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - `session/customizationToggled` writes the global and folder entries and switches the other sessions.
- [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - each customization a session reports carries the session, folder and global entries.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - a new session starts with the store's entries.

## Verified

- `pnpm exec vitest run packages/sdk packages/server`: 3725 of 3726 tests pass after the rebase onto main. The one failure is `nested-start.test.ts`, which times out on main too.
- `enablement.test.ts` is new in sdk and in server, and `host-tools.test.ts` has the toggle cases.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- A global or folder decision needs `config:change` on a host with people. The review added this, with a test. The plan let `session:configure` write them, and those decisions switch other people's sessions. A sender without `config:change` switches their own session only, as a host with no store does. Softov may change this default.

## Left for later

- The check by hand in VS Code: a daemon restart with a plugin off for all sessions.
