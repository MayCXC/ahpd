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
- `UPDATE: packages/computer/test/computer-git-fetch.test.ts`, `computer-git-guard.test.ts` - the real-Docker cases: the user only where the host has a uid, and every path in a command in the machine through `machinePathOf`.

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

Done 2026-10-19, apart from step 4; step 4 done 2026-10-20 on a Windows VM with Docker Desktop 29.9.1. Not reviewed.

The real-Docker cases, which skip where no Docker answers and so never ran on Windows, failed there: 17 of 37 in `computer-git-fetch.test.ts` and `computer-git-guard.test.ts`.
Two were the tests: the user `ME` was `undefined:undefined` with no uid on Windows, which Docker refused, and the paths in the machine's commands were host paths. Both now pass the user only where there is one and give the machine paths through `machinePathOf`.
The rest were two product bugs, now tasks 07 and 08; after them the 38 cases of the three `computer-git-` files pass on the VM.
Step 4, by hand in a disposable machine on `C:\work\demo` with the scripted ACP agent: the machine works at `/c/work/demo`, a file the agent wrote through `fs/write_text_file` and one a command in the machine wrote are on Windows, `git status` in the machine names only them, and the session's changes list both.
The agent's turns that open a terminal fail: an ACP agent's terminal runs on the host, which is [acp/19](../../acp/19-a-terminal-in-a-machine-runs-in-the-machine/plan.md).
Docker Desktop's `Source` for the folder's bind was `C:\work\demo` in one run and `/run/desktop/mnt/host/c/work/demo` in others, from the same config; `sourceOnHost` reads both.

The suite went from 87 failures to none on Windows.
Skipped there with their reasons: the cases whose stand-in container or box runs a line with `/bin/sh` on this host, the stand-in `pnpm` script, file links, and file modes; a link to a folder is a junction instead.
The stand-in docker and dev container CLI retry a rename Windows refuses while a test reads the state file, which lost a call's record now and then.
Step 4, the hand check with Docker Desktop, is in `.project/pending/windows-machine-paths-checks.md`.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
