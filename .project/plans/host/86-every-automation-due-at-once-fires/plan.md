---
title: Every automation due at once fires
domain: host
status: built
priority: high
created: 2026-10-13
revalidated: 2026-10-13
refs:
  - "[code://packages/server/src/scheduled.ts#L474-L514](../../../../packages/server/src/scheduled.ts#L474-L514) - `rearm`, which computes every `nextAt` again from now"
  - "[code://packages/server/src/scheduled.ts#L516-L531](../../../../packages/server/src/scheduled.ts#L516-L531) - `fire`, which reads `nextAt` per automation while the first run rearms it"
  - "[code://packages/server/src/scheduled.ts#L667-L673](../../../../packages/server/src/scheduled.ts#L667-L673) - `onChanged`, which calls `rearm` from inside a run's write"
  - "[code://packages/server/test/scheduled.test.ts](../../../../packages/server/test/scheduled.test.ts) - the scheduler cases"
---

## Goal

Two automations due at the same minute both fire.
Today only the first fires, and the second waits for the next time it is due.
Found while checking host/80 on a second daemon, 2026-10-13: a copy of an automation file never fired while the original was on.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "rearm\(" packages/server/src/scheduled.ts` - `fire`, `onChanged` and the start call it.

### Runtime path

```
timer -> fire -> due listener (run 1) -> store write -> onChanged -> rearm (all nextAt from now) -> fire reads nextAt of automation 2 -> not due -> skipped
```

### Gaps

- `fire` reads `nextAt` inside its loop, after a listener can change it.
- No test has two automations due at the same time.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| Every automation due when `fire` runs fires once | Softov, 2026-10-13, chose "Scheduler: same-minute automation" for the next fix plans | 01 |

## Proposed architecture

- **Data flow** - `fire` takes the list of due automations and their times first, then announces each.
- **Event flow** - unchanged: one `due` event per due automation, then one `rearm`.
- **Layer responsibilities** - server: `scheduled.ts` only.
- **Source-of-truth files** - [`code://packages/server/src/scheduled.ts`](../../../../packages/server/src/scheduled.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - fire takes every due automation before it announces one](task-01-fire-takes-every-due-automation-first.md) | done | - |

## Risks and tradeoffs

- A listener that switches the second automation off before it is announced: the second still fires once, as it was due when `fire` began.

## Resume state

- **Done so far:** built 2026-10-16. Task 01 is done: `fire` takes the whole due list before it announces any of it. See [implemented.md](implemented.md).
- **Next action:** the check by hand in [linux-checks.md](../../../pending/linux-checks.md), which ticks the first checklist line.
- **Open questions:** none.
- **Watch out for:** `onChanged` must still rearm before it tells its listeners, for the reason its comment gives.

## Final verification checklist

- [ ] Two automations with one schedule both run at that minute.
- [x] `plans/index.md` updated.
