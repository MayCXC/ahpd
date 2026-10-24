---
title: A host secret can name an env variable
status: todo
depends: [task-01-the-types-carry-a-check-and-health.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L400-L449](../../../../packages/sdk/src/connectors/channel.ts#L400-L449) - `moveSecrets`, which refuses a reference in a secret field today"
  - "[code://packages/sdk/src/connectors/channel.ts#L329-L340](../../../../packages/sdk/src/connectors/channel.ts#L329-L340) - `resolved`, which reads each `$secret` back"
  - "[code://packages/sdk/src/connectors/channel.ts#L195-L208](../../../../packages/sdk/src/connectors/channel.ts#L195-L208) - the config a client is shown, with `<set>` for a secret"
---

## Objective

A host connector's secret field can hold `{ "$env": "<NAME>" }`.
The host reads that variable from the daemon's environment when it opens the connector, and keeps nothing in the vault for it.

## Files

- `UPDATE: packages/sdk/src/connectors/channel.ts` - accept an `$env` reference in `moveSecrets` for a host connector, read it in `resolved`, and show it in a row.
- `UPDATE: packages/sdk/test/connectors-channel.test.ts` - cases for each rule below.

## Steps

1. In `moveSecrets`, keep an `envRef` value in a `writeOnly` field as it is, when the owner is `host`.
2. Refuse an `envRef` value for a `team:` or a `user:` owner with `INVALID_PARAMS`.
3. Say in the message that only a host connector may name a variable.
4. Remove the old vault secret of that field when a put changes the field to an `envRef`.
5. In `resolved`, answer `process.env[name]` for an `envRef` value.
6. Throw `the environment holds no <NAME>` when the variable is not set or is empty.
7. Send an `envRef` value in a row unchanged, not as `<set>`.
8. Let the schema check pass an `envRef` value in a `writeOnly` string field, as `<set>` passes today.
9. Take no `envRef` value into the vault on a remove, because it names none.
10. Add the test cases with a variable set for the test and removed after it.

## Validation

- A case shows a host connector that opens with the variable's value.
- A case shows a missing variable makes the connector `invalid`.
- A case shows the channel refuses an `envRef` for a team or a person.
- A case shows the row holds `{ "$env": "<NAME>" }` and never the value.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume
