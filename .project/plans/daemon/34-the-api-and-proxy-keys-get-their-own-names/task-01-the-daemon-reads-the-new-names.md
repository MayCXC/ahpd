---
title: The daemon reads the new names
status: implemented
depends: []
layer: "packages/server"
refs:
  - "[code://packages/server/src/config.ts](../../../../packages/server/src/config.ts) - `Config` and the file read"
  - "[code://packages/server/src/commands/options.ts](../../../../packages/server/src/commands/options.ts) - the fields, `FILE_ONLY`, the checks and the run"
  - "[code://packages/server/src/rootconfig.ts](../../../../packages/server/src/rootconfig.ts) - `DAEMON_KEYS` and the write"
---

## Objective

The daemon declares `httpApi` and `modelProxy` in place of `http` and `proxy`.
It still reads the old names, and warns at start for each one it finds.

## Files

- `UPDATE: packages/server/src/config.ts` - rename the two keys in `Config`, and map the old names when the file is read.
- `UPDATE: packages/server/src/commands/options.ts` - rename the two fields, `FILE_ONLY`, the checks and the reads.
- `UPDATE: packages/server/src/rootconfig.ts` - rename the keys in `DAEMON_KEYS`, and remove an old name on a write.
- `UPDATE: packages/server/src/proxy` - rename each read of the configuration key, and keep the `proxy` grant.
- `UPDATE: packages/server/test` - rename the keys in the tests, and add the cases below.

## Steps

1. Rename `http` to `httpApi` and `proxy` to `modelProxy` in `Config`, the fields, `FILE_ONLY` and `DAEMON_KEYS`.
2. Keep the titles "HTTP API" and "Model proxy" on the two fields.
3. Make the file read map `http` to `httpApi` and `proxy` to `modelProxy`.
4. Make the read return one warning for each old name: "`http` is now `httpApi`; rename it in <file>."
5. Show each warning with the other start warnings.
6. Stop the start when the file has an old name and its new name, and name both keys.
7. Make a client write of `httpApi` or `modelProxy` remove the old name from the file.
8. Rename the keys in each error message that names them.
9. Keep the `proxy` grant, the `proxy:call` operation and the `proxy` match type of a policy as they are.

## Validation

- A test starts from a file with `http` and `proxy`, and gets two warnings and the same settings.
- A test starts from a file with `http` and `httpApi`, and the start stops.
- A test writes `httpApi` through root config, and the file has no `http` after it.
- `server-root-config.test.ts` names `httpApi` and `modelProxy`.
- The gates pass.

## Resume

Done 2026-10-19. Every step is built, and every case the Validation names passes. Not reviewed.

`config.ts` declares `httpApi` and `modelProxy`. It exports `RENAMED_KEYS` and `oldNameOf`. `loadConfig` copies the old value under the new name. It removes the old one from the merged values. Each one it mapped returns a warning: `http is now httpApi; rename it in <file>.`

A file holding both names throws the sentence the plan's Answers table asks for, naming both keys and the old one to remove. `sourceOf` falls back to the old name, so an error about a mapped key still names the file that set it. `LoadedConfig` gained `warnings`, and `optionsFrom` appends them to `Options.warnings`, which `run.ts` and `start.ts` already print with the other start warnings.

`options.ts` renames both fields, `FILE_ONLY`, the proxy check and `httpOf`'s messages. The field titles are "HTTP API" and "Model proxy". `optionsFrom` returns `httpApi` and `modelProxy`, and `run.ts`, `commands/proxy.ts` and `proxy/providers.ts` read those names. `rootconfig.ts` lists `httpApi` and `modelProxy` in `DAEMON_KEYS`. It answers an old name under the new one. A write of either key removes the old name from the file, and leaves every other key as it was.

Departures:
- `modelProxy` is added to `DAEMON_KEYS`; `proxy` was not there before. The task says to rename the keys in `DAEMON_KEYS`. The plan's checklist asks the settings page to show `modelProxy`, so the key had to be added rather than renamed.
- The both-names refusal throws from `config.ts` rather than going through `stop` in `options.ts`, because the read is where both names are visible. The message is the one the tests pin.
- `ProxyOptions.proxy()` in `proxy/listener.ts` keeps its name. It is the handler's accessor rather than a configuration key, and `run.ts` passes `() => options.modelProxy` to it.

Tests: `config-check.test.ts` (66), `server-root-config.test.ts` (52), `server-http.test.ts` (65), `server-cli.test.ts` (33), `server-cli-restart.test.ts` (12), `plugin-route.test.ts` (21), `proxy-listener.test.ts` (26) and `proxy-list.test.ts` (5) pass. The whole server suite passes, 1235 tests in 61 files. Build, typecheck and the schema are clean.
