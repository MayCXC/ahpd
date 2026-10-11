---
title: A plugin registers a channel
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L532](../../../../packages/sdk/src/types/plugin.ts#L532) - `registerResourceProvider`, the registration to mirror"
  - "[code://packages/sdk/src/host/channels.ts#L14](../../../../packages/sdk/src/host/channels.ts#L14) - `AUTOMATIONS` and `spaceOf`"
  - "[code://packages/sdk/src/host/routing.ts#L200](../../../../packages/sdk/src/host/routing.ts#L200) - the routing case for the automations channel"
  - "[code://packages/sdk/src/host/snapshots.ts#L72-L93](../../../../packages/sdk/src/host/snapshots.ts#L72-L93) - `snapshotOf`"
  - "[code://packages/sdk/src/host/gate.ts#L252-L259](../../../../packages/sdk/src/host/gate.ts#L252-L259) - `channelRead`"
  - "[code://packages/sdk/src/host.ts#L1202](../../../../packages/sdk/src/host.ts#L1202) - `unsubscribe`"
---

## Objective

`registerChannel(scheme, channel)` lets a plugin serve each URI with an `x-` scheme.
A client subscribes to it, gets the plugin's snapshot, and may not dispatch to it.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:532` - `PluginChannel` and `registerChannel`, beside `registerResourceProvider`.
- `UPDATE: packages/sdk/src/validate.ts` - `checkChannel`, which needs `grant` and `snapshot`.
- `UPDATE: packages/sdk/src/plugins.ts` - `registerChannel` checks the `x-` prefix and a scheme taken twice, and the fold collects `HostOptions.channels`.
- `UPDATE: packages/sdk/src/host/channels.ts` - `spaceOf` answers `'plugin'` for a registered scheme.
- `UPDATE: packages/sdk/src/host/routing.ts` - `channelKind`, `meantBy` and `homeOf` route a plugin channel.
- `UPDATE: packages/sdk/src/host/snapshots.ts:72` - `snapshotOf` asks the channel for its snapshot.
- `UPDATE: packages/sdk/src/host/gate.ts:252-259` - `channelRead` requires the channel's grant, unless its `authorize` lets the reader in.
- `UPDATE: packages/sdk/src/host.ts:1202` - `unsubscribe` and a disconnect call `left(client)`, and a dispatch to a plugin channel is refused.
- `CREATE: packages/sdk/test/plugin-channel.test.ts` - subscribe, gate, refused dispatch, `left`, and an `x-` URI that never reaches a session.
- `UPDATE: packages/sdk/test/plugin-validate.test.ts` - `checkChannel` with a complete channel and with an empty object.

## Steps

1. Declare `PluginChannel` with `grant`, `snapshot(uri, reader, client)`, an optional `authorize(uri, reader)` and an optional `left(client)`.
2. Declare `registerChannel(scheme, channel)` to answer a `ChannelHandle`, which task 03 fills.
3. Refuse a scheme that does not start with `x-`, and a scheme that another plugin took.
4. Add `checkChannel` and its test pair.
5. Collect the channels into `HostOptions.channels`, keyed by scheme.
6. Add the routing, snapshot and gate cases for a registered scheme.
7. Call `left(client)` on unsubscribe and on disconnect.
8. Refuse a client dispatch to a plugin channel with the error a dispatch to `ahp-automations://` gets.
9. Write the tests.

## Validation

1. Run `pnpm exec vitest run packages/sdk/test/plugin-channel.test.ts packages/sdk/test/plugin-validate.test.ts`.
2. Run `pnpm exec vitest run packages/sdk`.
3. Run `pnpm -s typecheck` and `pnpm -s boundary`.
