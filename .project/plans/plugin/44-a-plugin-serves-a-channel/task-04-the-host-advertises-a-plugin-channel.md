---
title: The host advertises a plugin channel
status: done
depends: [task-02-a-plugin-registers-a-channel.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L279](../../../../packages/sdk/src/host/handshake.ts#L279) - `ahpd.resourceProviders` on initialize"
  - "[code://packages/sdk/src/host/root.ts#L390](../../../../packages/sdk/src/host/root.ts#L390) - `ahpd.resourceProviders` in root state"
---

## Objective

`initialize` and root state carry `_meta['ahpd.channels']`, one entry per plugin channel.
An entry has the scheme, a title, and the grant a subscribe needs.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `PluginChannel` gets an optional `describe()` that answers `title` and `description`.
- `UPDATE: packages/sdk/src/host/handshake.ts:279` - `ahpd.channels` beside `ahpd.resourceProviders`.
- `UPDATE: packages/sdk/src/host/root.ts:390` - `ahpd.channels` in root state.
- `UPDATE: packages/sdk/test/plugin-channel.test.ts` - the advertisement, and its absence on a host with no plugin channel.

## Steps

1. Add `describe?()` to `PluginChannel`.
2. Build the list of entries from `HostOptions.channels`.
3. Add `ahpd.channels` to `initialize` and to root state, and leave it absent when the list is empty.
4. Write the tests.

## Validation

1. Run `pnpm exec vitest run packages/sdk/test/plugin-channel.test.ts`.
2. Run `pnpm -s typecheck`.
