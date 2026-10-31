---
title: An installed ahpd is found outside bash - implemented
date: 2026-10-31
refs:
  - "[code://scripts/install/install.sh](../../../../scripts/install/install.sh)"
  - "[code://packages/server/src/install.ts](../../../../packages/server/src/install.ts)"
---

The install script writes its PATH line into the shell's login file as well as its rc file.
So a desktop session finds an `ahpd` in `~/.npm-global` from the next login.
The uninstall removes the package from the prefix that holds it, and the PATH lines from every file the script can write.
The daemon runs the npm beside its own Node on every platform.

## What was built

- [`code://scripts/install/install.sh`](../../../../scripts/install/install.sh) - `login_path` names the login file of the shell. `path_files` lists every file the script can write. `add_path_line` writes the marker and the line into a file that has no marker. `write_path` writes the rc file and the login file. `remove_path` removes the line from each file in `path_files`. `do_uninstall` passes `--prefix` when `ahpd_prefix` finds the prefix of the found `ahpd`.
- [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts) - `launch` takes `npm-cli.js` from `npm_execpath` or from beside `execPath` on every platform. Away from Windows, with no such file, it runs `npm` by its name with no shell.
- [`code://docs/server/INSTALL.md`](../../../../docs/server/INSTALL.md) - the files that get the PATH line, and what the uninstall removes.
- [`code://.project/specs/daemon.md`](../../../specs/daemon.md) - "npm runs as the daemon's node" replaces "Windows runs npm as node".

## Verified

- `install-sh.test.ts` has eight new cases. Five are for the install: the login file under bash, `~/.bash_profile`, zsh, an update of an older install, and a PATH with no marked file.
  Three are for the uninstall: a line from another shell, the prefix, and the prefix under `--dry-run`.
- `plugin-install.test.ts` has the `launch` cases for Linux, macOS, a Linux Node with no `npm-cli.js` beside it, and Bun.
- `pnpm typecheck` is clean, and the whole suite passes.
- The checks by hand wait in [install-path-checks.md](../../../pending/install-path-checks.md).

## Departures from the plan

- Away from Windows, `launch` takes `npm-cli.js` only when the program is named `node` or `nodejs`. Bun installed beside a Node would otherwise find that Node's npm and run it under Bun.
- The daemon no longer takes the stand-in `npm` from the `PATH` in the server tests. `fixtures/npm-fake/npm-cli.js` runs that stand-in, and the tests name it in `npm_execpath`.
- The test of task 03 step 9 became two cases: a program other than npm, and npm on Linux beside an nvm Node.
