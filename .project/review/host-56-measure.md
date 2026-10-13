---
title: Measure the summary events on dev-01 with a build running
plans:
  - plans/host/56-the-catalogue-answers-at-once-and-a-summary-is-sent-when-it-changes/task-05-measured-before-and-after.md
---

# Measure the summary events on dev-01 with a build running

Everything else in task 05 is measured. On 2026-10-13 I ran both probes against dev-01:

- `listSessions` answered in 21 ms for 137 sessions. Before the change it took 48.6 s.
- `probe-flood.mjs` saw 0 events in 70 s. That is not a result: the probe counts events while a build runs, and probably nothing ran on dev-01 then.

I cannot start a build on dev-01, and an extra read to see what runs there was refused to me. So this one is yours.

## Steps

1. On dev-01, start one build session, or wait for one that runs.
2. While it runs, in `/github/ahpapp/.scratch/org/`, run `node probe-flood.mjs`. It takes 70 s.

## What a pass looks like

Before the change, one build sent about 28 events a second. About 210 of 225 were the same as the one before. A pass is a few events a second at most, and few or none the same as the one before.

## Reply

Paste the output of step 2. Then I fill the dev-01 row in task 05 and close host/56.
