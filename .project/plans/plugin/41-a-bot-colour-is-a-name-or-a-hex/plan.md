---
title: A bot's colour is a name or a hex colour
domain: plugin
status: built
priority: high
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
decisions:
  - decisions/a-bot-colour-is-a-name-or-a-hex.md
refs:
  - "[code://packages/bot/src/record.ts#L43-L49](../../../../packages/bot/src/record.ts#L43-L49) - `BOT_COLORS` and `BotColor`"
  - "[code://packages/bot/src/record.ts#L150-L156](../../../../packages/bot/src/record.ts#L150-L156) - `among`, the check a closed list uses"
  - "[code://packages/bot/src/record.ts#L220](../../../../packages/bot/src/record.ts#L220) - where a write's `color` is checked"
  - "[code://packages/bot/test/bot-record.test.ts#L78-L86](../../../../packages/bot/test/bot-record.test.ts#L78-L86) - the record test that refuses a colour outside the list"
  - "[code://packages/bot/test/bot-provider.test.ts#L258-L268](../../../../packages/bot/test/bot-provider.test.ts#L258-L268) - the provider test that refuses a colour outside the list"
  - "[code://docs/BOTS.md#L39-L43](../../../../docs/BOTS.md#L39-L43) - the bodies and colours a bot is drawn in"
  - "[code://packages/bot/README.md#L80-L82](../../../../packages/bot/README.md#L80-L82) - the package README on the colours"
---

## Goal

A person picks a bot's colour in ahpapp from the app's own palette, and the host keeps it.
The host takes one of the eleven colour names or a hex colour, `#rrggbb`.
A bot made with a name keeps its name.

## Reconnaissance

### Searches performed

- `rg -n "color" packages/bot/src` - `color` is checked in one place, `checkRecord`, with `among` and `BOT_COLORS`.
- `rg -n "BOT_COLORS|BotColor" packages --glob '!**/node_modules/**'` - only `packages/bot` uses them.
- `rg -n "colou?r" docs/BOTS.md packages/bot/README.md` - both documents name the eleven colours and nothing else.

### Runtime path

```
client resourceWrite bot://motion {color} -> bot provider write -> checkRecord -> color check -> bot store file
client resourceRead bot://motion -> record JSON -> client draws the name or the hex colour
```

### Gaps

- `Not found: a hex colour check - searched "#" and "hex" in packages/bot/src.`

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A bot's colour is one of the eleven names or a hex colour](../../../decisions/a-bot-colour-is-a-name-or-a-hex.md) | Softov, 2026-10-10 |

| What | Source | Task |
| --- | --- | --- |
| A hex colour is `#` and six hex digits; `#rgb`, `rgb()` and colour words outside the eleven are refused `-32602` | (defaulted: the form ahpapp writes) | 01 |
| The host keeps a hex colour in lowercase, so two writes of one colour read the same | (defaulted: one value, one spelling) | 01 |
| A make that names no colour still gets the first name, `red` | (defaulted: no change for a client that names none) | 01 |
| `BOT_COLORS` stays the list of eleven names, and `BotColor` becomes a name or a hex string | (defaulted: a client that offers the names keeps them) | 01 |
| The store's load takes a hex colour, or a hex bot is dropped at the next start | [`code://packages/bot/src/store.ts#L59`](../../../../packages/bot/src/store.ts#L59) | 01 |
| The manifest's `color` is `anyOf` the eleven names or `^#[0-9a-fA-F]{6}$` | Softov, 2026-10-10, to "How should the manifest describe `color`?" - "anyOf names or hex" | 01 |

## Proposed architecture

- **Data flow** - `checkRecord` takes `color` as one of `BOT_COLORS` or a `#rrggbb` string, and keeps the hex string in lowercase.
- **Event flow** - no change.
- **State flow** - the record file holds the name or the hex string as it was checked.
- **Layer responsibilities** - `packages/bot`: the check and its tests · `docs`: the record and the colours.
- **Source-of-truth files** - [`code://packages/bot/src/record.ts`](../../../../packages/bot/src/record.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A bot's colour is a name or a hex colour](task-01-a-bot-colour-is-a-name-or-a-hex.md) | done | - |
| [02 - The docs name the hex colour](task-02-the-docs-name-the-hex-colour.md) | done | 01 |

## Risks and tradeoffs

- A client that knows only the eleven names cannot draw a hex string - ahpapp writes hex colours and draws both.

## Resume state

- **Done so far:** both tasks are done; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `among` is shared with `body`, so leave it as it is and add a separate check for `color`.

## Final verification checklist

- [x] `pnpm vitest run packages/bot` passes.
- [x] `pnpm -r typecheck` passes, or the repository's own typecheck script.
- [x] `docs/BOTS.md` and `packages/bot/README.md` name the hex colour.
- [x] `plans/index.md` updated.
