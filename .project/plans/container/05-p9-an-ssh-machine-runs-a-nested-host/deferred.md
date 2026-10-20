---
title: An ssh machine runs a nested host - deferred
date: 2026-10-19
---

The first three rows read a Docker label from `made.inspect`. An ssh machine has no such label, so each answers none there, which is correct.
The last row is a test that tasks 03 and 04 left to whoever takes it up.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| `profileOf` in `nestedDelete` and `partsMissing`, in [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) | The profile is a Docker label. Softov, 2026-10-12, chose "Enough for now" over typed methods for these four. | The first of container 05 p8, p10 and p11 that adds a runtime which records a profile |
| `madeUnderBind` in `reach` | The same: the bind label exists only on a Docker machine. | The same |
| `disposableOf` and `hostOf` in `keptFor` | The same: the disposable and host labels exist only on a Docker machine. | The same |
| The end-to-end case in `packages/computer/test/computer-ssh.test.ts`: one nested session through the ssh fixture, with `container-host.mjs` as the remote `ahpd`, and a turn that crosses it | Task 04 left it for after task 03, and task 03 did not name it. Task 06 ran the same path by hand on `ssh.deb`. | unplanned |
