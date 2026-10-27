---
title: A plugin installs from a path through a symbolic link - implemented
date: 2026-10-26
refs:
  - "[code://packages/server/src/install.ts#L630-L680](../../../../packages/server/src/install.ts#L630-L680) - `realOf`, and the comparison of real paths in `namesInstalled`"
  - "[code://packages/server/test/plugin-install.test.ts#L391-L426](../../../../packages/server/test/plugin-install.test.ts#L391-L426) - the two cases"
---

`ahpd plugin install <path>` names the plugin when a symbolic link is on the way to the plugin root or in the path.

## What was built

- [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts) - `realOf`, copied from `computer`. `namesInstalled` resolves a `file:` spec against the real path of the plugin root, and compares the real paths of both ends.
- [`code://packages/server/test/plugin-install.test.ts`](../../../../packages/server/test/plugin-install.test.ts) - a case with a link to the plugin root, and a case with a link in the path.

## Verified

- `plugin-install.test.ts`: 67 of 67 pass. Without the fix, the two new cases fail with "npm wrote no dependency", and the other 65 pass.
- The file also passes with `TMPDIR` behind a link, because `tools/test-tmpdir.ts` reads the run's folder by its real path.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/server` with `--maxWorkers=2 --testTimeout=10000`: 1506 tests pass, 2 skip, and 3 time out at 10 seconds on a busy machine. The 3 are in `plugin-load.test.ts` and `server-cli-verbs.test.ts`, and both files pass alone, 85 of 85.
- By hand on Linux, with npm 11.19.0 and the daemon from source, two installs exit 2 before the fix. One has `XDG_CONFIG_HOME` behind a link, and one installs a path through a link. The specs written were `file:../../../demo-plugin` and `file:../../deep2/x/demo2`.
- The same runs with the fix exit 0, and `plugins` names the plugin. A second install into the linked directory names it too, though npm adds no dependency then.

## Departures from the plan

- none.

## Left for later

- none.
