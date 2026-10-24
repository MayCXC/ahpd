---
title: A running session changes its connectors
status: todo
depends: [task-01-the-connectors-key-takes-a-list.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L681](../../../../packages/sdk/src/host/chatactions.ts#L681) - `session/configChanged`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1707](../../../../packages/sdk/src/host/lifecycle.ts#L1707) - the check a start makes"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L236-L244](../../../../packages/sdk/src/host/sessionconfig.ts#L236-L244) - `sessionMutable: false` on `connectors`"
---

## Objective

A `session/configChanged` with `connectors` changes the bindings of a running session.
The change is checked as a start is, and the session gets a new tool list.

## Files

- `UPDATE: packages/sdk/src/host/sessionconfig.ts:236-244` - set `sessionMutable: true` on `connectors`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:681` - check a changed `connectors` with `checkBindings` and the session's owner.
- `UPDATE: packages/sdk/test/` - cases for an added binding, a removed binding and a refused one.

## Steps

1. Set `sessionMutable: true` on the `connectors` declaration.
2. Run `checkBindings` on a changed `connectors` value with the session's owner, before the host keeps the config.
3. Refuse the action with the error `checkBindings` throws, and keep the old binding.
4. Call the tool list rebuild that a bot edit uses, after the host keeps a change.
5. Add a test where a session gains the Telegram tools after a change.
6. Add a test where a session loses them after a change.
7. Add a test where the host refuses a change that names another person's connector.

## Validation

- The three new tests pass.
- In ahpw, a connector picked on a running session shows its tools at the next turn.

## Resume
