---
title: Docs
status: done
depends: [task-02-a-sleeping-session-wakes.md, task-03-a-backend-says-what-keeps-it-awake.md, task-04-an-agent-schedules-its-own-wake.md]
layer: "docs"
refs:
  - "[code://docs/sdk/SESSIONS.md](../../../../docs/sdk/SESSIONS.md) - where a session's life is described"
  - "[code://docs/sdk/HOST.md](../../../../docs/sdk/HOST.md) - the host options"
  - "[code://docs/sdk/TOOLS.md](../../../../docs/sdk/TOOLS.md) - the host tools an agent calls"
  - "[code://docs/sdk/AUTOMATIONS.md](../../../../docs/sdk/AUTOMATIONS.md) - pinned automations"
---

## Objective

The docs say when a session sleeps, what keeps it awake, what wakes it, and how an agent schedules its own wake.

## Files

- `UPDATE: docs/sdk/SESSIONS.md` - a section on sleep and wake: the timeout, what keeps a session awake, what wakes it.
- `UPDATE: docs/sdk/HOST.md` - the `sleepAfterMinutes` and `sessionResidencyLimit` options, their defaults and 0.
- `UPDATE: docs/sdk/TOOLS.md` - the `schedule_wakeup` tool and its arguments.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - a pinned automation wakes a sleeping session.
- `UPDATE: packages/sdk/README.md` - `busy()` on `Session`, for a backend author.

## Steps

1. Write the sleep and wake section in `docs/sdk/SESSIONS.md`.
2. Add `sleepAfterMinutes` and `sessionResidencyLimit` to `docs/sdk/HOST.md`.
3. Add `schedule_wakeup` to `docs/sdk/TOOLS.md`.
4. Add one sentence on a sleeping pinned session to `docs/sdk/AUTOMATIONS.md`.
5. Document `busy()` for backend authors in `packages/sdk/README.md`.

## Validation

- Read each section against the built code.
- Check that `sleepAfterMinutes` and `schedule_wakeup` read the same in the docs and in the server options.

## Resume
