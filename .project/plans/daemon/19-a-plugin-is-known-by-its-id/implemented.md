---
title: A plugin is known by its id, not by the spec that loads it - implemented
date: 2026-10-10
refs:
  - git://build/daemon-19 - the build, not merged yet
  - "[code://packages/server/src/plugins.ts](../../../../packages/server/src/plugins.ts) - `namePlugin`, `pluginIdsOf`, `pluginIdOf` and `isNamed`"
  - "[code://packages/server/src/commands/options.ts](../../../../packages/server/src/commands/options.ts) - `namedOptionsFrom`, which names the specs before `--plugin-option` is matched"
  - "[code://packages/server/src/rootconfig.ts](../../../../packages/server/src/rootconfig.ts) - `entries`, keyed by id and indexed into the whole `plugins` list"
---

Every place that names a plugin uses its id: root config, the `ahpd plugin` verbs, the listing and `--plugin-option`.
The id is the module's `name` export, then the manifest's `name`, then the file name, then the spec.
The verbs and `--plugin-option` still take the spec as written.

## What was built

- [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts) - the id. `namePlugin` imports a module and reads its id. `pluginIdsOf` fills the run's map from spec to id. `loadPlugins` names every entry, a disabled one too, before it loads any. `pluginLine` prints the spec beside the id when the two differ.
- [`code://packages/server/src/commands/config.ts`](../../../../packages/server/src/commands/config.ts) - `keyed` builds `plugins.<id>`.
- [`code://packages/server/src/rootconfig.ts`](../../../../packages/server/src/rootconfig.ts) - `entries` keys by id, and a write changes the entry the key names.
- [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts), [`code://packages/server/src/commands/configure.ts`](../../../../packages/server/src/commands/configure.ts) and [`code://packages/server/src/commands/plugin.ts`](../../../../packages/server/src/commands/plugin.ts) - each lookup finds a plugin by its id or by its spec.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - `namedOptionsFrom`, which `run.ts` and `start.ts` call in place of `optionsFrom`.
- `computer`, `bot`, `push` and `tunnel-devtunnel` export their package name, so every first-party id is its package name, as Softov chose.
- `docs/PLUGINS.md` has a section on the id; `docs/DAEMON.md`, `docs/HOST.md`, `docs/TOOLS.md` and `packages/server/README.md` name a plugin by its id.

## Verified

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- The tests of `sdk`, `server`, `computer`, `bot`, `push`, `tunnel-devtunnel` and the four agent packages pass.
- `rg -n "plugins\.\./|--plugin-option \./" docs packages/server/README.md` finds nothing.
- The checklist items are covered by `server-root-config.test.ts`, `plugin-load.test.ts`, `plugin-config.test.ts` and `server-commands.test.ts`.

## Departures from the plan

- Task 01 - two entries with one id are a problem that names both specs, and the first entry loads; the start is not stopped. This is what the check for a repeated spec did before, and the plan's second table now says so.
- Task 03 - `ahpd plugin list` imports each module to read its id, per Softov's answer. Three listing tests in `agent-acp`, `agent-cofold` and `computer` asserted no import, and now assert the id.
- Task 04 - `--plugin-option` is still matched in `optionsFrom`, not in the loader. `namedOptionsFrom` imports the specs for their ids first, so a typo is still refused before the start.
- A served verb uses the ids from the daemon's start, and a plugin installed while it runs has its provisional id until the next start.

## Left for later

- none.
