---
title: The docs say who sees the account
status: todo
depends: [task-02-the-host-publishes-each-agent-account.md, task-03-the-acp-backend-hears-the-codex-account.md]
layer: docs
refs:
  - "[code://docs/sdk/AGENT.md#L82-L100](../../../../docs/sdk/AGENT.md#L82-L100) - `probe()` and the other members of `Agent`"
  - "[code://docs/sdk/HOST.md#L44](../../../../docs/sdk/HOST.md#L44) - the `AgentInfo` table"
  - "[code://docs/sdk/AUTHENTICATION.md#L230-L235](../../../../docs/sdk/AUTHENTICATION.md#L230-L235) - what is readable before a sign-in"
---

## Objective

The docs say what the account holds, where a client reads it, and which grant it needs.

## Files

- `UPDATE: docs/sdk/AGENT.md:82-100` - a probe may return `account`.
- `UPDATE: docs/sdk/HOST.md:44` - where the account is published.
- `UPDATE: docs/sdk/AUTHENTICATION.md:230-235` - the account is not readable without the grant.
- `UPDATE: docs/server/REMOTE.md:80-92` - the `account:read` row.

## Steps

1. Add `account` to the table of `Agent` members in `AGENT.md`.
2. Name the place of the account in `HOST.md`.
3. Say in `AUTHENTICATION.md` who may read the account.
4. Add the `account:read` row to `REMOTE.md`.
5. Say that the host learns the Codex account when a Codex session starts.
6. Set this task and the plan row to `implemented`.

## Validation

- The docs match the behaviour of tasks 02 and 03.
- `pnpm -s docs:build` passes.

## Resume
