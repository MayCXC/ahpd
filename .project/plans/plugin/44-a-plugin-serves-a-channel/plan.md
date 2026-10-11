---
title: A plugin serves a channel, and bots have a catalogue
domain: plugin
status: built
priority: high
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/plugin/42-a-reserved-name-is-refused/plan.md
decisions:
  - decisions/bots-are-watched-and-catalogued.md
  - decisions/a-plugin-channel-is-an-x-scheme.md
  - decisions/a-plugin-channel-filters-each-action-per-subscriber.md
refs:
  - "[code://packages/sdk/src/host/channels.ts#L14](../../../../packages/sdk/src/host/channels.ts#L14) - `AUTOMATIONS`, the host's own catalogue channel and the pattern to mirror"
  - "[code://packages/sdk/src/host/snapshots.ts#L72-L93](../../../../packages/sdk/src/host/snapshots.ts#L72-L93) - `snapshotOf`, which names each channel kind in turn"
  - "[code://packages/sdk/src/host/routing.ts#L200](../../../../packages/sdk/src/host/routing.ts#L200) - where a channel is routed by kind"
  - "[code://packages/sdk/src/host/gate.ts#L252-L259](../../../../packages/sdk/src/host/gate.ts#L252-L259) - `channelRead`, the grant a subscribe needs"
  - "[code://packages/sdk/src/host/handshake.ts#L279](../../../../packages/sdk/src/host/handshake.ts#L279) - where `ahpd.resourceProviders` is advertised on initialize"
  - "[code://packages/sdk/src/host/root.ts#L390](../../../../packages/sdk/src/host/root.ts#L390) - where it is advertised in root state"
  - "[code://packages/sdk/src/host.ts#L520-L556](../../../../packages/sdk/src/host.ts#L520-L556) - `seenBy`, the hook each send goes through"
  - "[code://packages/sdk/src/host.ts#L589-L610](../../../../packages/sdk/src/host.ts#L589-L610) - `emit`, one `serverSeq` and one replay buffer"
  - "[code://packages/sdk/src/types/plugin.ts#L532](../../../../packages/sdk/src/types/plugin.ts#L532) - `registerResourceProvider`, the registration this one sits beside"
  - "[code://packages/sdk/src/types/events.ts#L29-L47](../../../../packages/sdk/src/types/events.ts#L29-L47) - `EventName`, which has no users event"
  - "[code://packages/sdk/src/users.ts#L393](../../../../packages/sdk/src/users.ts#L393) - `fileUsers`, which reads its file at each check and says nothing when it changes"
  - "[code://packages/bot/src/provider.ts#L184-L191](../../../../packages/bot/src/provider.ts#L184-L191) - `mayRead`, which decides what a reader sees"
---

## Goal

A plugin can serve a channel of its own, under an `x-` scheme.
The bot plugin serves `x-ahpd-bots://`, a catalogue of the bots a reader may read.
A subscriber gets every readable bot in one snapshot, then `x-ahpd-bots/added`, `x-ahpd-bots/changed` and `x-ahpd-bots/removed` with each record.
When a membership change makes a bot readable or unreadable, the subscriber gets `added` or `removed` for it.

## Reconnaissance

### Searches performed

- `rg -n "AUTOMATIONS" packages/sdk/src` - the host's catalogue channel has a case in `snapshotOf`, routing, the gate and the handshake.
- `rg -n "registerMethod|registerChannel" packages .project` - no plugin can serve a channel today.
- `rg -n "users_changed|onChange" packages/sdk/src/users.ts packages/sdk/src/types/events.ts` - nothing tells a plugin that memberships changed.

### Runtime path

```
client subscribe x-ahpd-bots:// -> gate (bot:read, or the channel's authorize) -> channel.snapshot(uri, reader, client)
bot write or delete -> handle.publish(action, { visible }) -> emit -> seenBy(visible(reader)) -> subscribers
users file changes -> users_changed -> bot plugin diffs each subscriber's set -> publish(added|removed, { to: client })
client unsubscribe or disconnect -> channel.left(client)
```

### Gaps

- A plugin cannot register a channel, and an unknown scheme routes as a session.
- A send cannot be narrowed per subscriber, because `seenBy` knows no test from the sender.
- No event says that the users file changed.
- `initialize` and root state do not advertise a plugin channel.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Bots are watched and catalogued](../../../decisions/bots-are-watched-and-catalogued.md) | Softov, 2026-10-10 |
| 2 | [A plugin channel is an x- scheme](../../../decisions/a-plugin-channel-is-an-x-scheme.md) | Softov, 2026-10-10 |
| 3 | [A plugin channel filters each action per subscriber](../../../decisions/a-plugin-channel-filters-each-action-per-subscriber.md) | (defaulted: the shared `serverSeq` warning) |

| What | Source | Task |
| --- | --- | --- |
| A membership change sends `added` or `removed` to each subscriber whose view changed | Softov, 2026-10-10, "Also push added/removed on membership change" | 01, 05 |
| `users_changed` fires on a change to the users file and on a write the host makes | (defaulted: a hand edit and a command both change memberships) | 01 |
| A client may not dispatch an action to a plugin channel | (defaulted: the channel is the plugin's state, as `ahp-automations://` is the host's) | 02 |
| A channel declares the grant a subscribe needs, and may add `authorize(uri, reader)` | the `ResourceProvider.authorize` pattern | 02 |
| A channel is told `left(client)` on unsubscribe and on disconnect | (defaulted: a plugin that keeps per-client state must free it) | 02 |
| A send may name one client with `to` | (defaulted: a membership diff is per subscriber) | 03 |
| A plugin channel is advertised in `_meta['ahpd.channels']` | the `ahpd.resourceProviders` pattern | 04 |
| `removed` goes to a subscriber that could read the bot before | (defaulted: otherwise a client keeps a bot that is gone) | 05 |

## Proposed architecture

- **Data flow** - `registerChannel(scheme, channel)` adds the channel to the fold. The host routes each URI with that scheme to it, and asks it for a snapshot with the reader and the client.
- **Event flow** - `publish` calls `emit` with a test. `seenBy` calls the test with the connection's principal, at the send and at a replay.
- **State flow** - the bot plugin keeps the set of slugs it sent to each client. `users_changed` makes it read each set again and send the difference.
- **Layer responsibilities** - `packages/sdk`: the channel kind, routing, gate, filter and advertisement, and `users_changed` · `packages/bot`: the catalogue · `docs`: both.
- **Source-of-truth files** - [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts), [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host says when memberships change](task-01-the-host-says-when-memberships-change.md) | done | - |
| [02 - A plugin registers a channel](task-02-a-plugin-registers-a-channel.md) | done | - |
| [03 - A plugin publishes to some subscribers](task-03-a-plugin-publishes-to-some-subscribers.md) | done | 02 |
| [04 - The host advertises a plugin channel](task-04-the-host-advertises-a-plugin-channel.md) | done | 02 |
| [05 - The bot plugin serves its catalogue](task-05-the-bot-plugin-serves-its-catalogue.md) | done | 01, 03 |
| [06 - The docs describe a plugin channel and the catalogue](task-06-the-docs-describe-a-plugin-channel.md) | done | 04, 05 |

## Risks and tradeoffs

- A filtered subscriber sees gaps in `serverSeq` on the channel, and a client that checks for gaps must accept them there.
- The stock library mirror ignores `x-ahpd-bots://`, so ahpapp and ahpc need a reducer before they show it.
- A watch on the users file can fire twice for one save, so the bot plugin sends only a difference, never a repeat.

## Resume state

- **Done so far:** tasks 01 to 06 are done. [implemented.md](implemented.md) lists what was built and the departures.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** an `x-` URI must not reach the session routes, and a test must prove it.

## Final verification checklist

- [x] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [x] `pnpm exec vitest run packages/sdk packages/bot packages/server` passes.
- [x] A test subscribes two readers to `x-ahpd-bots://` and proves each sees only its own bots, after a replay too.
- [x] A test changes a membership and proves the subscriber gets `added` and `removed`.
- [x] `plans/index.md` updated.
