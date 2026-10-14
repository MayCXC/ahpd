---
title: Usage is read through commands
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/81-host-records-get-channels-and-commands-p1-the-host-serves-x-commands/plan.md
decisions:
refs:
  - "[code://packages/sdk/src/usage.ts#L690-L740](../../../../packages/sdk/src/usage.ts#L690-L740) - `groupsBody` and `body`, the answers each leaf gives as text"
  - "[code://packages/sdk/src/usage.ts#L664-L688](../../../../packages/sdk/src/usage.ts#L664-L688) - `rangeOf` and `keysAsked`, which read `from`, `until` and `by` from the query"
  - "[code://packages/sdk/src/usage.ts#L763-L782](../../../../packages/sdk/src/usage.ts#L763-L782) - `authorize` and `list`, which say which pools a reader may read"
  - "[code://packages/server/src/commands/run.ts#L726-L734](../../../../packages/server/src/commands/run.ts#L726-L734) - where the daemon builds the usage provider"
---

## Goal

A client reads usage with five typed commands, and gets each answer as JSON, not as text in a `data` string.
Each command answers what the matching `usage:` read answers, for the same readers.

## Reconnaissance

### Searches performed

- `rg -n "leaf ===|asked.get" packages/sdk/src/usage.ts` - a pool has the leaves `day`, `week`, `month`, `range` and `records`; the query has `from`, `until` and `by`.
- `rg -n "authorize|refused|visible" packages/sdk/src/usage.ts` - one rule says which pools a reader may read.

### Runtime path

```
x-ahpd/usage/totals { pool } -> served method -> usage:read, or the reader's own pool -> Usage.total for day, week and month -> { pool, kind, name, day, week, month }
```

### Gaps

- Each answer is built as a JSON string, so a command cannot reuse it without parsing it again.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Host records get typed channels and commands beside their resource schemes](../81-host-records-get-channels-and-commands/plan.md) | Softov, 2026-10-11 |
| 2 | [An x- command is named x-ahpd/<domain>/<verb>](../../../../docs/PLUGINS.md) | Softov, 2026-10-11 |
| 3 | [Usage is read through a usage scheme](../../../../docs/USAGE.md) | Softov, 2026-10-02; the scheme stays |
| 4 | [Usage lists the charged pools a reader may read](../../../../docs/USAGE.md) | Softov; `pools` answers the same list |

| What | Source | Task |
| --- | --- | --- |
| Usage gets commands and no channel | decision 1 | 02 |
| The commands are `pools`, `totals`, `range`, `records` and `groups`, one for each read | (defaulted: one command for each leaf, so each answer has one shape) | 02 |
| `from`, `until` and `by` keep their names and defaults; `by` is a list | [code://packages/sdk/src/usage.ts#L664-L688](../../../../packages/sdk/src/usage.ts#L664-L688) | 01 |

## Proposed architecture

- **Data flow** - each leaf has one function that answers a value; the resource read gives it as text, and the command gives it as is.
- **Event flow** - none.
- **State flow** - none; the store answers each call.
- **Layer responsibilities** - `packages/sdk`: the answers and `usageMethods` · `packages/server`: passes the methods in `run.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/usage.ts`](../../../../packages/sdk/src/usage.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Each usage read answers a value](task-01-each-usage-read-answers-a-value.md) | done | - |
| [02 - The usage commands](task-02-the-usage-commands.md) | done | 01 |
| [03 - The docs describe the usage commands](task-03-the-docs.md) | done | 02 |

## Risks and tradeoffs

- A command and a read could drift apart - both call the same functions, and a test compares their answers.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are done, built and reviewed on 2026-10-11. [implemented.md](implemented.md) lists what was built and the departures.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `resolve` still measures the text `body` and `groupsBody` give, and both now call the same answers the commands call.

## Final verification checklist

- [x] Each command answers the value its read answers, for the same reader.
- [x] `pnpm exec vitest run packages/sdk packages/server` passes.
- [x] `plans/index.md` updated.
