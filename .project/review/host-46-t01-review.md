---
title: Review operations and their groups
plans:
  - plans/host/46-built-in-surfaces-are-advertised-for-role-control/task-01-operations-and-groups-are-one-table.md
---

# Review operations and their groups

Task 01 is merged, and tasks 02 to 04 were reviewed on 2026-10-10. Task 01 is the one rule every role is read with. A grant names an operation (`session:dispose`) or a group (`session:write`), and a group holds each of its operations.

## Read

- `OPERATIONS` and `holds` in `packages/sdk/src/users.ts`.
- `packages/sdk/test/users.test.ts`, which holds the cases below.

## Check

1. `session:write` holds `session:dispose`, and `chat:send` through the session.
2. `chat:send` does not hold `chat:cancel`.
3. `file:read` does not hold `computer:list`. `computer:read` holds it.
4. A role written before this change with `file:read` or `user:write` still means the group, so no `users` file is migrated.

`ahpd.resourceProviders` now says `get` and `put` where it said `read` and `write`. ahpapp has to read the new names before it relies on them.

## Reply

Write "approved", or the findings. Approval sets task 01 to `done`, and every task of host/46 is then `done`.
