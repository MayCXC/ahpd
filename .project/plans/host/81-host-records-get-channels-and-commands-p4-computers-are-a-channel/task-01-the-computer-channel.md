---
title: The computer channel holds every machine and its state
status: implemented
depends: []
layer: "packages/computer"
refs:
  - "[code://packages/computer/src/provider.ts#L270-L335](../../../../packages/computer/src/provider.ts#L270-L335) - `list` and `read`"
  - "[code://packages/computer/src/plugin.ts#L1027-L1164](../../../../packages/computer/src/plugin.ts#L1027-L1164) - the machine watch, adoption and the scheme registration"
---

## Objective

The computer plugin serves `x-ahpd-computers://` with `recordsChannel`, and each change the plugin makes to a machine refreshes it.

## Files

- `CREATE: packages/computer/src/catalogue.ts` - the source over the runtime, and the channel.
- `UPDATE: packages/computer/src/provider.ts` - a `changed` callback after each write and remove.
- `UPDATE: packages/computer/src/plugin.ts:1164` - register the channel, and refresh on each machine change.
- `CREATE: packages/computer/test/catalogue.test.ts` - cases over a fake runtime.

## Steps

1. Write a source whose `ids` answers `runtime.list`, and whose `find` answers `{ state, status }`.
2. Build the channel with `recordsChannel`, the scheme `x-ahpd-computers` and the grant `computer:read`.
3. Bind it with `host.registerChannel`, as the bot plugin does.
4. Call `refresh` from the provider's `changed` callback.
5. Call `refresh` after an adoption at start, and after each start, stop and destroy the machine watch makes.
6. Call `refresh` when a session makes or ends its own machine.

## Validation

- `catalogue.test.ts` subscribes and gets every machine of the fake runtime with its state.
- A write to `computer://box/state` sends `changed` with the new state.
- An idle stop by the machine watch sends `changed`.
- `pnpm exec vitest run packages/computer` passes.

## Resume

Implemented 2026-10-11. `catalogue.ts` builds the channel with `recordsChannel` over the runtime's `list` and `inspect`, and `stateOf` moved to module level in `provider.ts` so the channel and the `state` leaf share it. The plugin refreshes from the `made` wrapper after each run, start, restart, stop and remove, which covers the provider, the tools, sessions, the disposable timer and the VS Code routes, and once after the startup listing. The provider's `changed` callback refreshes too. The plugin makes no idle stop: the machine watch only removes a disposable machine, through `made.remove`, so `catalogue.test.ts` checks a removal by the tool that uses the same wrapper. `recordsChannel` now reads nothing while nobody is subscribed.
