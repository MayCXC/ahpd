---
title: The install script uninstalls
status: todo
depends: []
layer: scripts
refs:
  - "[idea: the install script uninstalls](https://github.com/softov/ahpd/blob/5e5f35ce034f24747bd952d4dfdadf2763740cbb/.project/ideas/the-install-script-uninstalls.md) - `--uninstall` and `--purge`"
  - "[code://packages/server/src/config.ts#L376-L377](../../../../packages/server/src/config.ts#L376-L377) - `configDir`, which `--purge` removes"
  - "[code://packages/server/src/install.ts#L463](../../../../packages/server/src/install.ts#L463) - `pluginRoot`: plugins live under `configDir`, so they stay without `--purge`"
  - "[code://docs/server/INSTALL.md](../../../../docs/server/INSTALL.md) - the page that names the uninstall steps"
---

## Objective

`install.sh --uninstall` and `install.ps1 -Uninstall` remove `@ahpd/server` and the PATH line that the script wrote.
The configuration folder and its plugins stay, unless `--purge` (`-Purge`) is also given.

## Files

- `UPDATE: scripts/install/install.sh` - the `--uninstall` and `--purge` flags, with `AHPD_UNINSTALL` and `AHPD_PURGE`.
- `UPDATE: scripts/install/install.ps1` - the `-Uninstall` and `-Purge` flags, with the same environment twins.
- `UPDATE: docs/server/INSTALL.md` - the uninstall section names the one line first, then the steps by hand.

## Steps

1. Write the tests first, with `AHPD_INSTALL_NO_RUN=1` and a fake home folder.
2. Add `--uninstall` and `--purge` to the flag parser, and refuse `--purge` without `--uninstall` with exit 2.
3. Run `ahpd service uninstall` when `ahpd service` reports a daemon/31 service, so the manager does not start the daemon again.
4. Run `ahpd stop` when a daemon still runs, and stop with its failure when it fails.
5. Run `npm uninstall -g @ahpd/server`, or `bun remove -g @ahpd/server` under `--runtime bun`.
6. Remove only the PATH line that the script wrote, found by its comment marker.
7. Leave the npm prefix `~/.npm-global` and its line in `~/.npmrc`.
8. With `--purge`, remove `$XDG_CONFIG_HOME/ahpd`, or `~/.config/ahpd` when the variable is not set.
9. Print the path of each removed item, and the path of each item that stays.
10. Do the same steps in `install.ps1`, with `throw` instead of `exit`.
11. Add the one line to the uninstall section of INSTALL.md.
12. Set this task and the plan's Tasks list to `implemented`.

## Validation

- A test: after an install and `--uninstall`, `ahpd` is not on PATH and the rc file has no ahpd line.
- A test: a line that the person wrote in the rc file stays.
- A test: without `--purge`, the configuration folder stays; with `--purge`, it is gone.
- A test: `--purge` alone exits 2.
- A test: the script runs `ahpd service uninstall`, then `ahpd stop`, before it removes the package.
- A test: `~/.npmrc` keeps its `prefix` line.
- A test: `--dry-run --uninstall` prints the steps and removes nothing.
- CI runs the uninstall after the install in the clean container and on the Windows runner.

## Resume
