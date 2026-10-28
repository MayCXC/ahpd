---
title: A connection asks who it is - implemented
date: 2026-10-28
refs:
  - "[code://packages/sdk/src/access/me.ts](../../../../packages/sdk/src/access/me.ts)"
  - "[code://packages/sdk/src/access/users.ts](../../../../packages/sdk/src/access/users.ts)"
  - "[code://packages/sdk/src/types/users.ts](../../../../packages/sdk/src/types/users.ts)"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts)"
---

A client sends `x-ahpd/me` and gets one `Me` object about its own connection.
The object names the principal, its roles, the roles the sign-in added, its grants, its minted token and its usage pools.

## What was built

- [`code://packages/sdk/src/types/users.ts`](../../../../packages/sdk/src/types/users.ts) - `Principal.rolesFromSignIn`, and the `Me` interface with a comment on each field.
- [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - `principalOf` stamps `rolesFromSignIn` and freezes it with the literal.
- [`code://packages/sdk/src/access/me.ts`](../../../../packages/sdk/src/access/me.ts) - `meMethods(directory)`, which answers `x-ahpd/me` for a person, a plugin and root.
- [`code://packages/sdk/src/index.ts`](../../../../packages/sdk/src/index.ts) - exports `meMethods` and the `Me` type.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - registers `x-ahpd/me` when the daemon has a users directory.
- [`code://docs/sdk/USERS.md`](../../../../docs/sdk/USERS.md) - the section "Who a connection is", with the command and its fields.

## Verified

- `packages/sdk/test/me-method.test.ts`: 7 tests pass.
- `packages/sdk/test/users-issuer.test.ts`: 46 tests pass, with the new test of `rolesFromSignIn`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s test` pass.

## Departures from the plan

- `kind` has a third value, `plugin`. A plugin connection has a reader with `plugin` set, and its `principal` is the owner, `plugin:<name>`, not `user:<id>`.
- `meMethods` takes only the directory, not the host name. The root answer reads `root:<host>` from the owner that the host gives `handle`.

## Left for later

- None.
