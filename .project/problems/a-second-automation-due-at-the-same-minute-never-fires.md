---
title: A second automation due at the same minute never fires
status: open
date: 2026-10-13
severity: major
refs:
  - "[code://packages/server/src/scheduled.ts#L516-L531](../../packages/server/src/scheduled.ts#L516-L531) - `fire`, which reads `nextAt` for each automation while the first run rearms it"
  - "[code://packages/server/src/scheduled.ts#L667-L673](../../packages/server/src/scheduled.ts#L667-L673) - `onChanged`, which calls `rearm` from inside the first run's announce"
---

## Symptom

Two automations with the same schedule are both on. Only the first fires; the second never runs.
A copy of an automation file shows this at once, because the copy has the same schedule as the original.
Found while checking host/80 on a second daemon, 2026-10-13.

## Cause

In `fire`, the first `due` listener starts a run and writes it synchronously.
That write calls `onChanged`, which calls `rearm`, and `rearm` computes every `nextAt` again from now.
The loop then reads the second automation's `nextAt`, which is now the next minute, and skips it.
The cause is older than host/80.

## Impact

A person with two automations on one schedule gets one run.
Nothing in the log says that the second was skipped.

## Workaround

Give each automation a different minute.

## Fix

- Collect the due automations before the first listener runs, then announce each.
- Or hold `rearm` until `fire` returns.
