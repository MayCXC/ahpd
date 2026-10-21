---
title: The computer and bot listings answer the caller's own
domain: plugin
status: planned
priority: medium
created: 2026-10-21
revalidated: 2026-10-21
refs:
  - "[code://packages/computer/src/provider.ts#L353-L357](../../../../packages/computer/src/provider.ts#L353-L357) - `list` on `computer://`, which answers every machine"
  - "[code://packages/computer/src/catalogue.ts#L29-L44](../../../../packages/computer/src/catalogue.ts#L29-L44) - the `x-ahpd-computers` records channel"
  - "[code://packages/sdk/src/types/computers.ts#L158](../../../../packages/sdk/src/types/computers.ts#L158) - `KeptFor`, which holds the owner of a machine"
  - "[code://packages/bot/src/provider.ts#L280-L287](../../../../packages/bot/src/provider.ts#L280-L287) - `mayRead` of a bot, which already compares `bot.owner` with `user:<id>`"
  - "[code://packages/bot/src/provider.ts#L570-L579](../../../../packages/bot/src/provider.ts#L570-L579) - `list` on `bot:/`"
  - "[code://packages/computer/test/catalogue.test.ts](../../../../packages/computer/test/catalogue.test.ts) - the computer channel cases"
  - "[code://packages/bot/test/bot-provider.test.ts](../../../../packages/bot/test/bot-provider.test.ts) - the bot listing cases"
---

## Goal

[host 112](../../host/112-a-listing-answers-the-callers-own-records/plan.md) adds the filter `owner=me` to the sdk listings and to the records channel.
After this plan, `computer://?owner=me`, the `x-ahpd-computers` channel with `?owner=me`, and `bot:/?owner=me` answer only the caller's records.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "owner" packages/computer/src/provider.ts` - a machine is made with an owner, and the listing does not read it.
- The bot listing filters with `mayRead` unless the reader has `bot:list`, and the filter applies after that.

### Runtime path

```
resourceList computer://?owner=me -> list(uri, reader) -> ownerFilter -> machines whose owner is the caller
subscribe x-ahpd-computers?owner=me -> recordsChannel with ownerOf -> the caller's machines
resourceList bot:/?owner=me -> list(uri, reader) -> mayRead, then ownerFilter -> the caller's bots
```

### Gaps

- The computer listing and channel answer every machine.
- The bot listing answers every bot the reader may read, with no way to ask for the reader's own.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The same filter as host 112, `?owner=me`, for the caller only | Softov, 2026-10-21, the answers in host 112 | 01, 02 |

## Proposed architecture

- **Data flow** - each `list` reads the query with `ownerFilter` and keeps the records whose owner equals the result. The computer channel gives `ownerOf` to `recordsChannel`.
- **Source-of-truth files** - [`code://packages/computer/src/provider.ts`](../../../../packages/computer/src/provider.ts), [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The computer listing and channel take the owner filter](task-01-the-computer-listing-takes-the-owner-filter.md) | todo | - |
| [02 - The bot listing takes the owner filter](task-02-the-bot-listing-takes-the-owner-filter.md) | todo | - |

## Risks and tradeoffs

- A machine made before owners were kept has no owner, so it does not match the filter.

## Resume state

- **Done so far:** nothing.
- **Next action:** wait for host 112, then [task-01-the-computer-listing-takes-the-owner-filter.md](task-01-the-computer-listing-takes-the-owner-filter.md).
- **Open questions:** none.
- **Watch out for:** the `packages/computer` tests time out on this machine, on main too. Run them on CI, or with a longer timeout.
