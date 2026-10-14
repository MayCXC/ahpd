---
title: On Windows, the daemon runs npm as `node` with `npm-cli.js`, not `npm.cmd` through a shell
status: accepted
date: 2026-10-13
refs:
  - "[code://packages/server/src/install.ts#L55-L72](../../packages/server/src/install.ts#L55-L72) - `run`, which spawns the program by its name with no shell"
  - https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2 - CVE-2024-27980, why Node refuses to spawn a `.cmd` file without a shell
---

## Context

Every npm call of `ahpd configure` and `ahpd plugin` goes through `run` in `install.ts`.
`run` spawns `npm` by its name with no shell.
On Windows, npm is `npm.cmd`, so the spawn fails with `spawn npm ENOENT`.
Node also refuses to spawn a `.cmd` file without a shell, so the name `npm.cmd` alone does not help.

## Decision

On Windows, `run` starts npm as `process.execPath` with the path of `npm-cli.js` as its first argument, with no shell.
It takes `npm-cli.js` from `npm_execpath` when that names `npm-cli.js`, else from `node_modules/npm/bin/npm-cli.js` next to `node.exe`.
When neither file exists, it runs `npm` through the shell, with each argument in double quotes.
On Linux and macOS, `run` does not change.

Source: Softov, 2026-10-13, asked "How should the fix start npm on Windows?": "Run npm's JS with node (Recommended)".

## Consequences

The arguments go to npm as they are, so a path with spaces needs no quotes in the usual case.
The shell is used only on a Node whose npm is not in the usual place, such as some version managers.

## Options

- **`npm.cmd` through the shell, always**: every argument must be quoted for `cmd.exe`, and a quoting mistake changes what npm installs.
