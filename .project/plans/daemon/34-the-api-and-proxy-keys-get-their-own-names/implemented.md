---
title: The API and proxy keys get their own names - implemented
date: 2026-10-19
refs:
  - git://0e76f540
  - git://ccce9b12
  - "[code://packages/server/src/config.ts#L658-L665](../../../../packages/server/src/config.ts#L658-L665) - `RENAMED_KEYS` and `oldNameOf`"
  - "[code://packages/server/src/rootconfig.ts#L32](../../../../packages/server/src/rootconfig.ts#L32) - `DAEMON_KEYS` with `httpApi` and `modelProxy`"
---

ahpd's `http` key is `httpApi`, and its `proxy` key is `modelProxy`.
The settings page shows no ahpd key that reads like a part of VS Code's `http.*` keys.
A configuration file with an old name still starts, and the daemon warns with the new name.

## What was built

- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - `Config` declares the new names. `loadConfig` reads an old name under the new one and returns one warning for each. A file with both names for one key stops the start, and the message names both.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - the fields, `FILE_ONLY`, the checks and the messages use the new names. The titles are "HTTP API" and "Model proxy".
- [`code://packages/server/src/rootconfig.ts`](../../../../packages/server/src/rootconfig.ts) - `DAEMON_KEYS` holds `httpApi` and `modelProxy`. A client write of either key removes the old name from the file.
- [`code://docs/server/UPGRADE.md`](../../../../docs/server/UPGRADE.md) - "Renamed keys" names the old key, the new key and the warning.
- `PROXY.md`, `REMOTE.md`, `CONFIGURE.md`, `HOST.md`, `POLICY.md` and `PLUGINS.md` under `docs/` use the new names.

## Verified

- `config-check.test.ts`, in `a key that was renamed`: `is read under its new name, with a warning naming the file to change`, `warns about nothing when the file already uses the new names` and `stops the start when the file holds both names for one key` pass.
- `config-check.test.ts`: `says in its log that an old name is now the new one` and `starts with a modelProxy that adds a provider and a model name` pass.
- `server-root-config.test.ts`: `answers an old name under the new one, and a write removes the old name` passes for both keys.
- On 2026-10-19, the server suite passed 1235 tests, and build, typecheck, the schema and `docs:build` passed.
- `rg -n '"http":|"proxy":' docs --glob '*.md'` finds nothing.
- Softov reviewed the two tasks and approved the close on 2026-10-19.

## Departures from the plan

- `modelProxy` is a new entry in `DAEMON_KEYS`, because `proxy` was not there before. The settings page must show it.
- The refusal of both names throws from `config.ts`, where both names are visible, and not from `stop` in `options.ts`.
- `ProxyOptions.proxy()` in `proxy/listener.ts` keeps its name, because it is an accessor and not a configuration key.
- `HOST.md`, `POLICY.md` and `PLUGINS.md` changed too, because the search of `docs/` found the keys there.

## Left for later

- none.
