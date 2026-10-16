---
title: The docs name the limits
status: done
depends: [task-02-the-limits-are-host-config-keys.md, task-03-a-client-past-the-limit-is-closed.md, task-04-the-replay-buffer-has-a-byte-budget.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L83](../../../../docs/sdk/AHP.md#L83) - the `reconnect` row"
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the keys this host acts on"
---

## Objective

`AHP.md` says what the host does with a slow client, and that the replay buffer has a count and a byte budget.
It names the two keys and their defaults.

## Files

- `UPDATE: docs/sdk/AHP.md:83` - the `reconnect` row names both limits of the buffer.
- `UPDATE: docs/sdk/AHP.md` - a short note on a slow client, near the transport section.
- `UPDATE: docs/sdk/AHP.md:195` - add `clientQueueBytes` and `replayBytes` to the keys this host acts on.

## Steps

1. Name the count and the byte budget in the `reconnect` row.
2. Say what the host does with a client past its queue limit, and how the client recovers.
3. Name `clientQueueBytes` and `replayBytes`, their defaults of 16 MiB and 32 MiB, and the `config:write` grant.
4. Set this task and the plan row to `implemented`.

## Validation

- The docs match the behaviour of tasks 02, 03 and 04.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** built 2026-10-16. `AHP.md:83` - the `reconnect` row now says the buffer holds the last 1000 envelopes or `replayBytes` of them, whichever comes first, and links to the note. `AHP.md` - a new `### A client that stops reading` section: what an unbounded socket queue is, `clientQueueBytes` and its 16 MiB default with the four readers of a wire's queue, the close and the log line, the dropped frame and the answers in flight, the reconnect that recovers, the in-process pair that is never closed, the buffer's two limits and how an envelope is weighed, and the 1 MiB floor with the `config:write` grant. `AHP.md:195` - the keys this host acts on are now three of its own, `changeWords` beside `clientQueueBytes` and `replayBytes` with their defaults and the grant. `pnpm -s docs:build` passes.
- **Next action:** none - this is the last task.
- **Open questions:** none.
- **Watch out for:** this task names "the transport section" and `AHP.md` has none, so the note went into `## Behaviour worth knowing`, after `### Restarts`, which is where this file describes what the connection does rather than what an action is. `docs/sdk/HOST.md` has a `## Root config` section whose table says the host's own schema "is two keys" (`defaultShell` and `workspaceTrust`) and names neither `changeWords` nor these two, so it was already short of `changeWords` before this plan; it is not in this task's `Files` and was left alone.
