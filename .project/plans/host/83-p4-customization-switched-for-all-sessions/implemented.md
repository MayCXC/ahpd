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
- The check by hand, by Softov on 2026-10-16, on Windows with VS Code 1.141.2, after the fix below: `cc-plugin-agents-md` switched off for all sessions is off in every existing session and in a new session, and the other two built-ins stay on. After `ahpd restart` and a reload of the window, a new session still has it off.

## Departures from the plan

- The check by hand found that switching off one plugin the CLI has built in switched off all three.
  The SDK reports every built-in with the path `builtin`, and `agent-claude` used the path as the plugin's `uri`, which is the enablement key.
  A built-in's `uri` is now its `source`, such as `cc-plugin-telemetry@builtin`.

- A global or folder decision needs `config:change` on a host with people. The review added this, with a test. The plan let `session:configure` write them, and those decisions switch other people's sessions. A sender without `config:change` switches their own session only, as a host with no store does. Softov may change this default.

## Left for later

- "Disable (Session)" on a built-in plugin does not stay: the host echoes `session/customizationToggled` with `kind: session`, but the session's customizations still report the plugin on, and the window's status only flickers.
  Not looked into yet.
