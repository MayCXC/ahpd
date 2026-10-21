---
title: A plugin publishes to some subscribers
status: done
depends: [task-02-a-plugin-registers-a-channel.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host.ts#L520-L556](../../../../packages/sdk/src/host.ts#L520-L556) - `seenBy`"
  - "[code://packages/sdk/src/host.ts#L589-L610](../../../../packages/sdk/src/host.ts#L589-L610) - `emit`"
  - "[code://packages/sdk/src/host.ts#L372](../../../../packages/sdk/src/host.ts#L372) - `replayable`, the replay buffer"
---

## Objective

A plugin sends an action on its channel with `publish(uri, action, { visible?, to? })`.
The host sends it only to a subscriber that `to` names and that `visible` lets see it, at the send and at a replay.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `ChannelHandle` with `publish` and `subscribers(uri)`.
- `UPDATE: packages/sdk/src/host.ts:589-610` - `emit` keeps the test with the envelope and in `replayable`.
- `UPDATE: packages/sdk/src/host.ts:520-556` - `seenBy` calls the test with the connection's principal and client id.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - the handle is bound to the host when `createHost` runs, and a publish before that is refused.
- `UPDATE: packages/sdk/test/plugin-channel.test.ts` - two readers, one test, and a reconnect that replays.

## Steps

1. Declare `publish(uri, action, options?)` and `subscribers(uri)` on `ChannelHandle`.
2. Refuse an action whose `type` does not start with the channel's scheme followed by `/`.
3. Bind the handle to the host's `emit` when the host starts.
4. Keep `visible` and `to` on the envelope and on its replay entry.
5. In `seenBy`, drop the envelope for a connection that `to` does not name or that `visible` refuses.
6. Make `subscribers(uri)` answer each subscribed client id with its current principal.
7. Write the tests.

## Validation

1. Run `pnpm exec vitest run packages/sdk/test/plugin-channel.test.ts`.
2. Run `pnpm exec vitest run packages/sdk`.
3. Run `pnpm -s typecheck`.
