---
title: ahpd paths sets the served folders - implemented
date: 2026-10-15
refs:
  - git://c6da9540
  - "[code://packages/server/src/commands/paths.ts](../../../../packages/server/src/commands/paths.ts)"
  - "[code://packages/server/src/daemon.ts](../../../../packages/server/src/daemon.ts)"
---

`ahpd paths list`, `add` and `remove` set the folders a host serves, with no question. At the terminal they reach a running daemon that serves the HTTP API, and write `config.json` otherwise. A daemon started with no `paths` records its start folder, and the first `add` keeps it.

## What was built

- [`code://packages/server/src/commands/paths.ts`](../../../../packages/server/src/commands/paths.ts) - the three verbs, served and at the terminal, and `addedLine` for both add sentences.
- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts) - `startFolder` on the record, and the served change written to `daemon.json`.
- [`code://packages/server/src/commands/status.ts`](../../../../packages/server/src/commands/status.ts) - `startFolder` in `status`, `status --json` and `GET /status`.
- [`code://docs/server/REFERENCE.md`](../../../../docs/server/REFERENCE.md) - the verbs, the start folder and the forwarded add.

## Verified

- `server-paths.test.ts`, `daemon.test.ts` and `server-cli-start.test.ts` pass on main.
- On Windows 10, 2026-10-14, at `02e7c214`: `add` and `remove` on a daemon with no `paths` exit 0, and `paths list`, `status --json` and `config.json` agree. After `ahpd restart`, the daemon serves the folders the file names.
- On Linux, 2026-10-15, at `3cf1dc13`, with a config folder of its own: on a fresh folder, `add` writes only that folder, and `ahpd start` serves it. Removing the last folder is refused, and removing a folder not listed exits 2.

## Departures from the plan

- Tasks 03 to 05 were not in the first plan. The Windows run of 2026-10-14 found what they fix.

## Left for later

- none.
