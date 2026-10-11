---
title: A bot can be watched
domain: plugin
status: planned
priority: high
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/plugin/42-a-reserved-name-is-refused/plan.md
decisions:
  - decisions/bots-are-watched-and-catalogued.md
refs:
  - "[code://packages/sdk/src/host/resourcemethods.ts#L102-L134](../../../../packages/sdk/src/host/resourcemethods.ts#L102-L134) - `createResourceWatch`, which calls a provider's `watch` with no reader"
  - "[code://packages/sdk/src/types/resources.ts#L211-L215](../../../../packages/sdk/src/types/resources.ts#L211-L215) - `watch`, the signature a provider takes from `ResourceStore`"
  - "[code://packages/sdk/src/resources.ts#L503-L575](../../../../packages/sdk/src/resources.ts#L503-L575) - the file store's `watch`, the pattern to mirror"
  - "[code://packages/sdk/src/host/admission.ts#L231-L253](../../../../packages/sdk/src/host/admission.ts#L231-L253) - `excusedBy`, which asks `authorize` for a read and a list only"
  - "[code://packages/sdk/src/host/gate.ts#L252-L259](../../../../packages/sdk/src/host/gate.ts#L252-L259) - `channelRead`, which gates every resource watch channel as `file:watch`"
  - "[code://packages/sdk/src/host/root.ts#L21-L45](../../../../packages/sdk/src/host/root.ts#L21-L45) - `schemeOperations`, which does not advertise `watch`"
  - "[code://packages/bot/src/provider.ts#L184-L191](../../../../packages/bot/src/provider.ts#L184-L191) - `mayRead`"
  - "[code://packages/bot/src/provider.ts#L298-L317](../../../../packages/bot/src/provider.ts#L298-L317) - `authorize` and `list`, which a watch mirrors"
  - "[code://packages/bot/src/provider.ts#L429](../../../../packages/bot/src/provider.ts#L429) - `store.put`, where a make or an edit ends"
  - "[code://packages/bot/src/provider.ts#L453](../../../../packages/bot/src/provider.ts#L453) - `store.remove`, where a delete ends"
---

## Goal

A client watches `bot://` and hears when a bot it may read is made, edited or deleted.
It can also watch one bot, `bot://<slug>`.
This uses the protocol's own `createResourceWatch`, so any protocol client can use it.

## Reconnaissance

### Searches performed

- `rg -n "watch" packages/bot/src` - the bot provider has no `watch`.
- `rg -n "watch\??\(" packages/*/src` - only the `file:` store implements `watch`.
- `rg -n "createResourceWatch" /github/ahpapp/src` - ahpapp uses a watch for files only, and lists bots again after its own writes.

### Runtime path

```
client createResourceWatch bot:// -> admission (bot:watch or authorize) -> provider.watch(uri, options, onChange, reader)
bot write or delete -> provider -> each watcher -> mayRead -> resourceWatch/changed on ahp-resource-watch:/<id>
client subscribe ahp-resource-watch:/<id> -> gate (bot:watch, from the watched root) -> snapshot
```

### Gaps

- A provider's `watch` is not given the reader, so it cannot narrow what it reports.
- `authorize` is not asked for `createResourceWatch`, so a member who may list `bot://` may not watch it.
- A watch channel is gated as `file:watch` whatever scheme it watches, so a reader with `bot:watch` and no `file:watch` cannot subscribe.
- `schemeOperations` never advertises `watch`, so a client cannot tell that a scheme can be watched.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Bots are watched and catalogued](../../../decisions/bots-are-watched-and-catalogued.md) | Softov, 2026-10-10 |

| What | Source | Task |
| --- | --- | --- |
| A provider's `watch` gets the reader as a fourth argument, as `read` and `list` do | (defaulted: the same shape as `read` and `list`) | 01 |
| `authorize` is asked for `createResourceWatch` as it is for `resourceList`, because a watch is a read | [`code://packages/sdk/src/host/admission.ts#L231-L253`](../../../../packages/sdk/src/host/admission.ts#L231-L253) | 01 |
| A watch channel is gated by the watched root's scheme, as `<scheme>:watch` | (defaulted: the grant that created the watch) | 01 |
| `watch` is advertised in `operations` when a provider has it | (defaulted: `operations` lists what a provider implements) | 01 |
| A make is `added`, an edit is `updated` and a delete is `deleted` | the protocol's three `ResourceChangeType` words | 02 |
| A watcher hears only bots that `mayRead` lets it read, checked at each change | [`code://packages/bot/src/provider.ts#L184-L191`](../../../../packages/bot/src/provider.ts#L184-L191) | 02 |
| A delete is reported to a watcher that could read the bot before the delete | (defaulted: otherwise a client keeps a bot that is gone) | 02 |

## Proposed architecture

- **Data flow** - `createResourceWatch` passes `connection.principal` to `watch`. The bot provider keeps a set of watchers, each with its URI, options, callback and reader.
- **Event flow** - `write` and `remove` call one function, `told(change, record)`, after the store changes. It calls each watcher whose URI covers the slug and whose reader may read the record.
- **State flow** - the watcher set lives in the provider, and `close()` removes one.
- **Layer responsibilities** - `packages/sdk`: the reader, the gate and the advertised operation · `packages/bot`: `watch` · `docs`: the watch.
- **Source-of-truth files** - [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A provider's watch knows its reader](task-01-a-provider-watch-knows-its-reader.md) | todo | - |
| [02 - The bot provider reports a make, an edit and a delete](task-02-the-bot-provider-reports-changes.md) | todo | 01 |
| [03 - The docs describe the bot watch](task-03-the-docs-describe-the-bot-watch.md) | todo | 02 |

## Risks and tradeoffs

- A watch checks `mayRead` with the reader it was created with. A membership change applies at the next `createResourceWatch` - the catalogue in plan [44](../44-a-plugin-serves-a-channel/plan.md) follows membership changes live.
- A watch reports a URI only, so a client reads the bot again for each change - the catalogue carries the record.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-provider-watch-knows-its-reader.md](task-01-a-provider-watch-knows-its-reader.md).
- **Open questions:** none.
- **Watch out for:** the `file:` store ignores the new reader argument, and its tests must not change.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/sdk packages/bot packages/server` passes.
- [ ] `docs/BOTS.md` and `docs/RESOURCES.md` describe the watch.
- [ ] `plans/index.md` updated.
