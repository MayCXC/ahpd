---
title: The computer suite runs on a Windows machine
status: implemented
depends: [task-02-a-machine-mounts-a-folder-at-its-machine-path.md, task-03-what-a-machine-answers-names-the-hosts-paths.md, task-04-a-nested-host-and-its-attachments-cross-by-the-pair.md, task-05-an-agent-in-a-machine-works-at-the-machine-path.md]
layer: tests
refs:
  - "[code://packages/computer/test](../../../../packages/computer/test) - the suite, which fails 123 cases on Windows on `a0382dc9`"
---

## Objective

The computer suite passes on a Windows machine, apart from what is POSIX by nature, and a machine made from a Windows host with a folder works by hand.

## Files

- `UPDATE: packages/computer/test/*.test.ts` - the same-path expectations become machine-path expectations; a case that is POSIX by nature skips on Windows with `it.skipIf(!posix)` and its reason.

## Steps

1. Run the computer suite on a Windows machine and group what is left.
2. Make each same-path expectation a `machinePathOf` one.
3. Skip what is POSIX by nature (`/bin/sh`, a symlink needing a privilege, a file mode) with its reason.
4. Make a machine from a Windows host with a folder, with Docker Desktop, and run a turn in it, by hand.
5. Set this task and the plan row to `implemented`, and close the plan.

## Validation

- The computer suite passes on Windows, apart from its skips.
- The hand check: a turn runs in the folder, and its edits show on the host.
- The Linux jobs pass.

## Resume

Done 2026-10-19, apart from step 4. Not reviewed.

The suite went from 87 failures to none on Windows.
Skipped there with their reasons: the cases whose stand-in container or box runs a line with `/bin/sh` on this host, the stand-in `pnpm` script, file links, and file modes; a link to a folder is a junction instead.
The stand-in docker and dev container CLI retry a rename Windows refuses while a test reads the state file, which lost a call's record now and then.
Step 4, the hand check with Docker Desktop, is in `.project/pending/windows-machine-paths-checks.md`.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
