---
title: The host gives each plugin a record store
domain: plugin
status: active
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
decisions:
  - decisions/a-plugin-keeps-records-in-the-host-store.md
  - decisions/yaml-lives-in-server.md
  - decisions/a-plugin-gets-yaml-from-the-host.md
  - decisions/a-person-edits-a-record-as-a-markdown-file.md
  - decisions/the-daemon-reloads-a-hand-edited-file.md
refs:
  - "[code://packages/sdk/src/plugins.ts#L86-L89](../../../../packages/sdk/src/plugins.ts#L86-L89) - `PORT_KEYS`, the ports a plugin may set"
  - "[code://packages/sdk/src/plugins.ts#L787-L791](../../../../packages/sdk/src/plugins.ts#L787-L791) - `recordUsage`, a port read when it is called"
  - "[code://packages/sdk/src/types/plugin.ts#L292-L360](../../../../packages/sdk/src/types/plugin.ts#L292-L360) - `PluginContext`"
  - "[code://packages/server/src/plugins.ts#L864-L880](../../../../packages/server/src/plugins.ts#L864-L880) - where the daemon makes each plugin's context and host"
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../../../packages/server/src/commands/run.ts#L654-L661) - where the daemon gives its default ports"
  - "[code://packages/sdk/src/sessions.ts#L712-L740](../../../../packages/sdk/src/sessions.ts#L712-L740) - `migrateSessions`, the pattern for the one-time conversion"
  - "[code://packages/sdk/src/resources.ts#L503](../../../../packages/sdk/src/resources.ts#L503) - the file store's `watch`, the pattern for a folder watch"
  - npm://@cofold/yaml@^0.3.0 - `parseYaml`, and `stringifyYaml` from cofold plan commands/05
---

## Goal

A plugin opens a collection with `host.records(name, options)` and keeps JSON records there.
The daemon's default record store, `fileRecords`, keeps each record as `<configDir>/<name>/<id>.md` and reloads a file a person edits.
A plugin replaces the record store with `registerRecords(store, 'replace')`.
A plugin reads and writes YAML with `parseYaml` and `stringifyYaml` on its context.

## Reconnaissance

### Searches performed

- `rg -n "PORT_KEYS|setPort" packages/sdk/src/plugins.ts` - one list of port keys and one setter for each port.
- `rg -n "sessionKept" packages/sdk/src/plugins.ts` - a call that waits for the fold before it answers.
- `rg -n "yaml" packages/server/package.json` - the server has no direct YAML dependency.

### Runtime path

```
apply -> host.records('bots', { body: 'instructions' }) -> a collection whose calls wait for the fold
fold -> HostOptions.records (the daemon's fileRecords, or a plugin's with 'replace') -> collection calls run
fileRecords: put -> stringifyYaml(fields) + body -> <configDir>/bots/<id>.md
fileRecords: folder watch -> parseYaml -> the collection's watchers
```

### Gaps

- No port holds plugin records.
- No code writes YAML.
- `PluginContext` has no YAML functions.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A plugin keeps its records in a record store the host gives it](../../../decisions/a-plugin-keeps-records-in-the-host-store.md) | Softov, 2026-10-11 |
| 2 | [The server depends on @cofold/yaml, and the sdk does not](../../../decisions/yaml-lives-in-server.md) | Softov, 2026-10-11 |
| 3 | [A plugin gets parseYaml and stringifyYaml from the host](../../../decisions/a-plugin-gets-yaml-from-the-host.md) | Softov, 2026-10-11 |
| 4 | [A bot or an automation is one Markdown file with YAML frontmatter](../../../decisions/a-person-edits-a-record-as-a-markdown-file.md) | Softov, 2026-10-10 |
| 5 | [The daemon reloads a bot or an automation file that a person edits](../../../decisions/the-daemon-reloads-a-hand-edited-file.md) | Softov, 2026-10-10 |

| What | Source | Task |
| --- | --- | --- |
| A collection has `get`, `list`, `find`, `put`, `remove` and `watch`, and each call answers a promise | decision 1; a database answers later | 01 |
| A record is a JSON object with a slug `id`, and the plugin checks its other fields | (defaulted: the store knows no plugin's record shape) | 01 |
| `find(match)` matches top-level fields by equality | (defaulted: the smallest query a database maps to `WHERE`) | 01 |
| A collection name is a slug, and a name that another plugin opened is refused | (defaulted: two plugins in one folder lose records) | 01 |
| A collection's calls wait until the fold names the port | `sessionKept` | 01 |
| `host.records` with no records port throws | `secret`, which refuses with no vault | 01 |
| The collection is the folder `<configDir>/<name>/`, so `bots` stays where it is | decision `a-bot-record-stays-in-config` | 02 |
| The plugin names the body field when it opens a collection, and a collection with none writes an empty body | decision 4 | 02 |
| A file whose frontmatter `id` names another id is refused | the file name is the id | 02 |
| `<id>.json` with no `<id>.md` is converted when the collection opens, and renamed `<id>.json.migrated` | `migrateSessions` | 02 |
| The store's own write does not reach its watchers as a second change | decision 5 | 02 |
| Each file is written whole at mode `0600` | the bot store's `written` | 02 |
| A loader that gives no YAML functions gives functions that throw | decision 3 | 03 |

## Proposed architecture

- **Data flow** - `fileRecords` writes the body field as the body and the other fields as frontmatter, and joins them on a read.
- **Event flow** - each open collection has one folder watch; a change to `<id>.md` tells each watcher the id and the change type.
- **State flow** - `fileRecords` keeps the text it wrote last per file, to ignore its own writes; the files are the truth.
- **Layer responsibilities** - `packages/sdk`: `RecordStore`, `RecordCollection`, `memoryRecords`, `registerRecords`, `host.records`, the YAML types on the context · `packages/server`: `fileRecords`, the YAML functions, the default port.
- **Source-of-truth files** - [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts), [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The sdk declares the record store](task-01-the-sdk-declares-the-record-store.md) | implemented | - |
| [02 - The server keeps records as Markdown files](task-02-the-server-keeps-records-as-markdown.md) | implemented | 01 |
| [03 - A plugin gets YAML from the host](task-03-a-plugin-gets-yaml-from-the-host.md) | implemented | - |
| [04 - The docs describe the record store](task-04-the-docs-describe-the-record-store.md) | implemented | 02, 03 |

## Risks and tradeoffs

- A watch on a folder that is not there yet sees nothing - `fileRecords` makes the folder when the collection opens.
- An editor saves through a temporary file and a rename - the watch reads `<id>.md` again on each event and ignores other names.
- The plan needs a published `@cofold/yaml` with `stringifyYaml` - cofold plan commands/05 comes first.

## Resume state

- **Done so far:** all four tasks are implemented and await review. The server keeps records as Markdown files, and the loader gives each plugin host the record store and one shared `collections` map. A plugin gets `parseYaml` and `stringifyYaml` on its context.
- **Next action:** review the four tasks, then the final verification checklist.
- **Open questions:** none.
- **Watch out for:** `@cofold/yaml` is a `link:` to the local cofold build. Change it to the published version before a release.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/sdk packages/server` passes.
- [ ] A test plugin replaces the record store with `memoryRecords`, and a second plugin's collection uses it.
- [ ] `plans/index.md` updated.
