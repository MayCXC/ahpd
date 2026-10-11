---
title: A plugin is known by its id, not by the spec that loads it
domain: daemon
status: built
priority: high
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/daemon/11-root-config-carries-the-daemon-and-its-plugins/plan.md
refs:
  - "[code://packages/server/src/plugins.ts#L60](../../../../packages/server/src/plugins.ts#L60) - `nameOf`, the spec as written"
  - "[code://packages/server/src/plugins.ts#L183-L285](../../../../packages/server/src/plugins.ts#L183-L285) - `resolvePlugin` and `readManifest`, which find a plugin and its manifest without an import"
  - "[code://packages/server/src/plugins.ts#L655-L800](../../../../packages/server/src/plugins.ts#L655-L800) - `loadOne`, which names a plugin at L663 and L682"
  - "[code://packages/server/src/plugins.ts#L846-L852](../../../../packages/server/src/plugins.ts#L846-L852) - the options schemas and `optionsSchemaLoaded`, keyed by spec"
  - "[code://packages/server/src/plugins.ts#L956-L1004](../../../../packages/server/src/plugins.ts#L956-L1004) - the check for a repeated spec, and where the schemas are filled"
  - "[code://packages/server/src/plugins.ts#L1048-L1157](../../../../packages/server/src/plugins.ts#L1048-L1157) - `PluginRow`, `describePlugin` and `pluginLine`"
  - "[code://packages/server/src/commands/config.ts#L104-L165](../../../../packages/server/src/commands/config.ts#L104-L165) - `keyed`, the one key builder, and `schemasFor`"
  - "[code://packages/server/src/rootconfig.ts#L244-L398](../../../../packages/server/src/rootconfig.ts#L244-L398) - root config: `entries`, `pluginKey`, `schema`, `values` and `write`"
  - "[code://packages/server/src/install.ts#L262-L394](../../../../packages/server/src/install.ts#L262-L394) - the lookups by name: `namedIn`, `pluginEntry`, `editEntry`, `setPluginOption`, `setPluginEnabled`"
  - "[code://packages/server/src/commands/configure.ts#L86-L118](../../../../packages/server/src/commands/configure.ts#L86-L118) - `named` and `switched`"
  - "[code://packages/server/src/commands/plugin.ts#L39-L431](../../../../packages/server/src/commands/plugin.ts#L39-L431) - the `plugin` verbs and `recordedOverride`"
  - "[code://packages/server/src/commands/options.ts#L313-L343](../../../../packages/server/src/commands/options.ts#L313-L343) - `pluginOptionIn` and `splitPluginOption`"
  - "[code://packages/server/src/commands/options.ts#L885-L926](../../../../packages/server/src/commands/options.ts#L885-L926) - where `--plugin-option` is matched to an entry, before any import"
---

## Goal

Root config, the `ahpd plugin` verbs, the listing and `--plugin-option` name a plugin by its id, not by its spec.
The root config row for `./packages/agent-claude/src/index.ts` reads `plugins.@ahpd/agent-claude`, and it keeps that key when the entry changes to the npm package.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
The idea this plan comes from was `.project/ideas/a-plugin-has-an-id.md` (`git://2d0f42b`).

### Searches performed

- `rg -n "nameOf\(" packages/server/src` - every place that keys or finds a plugin by its spec.
- `rg -n "export const name" packages/*/src` - bot, push and devtunnel export a name that differs from the package name.
- `rg -n "plugins\." /github/ahpc/src /github/ahpapp/src /github/ahpw/src` - no client writes a plugin key by hand.
- `rg -n "plugins\.<|--plugin-option" docs packages/server/README.md` - DAEMON.md, HOST.md, PLUGINS.md, TOOLS.md and the server README.

### Runtime path

```
config.json plugins[] -> optionsFrom (matches --plugin-option by spec) -> loadPlugins -> loadOne (names it) -> pluginHost(name)
root config -> keyed(specs) -> plugins.<spec>
ahpd plugin config|enable|disable <spec> -> pluginEntry(file, spec)
```

### Gaps

- The loader names a plugin, but every key and lookup uses the spec.
- `--plugin-option` is matched before any import, so it cannot see the module's name.
- `rootconfig.ts` finds an entry in the filtered list and then writes at that index in the unfiltered `plugins`.

## Decisions locked in

| Decision | Source | Task |
| --- | --- | --- |
| [A plugin's id is the name its module exports, not the spec that loads it](../../../decisions/a-plugins-id-is-its-modules-name.md) | Softov, 2026-10-10 | 01, 02, 03, 04 |

| What | Source | Task |
| --- | --- | --- |
| A config entry has no `id` field of its own, and a module still loads once | Softov, 2026-10-10, asked "Should a config entry be able to set its own id, so one module can load twice?": "Not now (Recommended)"; [decision a-plugin-loads-once-and-each-preset-is-a-variant](../../../decisions/a-plugin-loads-once-and-each-preset-is-a-variant.md) stays | - |
| Two entries with the same id are reported as a problem that names both specs, and the first entry loads | (defaulted: the check for a repeated spec today, applied to the id) | 01 |
| Nothing is migrated: `config.json` keeps its entries by spec, and a key is built when it is read | (defaulted: no file stores a `plugins.<spec>` key) | 02 |
| A verb and `--plugin-option` find a plugin by its id first, then by its spec as written | (defaulted: a recorded `--plugin-option` line in `daemon.json` names the spec) | 03, 04 |
| `ahpd plugin list` imports each module to read its id, and calls no `apply` | Softov, 2026-10-10, asked whether the listing shows the configuration or the running process: "importo to read the id" | 03 |
| `--plugin-option` is matched in `optionsFrom`, after a first pass imports the specs for their ids | (defaulted: a typo stays refused before the start, and the recorded line keeps its form) | 04 |
| `@ahpd/computer`, `@ahpd/bot`, `@ahpd/push` and `@ahpd/tunnel-devtunnel` export their package name as `name` | Softov, 2026-10-10, asked whether the four should export their package name before 0.11.0: "Use package names (Recommended)" | 01 |
| A write to root config changes the entry the key names, not the entry at the same index in the filtered list | [`code://packages/server/src/rootconfig.ts#L346-L348`](../../../../packages/server/src/rootconfig.ts#L346-L348) | 02 |

## Proposed architecture

- **Data flow** - a spec -> its id, from the loader or an import without `apply` -> `plugins.<id>`, the row's `name` and the target of `--plugin-option`.
- **Event flow** - unchanged.
- **State flow** - the daemon keeps one map from spec to id for the run. A plugin installed while the daemon runs has the manifest's `name` until the next start.
- **Layer responsibilities** - server `plugins.ts`: the id and the map · `config.ts` and `rootconfig.ts`: keys · `install.ts`, `configure.ts`, `plugin.ts`: lookups · `options.ts` and the loader: `--plugin-option` · docs.
- **Source-of-truth files** - [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The loader gives every plugin its id, enabled or not](task-01-the-loader-gives-every-plugin-its-id.md) | implemented | - |
| [02 - Root config keys each plugin by its id](task-02-root-config-keys-each-plugin-by-its-id.md) | implemented | 01 |
| [03 - The plugin verbs and the listing take the id](task-03-the-plugin-verbs-take-the-id.md) | implemented | 01 |
| [04 - `--plugin-option` names the id](task-04-plugin-option-names-the-id.md) | implemented | 01 |
| [05 - The docs say a plugin is known by its id](task-05-docs.md) | implemented | 02, 03, 04 |

## Risks and tradeoffs

- A disabled plugin's module is imported, so its top-level code runs - installing a plugin is already the trust decision.
- A start with `--plugin-option` imports every named module twice over one URL, so the module cache runs its top-level code once.
- A served verb uses the ids from the start; a plugin installed while the daemon runs has its provisional id until the next start.
- Tests assert on `plugins.<path>` keys in many files - each one changes to the id.

## Resume state

- **Done so far:** every task, 01 to 05, implemented and awaiting review.
- **Next action:** review; see [implemented.md](implemented.md).
- **Open questions:** none.
- **Watch out for:** `packages/computer/src/devcontainer.ts` has its own `nameOf` for the specs it hands a nested host; leave it on the spec. `plugin-secret-ref.test.ts` and `plugin-connect.test.ts` already use the loader's name in their labels.

## Final verification checklist

- [ ] Root config shows `plugins.@ahpd/agent-claude` for `./packages/agent-claude/src/index.ts`, and the same key for `@ahpd/agent-claude`.
- [ ] A disabled `./packages/bot/src/index.ts` shows as `plugins.@ahpd/bot`.
- [ ] A path and the npm package of one plugin, both in `plugins`, give one problem that names both, and the first loads.
- [ ] `ahpd plugin config @ahpd/bot` and `ahpd plugin config ./packages/bot/src/index.ts` find the same entry.
- [ ] `--plugin-option @ahpd/agent-claude.x=1` sets the option on the path entry.
- [ ] `plans/index.md` updated, and the idea file deleted.
