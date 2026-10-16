---
title: The docs name the limits
status: todo
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
