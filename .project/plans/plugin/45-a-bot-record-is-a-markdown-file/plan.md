---
title: A bot record is a Markdown file, and the daemon reloads one a person edits
domain: plugin
status: planned
priority: medium
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/plugin/43-a-bot-can-be-watched/plan.md
  - plans/host/80-an-automation-is-a-markdown-file/plan.md
decisions:
  - decisions/a-person-edits-a-record-as-a-markdown-file.md
  - decisions/a-bot-record-stays-in-config.md
  - decisions/the-daemon-reloads-a-hand-edited-file.md
  - decisions/the-sdk-re-exports-yaml.md
refs:
  - "[code://packages/bot/src/store.ts#L83-L128](../../../../packages/bot/src/store.ts#L83-L128) - `botStore`, which reads `<slug>.json` once and writes it whole"
  - "[code://packages/bot/src/store.ts#L50-L62](../../../../packages/bot/src/store.ts#L50-L62) - `kept`, the check every record read passes"
  - "[code://packages/bot/src/plugin.ts#L37](../../../../packages/bot/src/plugin.ts#L37) - where the plugin opens its store"
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern for the one-time conversion"
  - "[code://packages/sdk/src/resources.ts#L503](../../../../packages/sdk/src/resources.ts#L503) - the file store's `watch`, the pattern for a folder watch"
---

## Goal

A bot record is `<configDir>/bots/<slug>.md`.
The frontmatter holds the record's fields, and the body holds its `instructions`.
A person reads, edits, copies or installs a bot as one file, and the running daemon uses an edit at once.
The workspace stays at `<root>/<slug>`, and nothing moves.

## Reconnaissance

### Searches performed

- `rg -n "\.json" packages/bot/src/store.ts` - the store names `<slug>.json` in four places.
- `rg -n "\.migrated" packages/*/src` - `migrateSessions` is the one conversion from an old file shape.
- `ls ~/.config/ahpd/bots` - three records, `boozi.json`, `unna.json` and `unno.json`.

### Runtime path

```
<configDir>/bots/<slug>.md -> botStore (parseYaml + body) -> kept -> botProvider -> resourceRead bot://<slug>
botProvider.write -> botStore.put -> stringifyYaml + body -> <slug>.md
a person edits <slug>.md -> folder watch -> botStore reload -> botProvider told -> watchers and the catalogue
```

### Gaps

- The store reads its files once, at start.
- The store has no way to tell the provider that a file changed.
- No code writes YAML.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A bot or an automation is one Markdown file with YAML frontmatter](../../../decisions/a-person-edits-a-record-as-a-markdown-file.md) | Softov, 2026-10-10 |
| 2 | [A bot record stays in the configuration folder, apart from its workspace](../../../decisions/a-bot-record-stays-in-config.md) | Softov, 2026-10-10 |
| 3 | [The daemon reloads a bot or an automation file that a person edits](../../../decisions/the-daemon-reloads-a-hand-edited-file.md) | Softov, 2026-10-10 |
| 4 | [The sdk depends on @cofold/yaml and re-exports it](../../../decisions/the-sdk-re-exports-yaml.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| The file name is the slug, and a frontmatter `id` that names another slug is refused | the slug is the file name today | 01 |
| A `<slug>.json` with no `<slug>.md` is converted at start and renamed `<slug>.json.migrated` | `migrateSessions` | 02 |
| A hand edit that changes `owner` or `workspace` is refused, and the store keeps the old record | an edit through the scheme may not change either | 03 |
| A tombstone in `bots-gone/` stays JSON | it is the daemon's own file, not one a person edits | - |

## Proposed architecture

- **Data flow** - a file is frontmatter plus body; the store joins the two into a `BotRecord` and passes it through `kept`.
- **Event flow** - the folder watch calls the store, the store calls an `onChange` the provider gives it, and the provider calls `told`.
- **State flow** - the store's map is the record of truth while the daemon runs; a reload replaces one entry.
- **Layer responsibilities** - `packages/bot` store: files, the watch, the conversion · `packages/bot` provider: notices to watchers.
- **Source-of-truth files** - [`code://packages/bot/src/store.ts`](../../../../packages/bot/src/store.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The store reads and writes a bot as Markdown](task-01-the-store-reads-and-writes-markdown.md) | todo | - |
| [02 - A JSON record is converted at start](task-02-a-json-record-is-converted.md) | todo | 01 |
| [03 - The store reloads a file a person edits](task-03-the-store-reloads-an-edit.md) | todo | 01 |
| [04 - The docs describe the bot file](task-04-the-docs-describe-the-bot-file.md) | todo | 03 |

## Risks and tradeoffs

- The store's own write causes a watch event - the store compares the file with what it wrote last and ignores a match.
- The store can read a file that an editor saved only in part - it keeps the old record when a file fails `kept`.
- The plan needs the sdk's YAML re-export - host plan 80 task 01 comes first.

## Resume state

- **Done so far:** nothing.
- **Next action:** host plan 80 task 01, then [task-01-the-store-reads-and-writes-markdown.md](task-01-the-store-reads-and-writes-markdown.md).
- **Open questions:** none.
- **Watch out for:** the provider tests make bots through the store, so their temporary folders hold `.md` files after task 01.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/bot` passes.
- [ ] A copy of `~/.config/ahpd/bots` converts, and each bot reads the same before and after.
- [ ] `plans/index.md` updated.
