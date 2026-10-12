---
title: Review sleeping sessions
plans:
  - plans/host/79-a-quiet-session-sleeps-and-wakes/plan.md
---

# Review sleeping sessions

Tasks 01 to 05 are merged in `95e6a02`, and released in 0.11.0. A session with no activity for `sleepAfterMinutes` (30 by default) lets its agent go and stays in the catalogue. At most `sessionResidencyLimit` sessions (10 by default) stay loaded. Two code reviews are fixed.

`send_message` still begins its turn directly, not through `beginOrRun`. This was so before the plan, and nothing records it yet.

## Read

- `packages/sdk/src/host/sleep.ts`: what keeps a session awake, and the sweep.
- The plan's Watch out for: `teardown` and `Host.close` close a nested session's inner transcript, and sleep must not.

## Check by hand

Use a second daemon on another port, so your own daemon keeps its sessions.

1. Set `sleepAfterMinutes: 1`. Start a claude session and send one prompt. Within two minutes its process exits, and a second prompt answers with the earlier conversation.
2. Leave a session with a pending approval past the timeout. It is still live.
3. Set `sessionResidencyLimit: 2` and start a turn in three sessions. The least recently used quiet one sleeps.
4. Archive a session. Its agent closes at once.
5. Ask an agent to `schedule_wakeup` in two minutes, then restart the daemon. The turn begins when it is due.

If you prefer, I can run steps 1, 3, 4 and 5 myself on a second daemon.

## Reply

Write "pass" for each step, or "run them yourself". Then "approved", or the findings. Approval sets tasks 01 to 05 to `done`, and the plan to `built`. A plan for `send_message` is your call.
