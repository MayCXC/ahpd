---
title: session:write holds chat:write
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/users.ts#L274-L287](../../../../packages/sdk/src/users.ts#L274-L287) - `holds`, where a chat operation is held through the session group but the chat group is not"
  - "[code://packages/sdk/test/users.test.ts#L665-L688](../../../../packages/sdk/test/users.test.ts#L665-L688) - the cases for groups and operations"
---

## Objective

A role that holds `session:read` or `session:write` holds `chat:read` or `chat:write` as a whole group, as the plan's second row says.
Today `holds(set('session:write'), 'chat:write')` is `false`, so an admin with `session:write` cannot grant `chat:write`.

## Files

- `UPDATE: packages/sdk/src/users.ts:274-287` - `holds` answers a `chat` group from the session group of the same name.
- `UPDATE: packages/sdk/test/users.test.ts:665-688` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* rows for `chat`.
2. In `holds`, when the subject is `chat` and the operation is `read` or `write`, answer `true` for `session:<operation>`.
3. Keep the rule that an operation never holds its group: `chat:send` still does not hold `chat:write`.
4. Add the test cases below.

## Validation

- `users.test.ts`: `session:write` holds `chat:write`, and `session:read` holds `chat:read`.
- `users.test.ts`: `session:read` does not hold `chat:write`, and `chat:send` does not hold `chat:write`.
- `users.test.ts`: a holder of `session:write` may grant `chat:write` to a role.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

