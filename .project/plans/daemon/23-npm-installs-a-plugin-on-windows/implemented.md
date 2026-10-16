---
title: npm installs a plugin on Windows - implemented
date: 2026-10-16
refs:
  - git://f6829b2d
  - "[code://packages/server/src/install.ts](../../../../packages/server/src/install.ts)"
  - "[code://packages/server/test/plugin-install.test.ts](../../../../packages/server/test/plugin-install.test.ts)"
---

`ahpd configure` and `ahpd plugin` install and remove plugins on Windows, as they do on Linux and macOS.
On Windows, npm starts as the daemon's own Node with `npm-cli.js`, so the spawn no longer fails with `spawn npm ENOENT`.

## What was built

- [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts) - `Launch` and the exported `launch`, which says how to start one program on one platform. `run` spawns what `launch` answers, in `f6829b2d`.
- [`code://packages/server/test/plugin-install.test.ts`](../../../../packages/server/test/plugin-install.test.ts) - four `launch` cases: Linux and a Windows `git` unchanged, `npm_execpath` at `npm-cli.js`, `npm_execpath` at `pnpm.cjs`, and the shell with quoted arguments.

## Verified

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on sdk, server, agent-claude and agent-acp passes: 241 files and 4345 tests. `plugin-install.test.ts` has 56 tests, and four of them are new.
- On Windows, 2026-10-13, `ahpd configure` installed the three plugins.
- On Windows, 2026-10-16, from a build of ahpd main at `299481a8`, `ahpd plugin remove @ahpd/agent-claude` removed the plugin from the config and uninstalled it with npm.

## Departures from the plan

- `launch` reads paths with the `win32` flavour of `node:path` on every platform, so a Linux test can give it a `C:\` path.
- The early return covers every program except `npm`, because `git`, `gh` and `ssh` are `.exe` files on Windows.
- `exists` is a parameter, so a test can answer each of the two lookups differently.

## Left for later

- none.
