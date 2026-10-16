---
title: An ssh machine runs a nested host - deferred
date: 2026-10-12
---

Each of these reads a Docker label from `made.inspect`, and an ssh machine has no such label, so each answers none there, which is correct.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| `profileOf` in `nestedDelete` and `partsMissing`, in [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) | The profile is a Docker label. Softov, 2026-10-12, chose "Enough for now" over typed methods for these four. | The first of container 05 p8, p10 and p11 that adds a runtime which records a profile |
| `madeUnderBind` in `reach` | The same: the bind label exists only on a Docker machine. | The same |
| `disposableOf` and `hostOf` in `keptFor` | The same: the disposable and host labels exist only on a Docker machine. | The same |
