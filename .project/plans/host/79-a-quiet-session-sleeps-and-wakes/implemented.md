---
title: A quiet session sleeps, and wakes when something needs it - implemented
date: 2026-10-13
refs:
  - git://95e6a02
  - "[code://packages/sdk/src/host/sleep.ts](../../../../packages/sdk/src/host/sleep.ts)"
  - "[code://packages/sdk/test/session-sleep.test.ts](../../../../packages/sdk/test/session-sleep.test.ts)"
---

A session with no activity for `sleepAfterMinutes` lets its agent go and stays in the catalogue. At most `sessionResidencyLimit` sessions stay loaded. A prompt, an automation, a child's event or a wake that the agent schedules brings the session back with its conversation.

## What was built

- [`code://packages/sdk/src/host/sleep.ts`](../../../../packages/sdk/src/host/sleep.ts) - what keeps a session awake, the sweep, `sleep` and `wake`.
- [`code://packages/sdk/src/tools/session.ts`](../../../../packages/sdk/src/tools/session.ts) - the `schedule_wakeup` host tool.
- `Session.busy?()` in the sdk types, read by agent-claude from background tasks and CLI timers and by agent-acp from its terminals.
- The `sleepAfterMinutes` and `sessionResidencyLimit` options in the server.

## Verified

- The gates and vitest passed at the merge, `95e6a02`.
- On a second daemon from main `5705c50b`, 2026-10-13, with claude and haiku, all five checks of the review pass:
- With `sleepAfterMinutes: 1`, the claude process exits about a minute after the client leaves, and a second prompt resumes and answers with the earlier conversation.
- A session with a pending approval keeps its process past three sweeps, while a quiet session sleeps in the same window.
- With `sessionResidencyLimit: 2`, a third session's turn makes the least recently used quiet session sleep, and two processes stay loaded.
- Archiving a session closes its agent within a second.
- A wake from the host's `mcp__ahp__schedule_wakeup` survives a daemon restart, and its turn begins when it is due.
- In the code, a sleep closes each chat with `'stopping'`, so a nested session keeps its inner transcript; only a removal passes `'dispose'`.

## Departures from the plan

- none.

## Left for later

- A running background task, a CLI timer and a subscribed client are not checked by hand. The tests cover them.
- A pinned automation and a child's `childFinished` that wake a sleeping session are not checked by hand.
- claude's own `ScheduleWakeup` competes with the host tool, see [the problem](../../../problems/claude-picks-its-own-wake-tool-over-the-hosts.md).
- `send_message` still begins its turn directly, not through `beginOrRun`.
