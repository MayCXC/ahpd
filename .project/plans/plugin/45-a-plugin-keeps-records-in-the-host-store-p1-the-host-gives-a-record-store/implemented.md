---
title: The host gives each plugin a record store - implemented
date: 2026-10-11
refs:
  - git://0fcd7ad - `@cofold/yaml` from npm; the build is da2b27f, a483f2c, 343b6d9, 1cf152f and f55c30d, merged in dd02f22, with the review fix 50264e2
  - "[code://packages/sdk/src/types/records.ts](../../../../packages/sdk/src/types/records.ts) - `RecordStore`, `RecordCollection`, `RecordChange` and `CollectionOptions`"
  - "[code://packages/sdk/src/records.ts](../../../../packages/sdk/src/records.ts) - `memoryRecords` and the slug rule"
  - "[code://packages/sdk/src/plugins.ts](../../../../packages/sdk/src/plugins.ts) - `registerRecords`, `host.records`, and the YAML functions that throw"
  - "[code://packages/server/src/records.ts](../../../../packages/server/src/records.ts) - `fileRecords`, the daemon's default record store"
  - "[code://packages/server/src/plugins.ts](../../../../packages/server/src/plugins.ts) - the record store, the shared `collections` map and the YAML functions for each plugin"
  - npm://@cofold/yaml@^0.3.0 - `parseYaml` and `stringifyYaml`
---

A plugin opens a collection with `host.records(name, options)` and keeps JSON records there.
The daemon's default record store, `fileRecords`, keeps each record as `<configDir>/<name>/<id>.md` and reloads a file that a person edits.
A plugin replaces the record store with `registerRecords(store, 'replace')`.
A plugin reads and writes YAML with `parseYaml` and `stringifyYaml` on its context.

## What was built

- [`code://packages/sdk/src/types/records.ts`](../../../../packages/sdk/src/types/records.ts) - the record store types, with `StoredRecord` as the record type.
- [`code://packages/sdk/src/records.ts`](../../../../packages/sdk/src/records.ts) - `memoryRecords`, and the slug rule `RECORD_SLUG` with `isRecordSlug`, which the sdk index exports.
- [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts) - `records` in `PORT_KEYS`, `registerRecords`, and `host.records`, whose calls wait for the fold.
- [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts) - `registerRecords` and `records` on `PluginHost`, `parseYaml` and `stringifyYaml` on `PluginContext`, and `LoaderContext`.
- [`code://packages/server/src/records.ts`](../../../../packages/server/src/records.ts) - `fileRecords`, `recordFile` and `readRecordFile`, with a folder watch and the one-time conversion of `<id>.json`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `fileRecords` is the daemon's `records` port.
- [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts) - each plugin host gets the record store, one shared `collections` map and the `@cofold/yaml` functions.
- `docs/PLUGINS.md` has the sections "Keeping records" and "Reading and writing YAML", and `docs/DAEMON.md` has "Plugin records".
- `00-plugin.md` lists `registerRecords` in the port row.

## Verified

- `packages/sdk/test/plugin-records.test.ts` has 9 cases, and one of them replaces the record store with `memoryRecords` for a second plugin's collection.
- `packages/server/test/records.test.ts` had 13 cases at the build, and review fix 50264e2 adds two.
- `packages/server/test/plugin-load.test.ts` has a case for YAML through the context, and `plugin-host.test.ts` has a case for the functions that throw.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Task 01 - `RecordStore.collection` answers a promise, so a store can make its folder before the first call.
- Task 01 - `watch` answers a function and not a promise. Thus a `watch` on a host with no records port writes one line to the plugin log.
- Task 01 - `HostRecordingOptions.records` gives the store at call time, and `HostRecordingOptions.collections` is the map of names that each plugin opened.
- Task 02 - `fileRecords` keeps each collection's records in memory after the first open, and `get`, `list` and `find` answer from that copy.
- Task 02 - the body ends with one newline in the file, and a read removes it; `put` refuses a body field that is not text.
- Task 03 - `pluginHost` takes a `LoaderContext`, a `PluginContext` that can omit the two YAML functions.
- Task 03 - the daemon's `parseYaml` takes the text only, so a plugin cannot change the host's size and depth limits.
- 0fcd7ad - the server depends on `@cofold/yaml` `^0.3.0` from npm, where the build had a `link:` to the local cofold build.

## Left for later

- none; p2 moves the bot to the record store.
