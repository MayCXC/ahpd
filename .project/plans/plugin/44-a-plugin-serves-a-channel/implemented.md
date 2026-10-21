---
title: A plugin serves a channel, and bots have a catalogue - implemented
date: 2026-10-10
refs:
  - git://build/plugin-44 - the build, not merged yet
  - "[code://packages/sdk/src/plugins/plugins.ts](../../../../packages/sdk/src/plugins/plugins.ts) - `registerChannel`, its handle, and the fold of `channels`"
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts) - `seenBy`, `emit`, `leftChannel`, and the handle bound to the host"
  - "[code://packages/sdk/src/access/users.ts](../../../../packages/sdk/src/access/users.ts) - `fileUsers` `watch`"
  - "[code://packages/bot/src/catalogue.ts](../../../../packages/bot/src/catalogue.ts) - the `x-ahpd-bots://` channel"
---

A plugin serves a channel under an `x-` scheme with `registerChannel`.
It publishes each action with an optional test of who sees it.
The bot plugin serves `x-ahpd-bots://`, the bots each reader may read.
A subscriber gets `added` and `removed` when a membership change gives or takes a bot.

## What was built

- Task 01 - [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - `fileUsers` has `watch(onChange)`. It watches the folder of the file, filters to the file name, and waits 100 ms after the last event. A `write` of the host pokes each watch.
- Task 01 - [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - the host opens the watch only when a plugin listens to `users_changed`, fires the event, and closes the watch on close. `UsersChangedEvent` is in `events.ts`.
- Task 02 - [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts) - `PluginChannel`, `ChannelHandle`, `ChannelSubscriber`, `PublishOptions`, `ServedChannel`, and `registerChannel` on `PluginHost`.
- Task 02 - [`code://packages/sdk/src/plugins/validate.ts`](../../../../packages/sdk/src/plugins/validate.ts) - `checkChannel` needs a `grant` and a `snapshot` function. `authorize`, `left` and `describe` are functions when they are there.
- Task 02 - [`code://packages/sdk/src/plugins/plugins.ts`](../../../../packages/sdk/src/plugins/plugins.ts) - `registerChannel` refuses a scheme without `x-` and a scheme the plugin already registered. The fold collects `HostOptions.channels` and drops a scheme a second plugin registers, with a problem line.
- Task 02 - `host/channels.ts`, `host/routing.ts`, `host/snapshots.ts`, `host/gate.ts`, `host/admission.ts` and `host/actions.ts` - an `x-` URI is in the plugin space. It never routes as a session. Its subscribe needs the grant of the channel or its `authorize`. The plugin answers its snapshot, and a client dispatch to it is refused.
- Task 03 - [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - `emit` keeps the audience on the envelope and in `replayable`. `seenBy` drops the envelope for a connection that `to` does not name or that `visible` refuses. It does this at the send and at each replay. The audience never goes out. `createHost` binds `publish` and `subscribers` on each handle.
- Task 04 - `host/root.ts` and `host/handshake.ts` - `_meta['ahpd.channels']` on `initialize` and in root state, one entry `{ scheme, title, description?, grant }` per channel. It is absent when no plugin serves a channel.
- Task 05 - [`code://packages/bot/src/catalogue.ts`](../../../../packages/bot/src/catalogue.ts) - the channel and the slugs sent to each client. It publishes a make, an edit and a delete, and the difference on `users_changed`. The payloads are the ones given for ahpapp: snapshot `{ bots: BotRecord[] }`, `added { bot }`, `changed { bot }`, `removed { id }`.
- Task 05 - [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts) - `write` and `remove` tell the catalogue after the store changes. `mayRead` is exported. [`code://packages/bot/src/plugin.ts`](../../../../packages/bot/src/plugin.ts) registers the channel and listens to `users_changed`.
- Task 06 - `docs/plugins/PLUGINS.md` has a section "A channel of your own", a table row, and `users_changed` in the event table. `docs/plugins/BOTS.md` has a section "The catalogue". `packages/bot/README.md` has a section on the catalogue. `00-plugin.md` has a `channel` row.

## Verified

- `pnpm -s typecheck` passes.
- `pnpm -s boundary` passes.
- `pnpm exec vitest run packages` passes: 281 files, 4958 tests.
- `users-changed.test.ts` has 4 cases, `plugin-channel.test.ts` has 11, `plugin-validate.test.ts` has 1 new case, and `bot-catalogue.test.ts` has 6.
- A sabotage of each guarded line made a test fail, in 31 sabotages. The poke after `write` is the exception: the file watch also sees the rename, so no test fails without the poke alone.

## Departures from the plan

- Task 02 - `spaceOf` puts every `x-` scheme in the plugin space, served or not. A subscribe to an unserved one is refused `-32001`, and `createSession` refuses an `x-` name `-32003`.
- Task 02 - a dispatch to a plugin channel is refused with a `rejectionReason` envelope, as a dispatch to `ahp-automations://` is. The text is "<type> is <uri>'s plugin's to say, not a client's".
- Task 02 - `left(client)` is called once the client watches no URI on the scheme on any connection, so a second window keeps the client in.
- Task 02 - `homeOf` is not changed, because a plugin channel has no home.
- Task 03 - `createHost` binds the handle, not `plugins.ts`. A publish also refuses a URI that is not on the scheme of the channel. A `visible` that throws hides the action from that subscriber, and the host logs it. The origin of a publish is always absent.
- Task 03 - the snapshot reads `fromSeq` before it asks the plugin, so an action published during the snapshot is replayed, not lost.
- Task 04 - an entry in `ahpd.channels` names the `scheme` and the `grant`, and the title falls back to the scheme.
- Task 05 - a delete is sent with `visible`, not `to`: to a client that holds the bot, or that could read it as it was. `to` holds over a replay only for one client, and a replayed delete after a reconnect must still reach the client.
- Task 05 - an edit is three publishes, `changed`, `added` and `removed`, each with its `visible` test. The test also keeps the set of each client current, because it is the one place that knows which client got what.
- Task 05 - the snapshot answers only `x-ahpd-bots://`, and refuses another URI on the scheme `-32001`.
- Task 05 - the plugin registers the channel in `plugin.ts`, where `apply` is. `index.ts` exports the catalogue.
- Task 05 - `bot:read` holds `bot:get`, which reads every bot. A holder of `bot:read` sees every bot, and the per-reader filter applies to a reader that `authorize` lets in.
- Task 06 - the `PLUGINS.md` section is after "Reserved names", next to `registerResourceProvider`.

## Left for later

- A membership change while a client is disconnected is not sent at the reconnect. The reconnect snapshot resets the set of the client, and the replay has no `to` action for it. The client gets the change at its next subscribe.
- Under a users directory, a reconnect replays the catalogue only on a connection admitted as a person. An anonymous reconnect gets the channel in `missing`, and the client subscribes again.
- `left` frees the set of a client, and no catalogue test fails without it.
- ahpapp and ahpc need a reducer for `x-ahpd-bots://` before they show it.
- `lint-prose` reports long sentences in `00-plugin.md` on lines this build did not write.
