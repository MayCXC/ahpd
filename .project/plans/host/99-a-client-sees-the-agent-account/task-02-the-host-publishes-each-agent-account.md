---
title: The host publishes each agent account
status: todo
depends: [task-01-the-claude-probe-reports-its-account.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host.ts#L1023-L1043](../../../../packages/sdk/src/host.ts#L1023-L1043) - the boot probe loop"
  - "[code://packages/sdk/src/host.ts#L570-L593](../../../../packages/sdk/src/host.ts#L570-L593) - the filter per connection"
  - "[code://packages/sdk/src/host/gate.ts#L355-L356](../../../../packages/sdk/src/host/gate.ts#L355-L356) - `seesConfig`"
  - "[code://packages/sdk/src/users.ts#L30-L61](../../../../packages/sdk/src/users.ts#L30-L61) - the roles and the subjects"
---

## Objective

The host keeps one account per agent and publishes it as a root config value shaped like `vscode.codexAccount`.
A connection that is not root and does not hold `account:read` gets no account value.

## Files

- `UPDATE: packages/sdk/src/host.ts:1023-1043` - the probe loop keeps `offered.account` per agent.
- `UPDATE: packages/sdk/src/host.ts:570-593` - the filter drops the account values for a connection without the grant.
- `UPDATE: packages/sdk/src/host/root.ts:233-344` - the account keys are root config values that a client cannot write.
- `UPDATE: packages/sdk/src/host/gate.ts:355-356` - `seesAccount` beside `seesConfig`.
- `UPDATE: packages/sdk/src/users.ts:43-61` - the `account` subject, with `account:read`.
- `UPDATE: packages/sdk/src/types/agent.ts:492-504` - an event that a running agent sends when its account changes.
- `UPDATE: packages/sdk/test` - the account reaches a connection with the grant and not one without it.

## Steps

1. Read decision `an-agent-account-is-shown-to-account-readers.md`.
2. Keep the account of each agent from its probe.
3. Add the event that a running agent sends when its account changes.
4. Publish the Codex account under `vscode.codexAccount`, and the others under an ahpd key named after it.
5. Refuse a client write to an account key.
6. Add the `account` subject to `users.ts`, with `read` as its one operation.
7. Filter the account values for each connection with `seesAccount`.
8. Filter the snapshot of the root state the same way.
9. Write the tests.
10. Set this task and the plan row to `implemented`.

## Validation

- A test: a root connection gets the account in its snapshot and in each change.
- A test: a guest connection gets no account value in its snapshot or in a change.
- A test: a member given `account:read` gets the account.
- A test: the host refuses a client write to an account key.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary`, the schema gate and the vitest gate pass.

## Resume
