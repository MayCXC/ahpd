---
title: The docs say when a set is echoed
status: todo
depends: [task-01-the-sender-hears-its-unchanged-set.md, task-03-an-idle-cancel-is-echoed-to-its-sender.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L651-L659](../../../../docs/sdk/AHP.md#L651-L659) - the section on an action that changes nothing"
---

## Objective

`AHP.md` says that the sender of an unchanged set, or of a cancel with nothing to stop, gets an echo.
It says that no other client does.

## Files

- `UPDATE: docs/sdk/AHP.md:651-659` - one paragraph on the echo to the sender.

## Steps

1. Add a paragraph to the section on an action that changes nothing.
2. Say that only the sender gets the echo, and why.
3. Name a cancel with nothing to stop as the second case.
4. Say that the echo does not move `serverSeq`.
5. Set this task and the plan row to `implemented`.

## Validation

- The paragraph matches the behaviour of task 01.
- `pnpm -s docs:build` passes.

## Resume
