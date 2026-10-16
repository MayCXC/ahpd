---
title: RUN.md shows a failure under --json
status: todo
depends:
  - task-02-the-failures-in-main-take-the-shape.md
  - task-03-status-and-stop-under-json-fail-once.md
layer: docs
refs:
  - "[code://docs/server/RUN.md#L72-L87](../../../../docs/server/RUN.md#L72-L87) - `Output for scripts`"
---

## Objective

`Output for scripts` in docs/server/RUN.md shows a failure under `--json`, its fields, and the exit code of each kind.

## Files

- `UPDATE: docs/server/RUN.md:72-87` - an example of a failure, and a table of the kinds and their exit codes.

## Steps

1. Add an example: `ahpd --json plugin` and the JSON line that it writes.
2. Add a table of the kinds, with exit 2, 3, 4 and 1.
3. Say which stream holds the failure.
4. Set this task and the plan row to `implemented`.

## Validation

- The example is the output of the test in task 02.

## Resume
