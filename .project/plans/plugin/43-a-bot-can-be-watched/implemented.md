---
title: A bot can be watched - implemented
date: 2026-10-10
refs:
  - git://build/plugin-43 - the build, not merged yet
  - "[code://packages/sdk/src/host/admission.ts](../../../../packages/sdk/src/host/admission.ts) - the grant a watch and its channel ask for, and `authorize` for both"
  - "[code://packages/sdk/src/host/resourcemethods.ts](../../../../packages/sdk/src/host/resourcemethods.ts) - `createResourceWatch`, which hands `watch` its reader"
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `watch`, `hears` and `told`"
---

A client watches `bot://` or `bot://<slug>` with `createResourceWatch`.
A watcher hears `added`, `updated` and `deleted` for each bot its reader may read.

## What was built

- [`code://packages/sdk/src/host/admission.ts`](../../../../packages/sdk/src/host/admission.ts) - a watch on a provider scheme asks for `<scheme>:watch`, and so does the `subscribe` to its channel, checked against the watched root. `excusedBy` asks `authorize` for both.
- [`code://packages/sdk/src/host/resourcemethods.ts`](../../../../packages/sdk/src/host/resourcemethods.ts) - `createResourceWatch` passes the connection's principal to `watch`.
- [`code://packages/sdk/src/types/resources.ts`](../../../../packages/sdk/src/types/resources.ts) - `watch` takes an optional fourth argument, the reader.
- [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts) - a scheme whose provider has `watch` advertises the `watch` operation.
- [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts) - a set of watchers, `watch`, and `told`, which `write` and `remove` call.
- `docs/plugins/BOTS.md` has a section "A watch", `docs/sdk/RESOURCES.md` names the grant a watch asks for, and `packages/bot/README.md` has a row for the watch.

## Verified

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `pnpm exec vitest run packages` passes.
- `users-gate-watch.test.ts` has four cases, and `bot-provider.test.ts` has five.
- With the reader check, the slug check or the delete notice removed, one bot case fails each time.

## Departures from the plan

- Task 01 - the gate cases are in a new file, `users-gate-watch.test.ts`, not in `watches.test.ts`. They need the users directory, and `watches.test.ts` has none.
- Task 01 - `ResourceChange`, `Watcher` and `WatchOptions` are now exported from the sdk types, so a plugin can type its `watch`.
- Task 02 - a watch on `bot://` also hears every bot when the reader holds `bot:list`. That is what the listing shows the same reader.
- Task 03 - `docs/plugins/BOTS.md` has no commands table, so the watch has its own section with a table. The commands table is in `packages/bot/README.md`.

## Left for later

- A membership change applies at the next watch. Plan [44](../44-a-plugin-serves-a-channel/plan.md) follows it live.
