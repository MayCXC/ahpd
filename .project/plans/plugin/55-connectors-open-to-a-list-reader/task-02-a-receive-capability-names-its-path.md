---
title: A receive capability names its path
status: implemented
depends: []
layer: "sdk, webhook"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L25-L45](../../../../packages/sdk/src/types/connectors.ts#L25-L45) - `Capability`"
  - "[code://packages/sdk/src/connectors/adapters.ts](../../../../packages/sdk/src/connectors/adapters.ts) - `x-ahpd-adapters`, which shows each adapter's capabilities"
  - "[code://packages/webhook/src/adapter.ts#L98-L103](../../../../packages/webhook/src/adapter.ts#L98-L103) - the webhook's receive capability"
---

## Objective

A receive capability may say the path where its connectors receive.
A client puts the daemon's HTTP root before it and the connector id in `{id}`.

## Files

- `UPDATE: packages/sdk/src/types/connectors.ts:25-45` - the optional `path` on `Capability`.
- `UPDATE: packages/sdk/src/connectors/adapters.ts` - send `path` in each row of `x-ahpd-adapters`.
- `UPDATE: packages/webhook/src/adapter.ts` - `path: '/plugins/webhook/{id}'` and a description that names no scheme.
- `UPDATE: packages/sdk/test/adapters-channel.test.ts` - the cases below.

## Steps

1. Add the optional `path` to `Capability`, with a comment that says the HTTP root and `{id}`.
2. Refuse a `path` on a capability whose type is not `receive` when the adapter registers.
3. Refuse a `path` that does not start with `/`.
4. Send `path` in the adapters channel, and leave it out where the capability has none.
5. Give the webhook's receive capability the path `/plugins/webhook/{id}`.
6. Change its description to "Receives the calls a sender makes to the connector's URL."
7. Run the SDK and webhook tests, and set this task and the plan row to `implemented`.

## Validation

- `adapters-channel.test.ts`: the webhook row's receive capability carries `path: /plugins/webhook/{id}`.
- `adapters-channel.test.ts`: the host refuses an adapter with a `path` on a `command` capability.
- `adapters-channel.test.ts`: a capability with no `path` shows no `path` key.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `Capability` has an optional `path`, documented as relative to the daemon's HTTP root with `{id}` for the connector id. `checkAdapter` refuses a `path` on a capability whose type is not `receive`, and a `path` that is not a string starting with `/`. The adapters channel needed no code change to send it: `rowOf` already sends each capability whole, and its comment says so. The webhook's receive capability is now `path: '/plugins/webhook/{id}'` with the description "Receives the calls a sender makes to the connector's URL." Tests: a receive capability keeps its path in a row, a command carries none, and the host refuses a path on a command and a path without a leading `/`.
- **Next action:** none for this task; task 03 is next in the plan.
- **Files:** `packages/sdk/src/types/connectors.ts`, `packages/sdk/src/plugins/validate.ts`, `packages/sdk/src/connectors/adapters.ts`, `packages/webhook/src/adapter.ts`, `packages/sdk/test/adapters-channel.test.ts`, this task file and the plan. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** `packages/sdk/src/connectors/adapters.ts` changed only its comment: the row already sent `capabilities` whole, so `path` reached the client without a mapping.
- **Watch out for:** the webhook's `CAPABILITIES` passes `checkAdapter` when the plugin registers, so a later path change there is refused at load, not at the route.
