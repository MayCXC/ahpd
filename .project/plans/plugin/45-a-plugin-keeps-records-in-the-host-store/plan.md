---
title: A plugin keeps its records in the host's record store, and the bot keeps its records there
domain: plugin
status: built
priority: medium
created: 2026-10-10
revalidated: 2026-10-11
requires:
  - plans/plugin/43-a-bot-can-be-watched/plan.md
decisions:
  - decisions/a-bot-record-stays-in-config.md
refs:
  - "[code://packages/bot/src/store.ts#L24-L35](../../../../packages/bot/src/store.ts#L24-L35) - `BotStore`, the private store that the record store replaces"
  - "[code://packages/sdk/src/types/plugin.ts#L522-L588](../../../../packages/sdk/src/types/plugin.ts#L522-L588) - the ports a plugin replaces with `'replace'`"
  - "[code://packages/server/src/plugins.ts#L864-L880](../../../../packages/server/src/plugins.ts#L864-L880) - where the daemon makes each plugin's context and host"
---

## Goal

The host gives each plugin a record store: named collections of JSON records.
The daemon's default record store keeps each record as `<configDir>/<collection>/<id>.md`, and it reloads a file that a person edits.
A sqlite or postgresql plugin replaces the record store with one `registerRecords` call.
The bot plugin keeps its bots in the record store, and it never reads or writes a file.

## Reconnaissance

### Searches performed

- `rg -n "configDir" packages/*/src` - the bot and computer plugins write their own files under `configDir`.
- `rg -n "registerVault|recordUsage" packages/sdk/src/plugins.ts` - a port that a plugin reads is resolved when it is called, not at load.
- `rg -n "store\.(all|get|gone|put|remove)" packages/bot/src/provider.ts` - ten calls, each synchronous today.

### Runtime path

```
plugin -> host.records('bots', { body: 'instructions' }) -> the folded records port -> a collection
default port: server fileRecords(configDir) -> <configDir>/bots/<id>.md (parseYaml + body)
a person edits <id>.md -> folder watch -> collection watch -> the plugin
a sqlite plugin -> registerRecords(store, 'replace') -> every plugin's collections
```

### Gaps

- A plugin has no store that a database plugin can replace.
- No code writes YAML.
- A store reads its files once, at start.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A plugin keeps its records in a record store the host gives it](../45-p1-the-host-gives-a-record-store/plan.md) | Softov, 2026-10-11 |
| 2 | [The server depends on @cofold/yaml, and the sdk does not](../../../rules/the-sdk-depends-only-on-the-protocol.md) | Softov, 2026-10-11 |
| 3 | [A plugin gets parseYaml and stringifyYaml from the host](../../../../docs/plugins/PLUGINS.md) | Softov, 2026-10-11 |
| 4 | [A bot or an automation is one Markdown file with YAML frontmatter](../../../../docs/plugins/BOTS.md) | Softov, 2026-10-10 |
| 5 | [A bot record stays in the configuration folder, apart from its workspace](../../../decisions/a-bot-record-stays-in-config.md) | Softov, 2026-10-10 |
| 6 | [The daemon reloads a bot or an automation file that a person edits](../../../../docs/plugins/BOTS.md) | Softov, 2026-10-10 |

The child plans hold the second table for their own tasks.

## Proposed architecture

- **Data flow** - a plugin keeps JSON records with a slug `id`; the default store writes each as frontmatter plus body.
- **Event flow** - the default store watches each open collection's folder and tells the collection's watchers which id changed.
- **State flow** - the record store is the record of truth; a plugin may keep a cache that its watch keeps current.
- **Layer responsibilities** - `packages/sdk`: the port types, `registerRecords`, `host.records` · `packages/server`: `fileRecords`, the YAML functions on the context · `packages/bot`: a store over one collection.
- **Source-of-truth files** - [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts), [`code://packages/bot/src/store.ts`](../../../../packages/bot/src/store.ts)

## Tasks

| Child plan | Status | Depends on |
| --- | --- | --- |
| [p1 - The host gives each plugin a record store](../45-p1-the-host-gives-a-record-store/plan.md) | built | cofold commands/05 |
| [p2 - The bot keeps its records in the record store](../45-p2-the-bot-keeps-its-records-there/plan.md) | built | p1 |

## Risks and tradeoffs

- The record store is asynchronous, so the bot provider's ten store calls wait - p2 keeps a cache that the watch keeps current.
- The default store's own write causes a watch event - the store compares the file with what it wrote last and ignores a match.
- The default store can read a file that an editor saved only in part - it keeps the old record and reports the file.

## Resume state

- **Done so far:** p1 is built and reviewed on 2026-10-11; see its [implemented.md](../45-p1-the-host-gives-a-record-store/implemented.md). The server depends on `@cofold/yaml` `^0.3.0` from npm.
- **Next action:** Softov reviews p2.
- **Open questions:** none.
- **Watch out for:** host plan 80 needs p1's Markdown record code in the server.

## Final verification checklist

- [x] Both child plans are built.
- [x] A copy of `~/.config/ahpd/bots` converts, and each bot reads the same before and after.
- [x] `plans/index.md` updated.
