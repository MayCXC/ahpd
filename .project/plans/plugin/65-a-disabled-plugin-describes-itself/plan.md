---
title: A disabled plugin describes itself
domain: plugin
status: planned
priority: medium
created: 2026-10-25
revalidated: 2026-10-25
requires:
  - plans/plugin/64-an-admin-installs-a-plugin-from-the-ui/plan.md
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L604-L626](../../../../packages/sdk/src/types/plugin.ts#L604-L626) - `PluginSpec`, where `name` is the module specifier"
  - "[code://packages/sdk/src/types/plugin.ts#L1258-L1290](../../../../packages/sdk/src/types/plugin.ts#L1258-L1290) - the `Plugin` interface, with the `manifest` and `optionsSchema` exports"
  - "[code://packages/server/src/config.ts#L767](../../../../packages/server/src/config.ts#L767) - `asSpec`, which reads one entry of the `plugins` list"
  - "[code://packages/server/src/install.ts#L414-L435](../../../../packages/server/src/install.ts#L414-L435) - `editEntry`, which every entry change goes through"
  - "[code://packages/server/src/plugins.ts#L60-L103](../../../../packages/server/src/plugins.ts#L60-L103) - `nameOf`, `pluginIdOf` and the id read with no import"
  - "[code://packages/server/src/plugins.ts#L319-L361](../../../../packages/server/src/plugins.ts#L319-L361) - `readManifest`, the package.json `ahpd` field read with no import"
  - "[code://packages/server/src/plugins.ts#L955-L1040](../../../../packages/server/src/plugins.ts#L955-L1040) - where a load reads the `manifest` and `optionsSchema` exports"
  - "[code://packages/server/src/plugins.ts#L1660-L1700](../../../../packages/server/src/plugins.ts#L1660-L1700) - `describePlugin`, which returns before it reads a disabled plugin's manifest"
  - "[code://packages/server/src/pluginschannel.ts#L150-L200](../../../../packages/server/src/pluginschannel.ts#L150-L200) - `schemaFor` and the row, which send a manifest only from the loaded copy"
  - "[code://docs/plugins/PLUGINS.md#L1075-L1135](../../../../docs/plugins/PLUGINS.md#L1075-L1135) - the manifest section of the author's guide"
  - file:///github/ahp-review/briefs/plugin-details.md - the brief this plan comes from
---

## Goal

A client shows what a disabled plugin is, what it provides and which options it takes, before an admin enables it.
An admin can also set its options before it runs.
Every plugin has a manifest that the daemon reads with no import.
A plugin from a package keeps package.json as its manifest.
A standalone plugin gets its manifest from a `plugin.json` or from its own config entry.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -l "export const optionsSchema" -- 'packages/*/src/*.ts'` - eleven first-party plugins export a schema: activepieces, agent-acp, agent-claude, agent-cofold, agent-pi, bot, computer, push, tasks, tunnel-devtunnel and webhook.
- `git grep -n "optionsSchema.properties" -- packages` - agent-cofold and agent-pi read their own schema in code, to build a records schema.
- `git grep -l "export const manifest" -- packages` - only two server test fixtures export a manifest. No first-party plugin does.
- `git grep -c manifest -- 'packages/server/test/*.ts'` - eleven test files and nine fixtures name a manifest.

### Runtime path

```
config.json plugins entry -> asSpec -> describePlugin (no import) -> manifest and schema -> plugins channel row -> ahpw plugin page
```

### Gaps

- A disabled row holds only its spec, its id and its state.
- The channel sends no options schema for a disabled plugin, so a value set before an enable is masked and not checked.
- A single file with no package.json, and a spec with a scheme, have no manifest without an import.
- In a config entry, `name` is the module specifier, so the entry has no place for a display name.

## Answers

| What | Source | Task |
| --- | --- | --- |
| In a config entry, `source` replaces `name` as the module specifier, and `name` is the display name | Softov, 2026-10-25: "in plugin config we change name to source" | 01 |
| An entry with `name` and no `source` is read as the old form, and the daemon writes `source` the next time the entry changes | Softov, 2026-10-25 | 01 |
| A bare string in `plugins` stays, as shorthand for `{ "source": "<string>" }` | (defaulted: a package name needs nothing else) | 01 |
| A standalone plugin needs a declarative manifest, and a bare `.ts` or `.js` file with none fails with a clear error | Softov, 2026-10-25 | 02 |
| A standalone plugin is a file that sits in no package with an `ahpd` field, or a spec with a scheme | (defaulted: the two cases the brief found) | 02 |
| `source` can name a `plugin.json`, whose `main` names the file to run | Softov, 2026-10-25 | 02 |
| A config entry can hold the manifest itself, as `{ id, name, version, source, enabled }` | Softov, 2026-10-25 | 02 |
| A `plugin.json` and an inline entry take the same keys as the `ahpd` field, plus `id`, `name` and `version` | (defaulted: one manifest shape) | 02 |
| A standalone plugin's id is its manifest's `id`, and a module whose `name` export differs is refused at load | Softov, 2026-10-25 | 02 |
| The module's `manifest` export goes | (defaulted: a standalone manifest is now declarative) | 02 |
| A disabled row carries the manifest the daemon reads with no import, and so does an enabled plugin that failed to load | (defaulted: the goal) | 03 |
| The options schema is a JSON Schema in the manifest, at `ahpd.optionsSchema` in package.json and `optionsSchema` in a standalone manifest | Softov, 2026-10-25: "New `ahpd.optionsSchema`" | 04 |
| `ahpd.options` and its `required` flags go, because the schema's `required` list says the same | Softov, 2026-10-25: "New `ahpd.optionsSchema`" | 04 |
| The module's `optionsSchema` export goes, and a module that still exports one is refused with an error that says where it moves | Softov, 2026-10-25: "Remove it"; refusal (defaulted: a silent ignore hides the move) | 04 |
| A first-party plugin that reads its own schema in code imports its package.json with `with { type: 'json' }` | (defaulted: the schema stays in one place) | 04 |

## Proposed architecture

- **Data flow** - the daemon reads a manifest from package.json, a `plugin.json` or the config entry, with no import. The row and the options commands read the manifest and its schema from there.
- **State flow** - a row's state is as it is today. Only the fields it carries change.
- **Layer responsibilities** - sdk: the plugin types. server: the entry reader, the manifest reader, the load checks and the channel row. Each first-party package: its schema in package.json. docs: PLUGINS.md.
- **Source-of-truth files** - [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts), [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - `source` names the module in a config entry](task-01-source-names-the-module.md) | todo | - |
| [02 - A standalone plugin has a manifest](task-02-a-standalone-plugin-has-a-manifest.md) | todo | 01 |
| [03 - A disabled row carries its manifest](task-03-a-disabled-row-carries-its-manifest.md) | todo | 02 |
| [04 - The options schema is in the manifest](task-04-the-options-schema-is-in-the-manifest.md) | todo | 03 |

## Risks and tradeoffs

- A third-party plugin that exports `optionsSchema` or `manifest` stops loading - the error names the manifest key to move it to, and PLUGINS.md says so.
- ahpw reads `row.spec.name` - the ahpw plan after this one reads `source`, and the old `name` stays readable until then.
- `ahpd plugin` commands still import a disabled package plugin to learn its id - a standalone plugin needs no import, because its manifest names the id.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-source-names-the-module.md](task-01-source-names-the-module.md).
- **Open questions:** none.
- **Watch out for:** a row must never carry an option value that the schema marks as a secret. A disabled plugin now has a schema, so the mask applies to it too.

## Final verification checklist

- [ ] A disabled plugin's row shows its title, version, manifest and options schema, with no import of its module.
- [ ] `x-ahpd/plugins/options` checks a value against a disabled plugin's schema.
- [ ] An old entry with `name` loads, and is written back with `source` at its next change.
- [ ] A bare file with no manifest is refused with a clear error.
- [ ] The eleven first-party plugins load with their schema in package.json.
- [ ] `plans/index.md` updated.
