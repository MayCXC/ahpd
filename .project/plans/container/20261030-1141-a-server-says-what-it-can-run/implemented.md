---
title: A server says what it can run - implemented
date: 2026-10-30
refs:
  - git://227e3ae8 - the last commit of the change
  - "[code://packages/computer/src/servercheck.ts](../../../../packages/computer/src/servercheck.ts) - the script, the report, the fixes and the gate"
  - "[code://packages/computer/src/ssh.ts](../../../../packages/computer/src/ssh.ts) - `check` and `checks` on the ssh runtime"
---

Reading `computer://ssh.<name>/server` tells what a box in `ssh.machines` can run, and gives the lines that fix each missing piece.
A profile names its box with `server`, and `serverGate(check).requireOn(server, needs)` is ready for the Docker plan and the VM plan to call before a create.

## What was built

- [`code://packages/computer/src/servercheck.ts`](../../../../packages/computer/src/servercheck.ts) - `SERVER_CHECK`, `reportFrom`, `osOf`, `fixesOf`, `checkServer` and `serverGate`, which keeps each box's report for 60 seconds and keeps no failed check.
- [`code://packages/computer/src/ssh.ts`](../../../../packages/computer/src/ssh.ts) - `check(id)` sends the script on stdin, bounded by `connectTimeout` plus 20 seconds; `checks(id)` says whether the box has the leaf.
- [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) and [`code://packages/computer/src/router.ts`](../../../../packages/computer/src/router.ts) - the two optional members, routed by the machine id.
- [`code://packages/computer/src/provider.ts`](../../../../packages/computer/src/provider.ts) - the `server` leaf, listed and read.
- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts), [`code://packages/computer/src/manifest.ts`](../../../../packages/computer/src/manifest.ts) and [`code://packages/computer/package.json`](../../../../packages/computer/package.json) - `Profile.server`, read, documented and in the schema; a profile whose box is not in `ssh.machines` is left out with a line.
- [`code://packages/computer/test/computer-servercheck.test.ts`](../../../../packages/computer/test/computer-servercheck.test.ts) - 16 cases, the real script under `/bin/sh` among them.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - "What the box can run", and `server` under "Profiles".

## Verified

- `computer-servercheck.test.ts` and `computer-ssh.test.ts` pass, 40 cases; the type check passes.
- The full suite passed except `computer-git-fetch.test.ts`, which fails under load and passes alone, 26 of 26.
- dev02 was read through the plugin over real ssh before and after Softov ran the fixes; task 04 has both reports.

## Departures from the plan

- `fixesOf` takes the system as a parameter, `fixesOf(report, os, user)`, because the report keeps only what a person reads.
- The script adds `~/.local/node/bin` to the end of PATH, found on dev02: the install script puts ahpd there, and `ssh box cmd` does not have it on its PATH.

## Left for later

- The refusal before a create on a box without a need: the Docker plan and the VM plan call the gate.
