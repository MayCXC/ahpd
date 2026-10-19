---
title: The install script prints the runtime lines
status: todo
depends: []
layer: scripts
refs:
  - "[plan: daemon/27 task 01](../27-ahpd-installs-with-one-line/task-01-install-sh-installs-ahpd.md) - writes `scripts/install/install.sh`; this task starts after it is implemented"
  - "[plan: daemon/27 task 02](../27-ahpd-installs-with-one-line/task-02-install-ps1-installs-ahpd.md) - writes `scripts/install/install.ps1`; this task starts after it is implemented"
  - "[code://packages/server/package.json#L38-L40](../../../../packages/server/package.json#L38-L40) - `engines.node` is `>=22.1`, the floor that the Node line names"
  - "[code://docs/server/INSTALL.md#L23-L41](../../../../docs/server/INSTALL.md#L23-L41) - ahpd runs on Node, Bun and Deno"
  - "[research: how one-line installers work](../../../research/one-line-installers.md) - what installers check before they install"
---

## Objective

`install.sh` and `install.ps1` print one line each for Node, Bun and Deno before they install, with the version and whether ahpd runs on it.
A person whose install stops can see which runtime was missing or too old.

This task depends on daemon/27 tasks 01 and 02, which create the two scripts. `depends` names only tasks of this plan, so the dependency is in `refs`.

## Files

- `UPDATE: scripts/install/install.sh` - a `runtimes` function that prints the three lines, called before the runtime check.
- `UPDATE: scripts/install/install.ps1` - the same function in PowerShell.
- `UPDATE: docs/server/INSTALL.md` - one sentence that the script prints the runtimes it found.

## Steps

1. Start when daemon/27 tasks 01 and 02 have status `implemented`, and read the two scripts as they are then.
2. Write the tests first, in the test file of daemon/27 task 01, with stub `node`, `bun` and `deno` commands.
3. For each of `node`, `bun` and `deno`, print the name, the version from `--version`, or `not found`.
4. Use the same words as `ahpd configure` for whether ahpd runs on it, so the two outputs match.
5. Mark Node below 22.1 as too old, with the floor in the line.
6. Print the lines under `--dry-run` too, and before any question.
7. Do the same in `install.ps1`.
8. Add the sentence to INSTALL.md.
9. Set this task and the plan's Tasks list to `implemented`.

## Validation

- A test: with Node 22.1 and Bun on PATH, the script prints the three lines in that order.
- A test: with no Deno on PATH, the Deno line says `not found`.
- A test: with Node 20, the Node line says too old and names 22.1.
- A test: `--dry-run` prints the three lines.
- The same cases run against `install.ps1` on the Windows runner.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1, after daemon/27 tasks 01 and 02 are implemented.
- **Open questions:** none.
- **Watch out for:** a piped script reads stdin from the pipe, so the lines go to the terminal and the script asks nothing new.
