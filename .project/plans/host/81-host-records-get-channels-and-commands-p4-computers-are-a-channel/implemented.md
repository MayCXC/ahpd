---
title: Computers are a channel and commands - implemented
date: 2026-10-11
refs:
  - git://02a6f20 - the review fixes; the build is 046a089
  - "[code://packages/computer/src/catalogue.ts](../../../../packages/computer/src/catalogue.ts) - the `x-ahpd-computers://` channel"
  - "[code://packages/computer/src/provider.ts](../../../../packages/computer/src/provider.ts) - `create`, `setState`, `destroy` and `computerMethods`"
  - "[code://packages/computer/src/plugin.ts](../../../../packages/computer/src/plugin.ts) - the channel, the commands and the refresh after each machine change"
---

A client subscribes to `x-ahpd-computers://` and holds every machine with its state, kept current.
It creates, starts, stops, restarts and removes a machine with typed commands.

## What was built

- [`code://packages/computer/src/catalogue.ts`](../../../../packages/computer/src/catalogue.ts) - the channel, built with `recordsChannel` over the runtime's `list` and `inspect`.
- [`code://packages/computer/src/provider.ts`](../../../../packages/computer/src/provider.ts) - `stateOf` at module level, shared by the channel and the `state` leaf.
- [`code://packages/computer/src/provider.ts`](../../../../packages/computer/src/provider.ts) - `create`, `setState` and `destroy`, which `write` and `remove` call, and `computerMethods`, the five commands.
- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) - the plugin registers the channel and the five commands, and refreshes from the `made` wrapper and once after the startup listing.
- [`code://packages/sdk/src/recordschannel.ts`](../../../../packages/sdk/src/recordschannel.ts) - `recordsChannel` reads nothing while nobody is subscribed.
- `ownerOfPrincipal` is exported from `@ahpd/sdk`.
- `docs/COMPUTER.md` has a section on the channel and the commands, after `## State`.

## Verified

- `packages/computer/test/catalogue.test.ts` has the channel cases, and `packages/computer/test/commands.test.ts` has the command cases.
- The review fixes add cases to `commands.test.ts`.
- `pnpm exec vitest run packages/computer` passes.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Task 01 - the plugin refreshes from the `made` wrapper after each run, start, restart, stop and remove. This covers the provider, the tools, sessions, the disposable timer and the VS Code routes.
- Task 01 - the review fixes removed the provider's `changed` callback, because the `made` wrapper covers every path, and `refresh` coalesces calls made while one runs.
- Task 01 - the plugin makes no idle stop, so `catalogue.test.ts` checks a removal by the tool that uses the `made` wrapper.
- Task 02 - a command refuses a `name` that is empty or holds `/` or `?`.
- Review fix 02a6f20 - `create` records the owner that the host passes to the command. A resource write records the same owner: `root:<host>` from the root connection.
- Review fix 02a6f20 - the computers channel refreshes when the users file changes, so a reader who loses `computer:read` is sent `removed`.

## Left for later

- none.
