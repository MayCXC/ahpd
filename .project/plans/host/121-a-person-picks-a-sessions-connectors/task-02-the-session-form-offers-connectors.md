---
title: The session form offers connectors
status: todo
depends: [task-01-the-connectors-key-takes-a-list.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/sessionconfig.ts#L236-L244](../../../../packages/sdk/src/host/sessionconfig.ts#L236-L244) - `connectors` declared as a map"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1486](../../../../packages/sdk/src/host/sessionmethods.ts#L1486) - `scoping`, the per-person picker to mirror"
  - "[code://packages/sdk/src/connectors/channel.ts#L168](../../../../packages/sdk/src/connectors/channel.ts#L168) - `refs()`, the connectors with their owners"
---

## Objective

`resolveSessionConfig` offers `connectors` as a list the person picks from.
The list holds the person's own connectors and the host's, whose adapter has an `action` capability.

## Files

- `UPDATE: packages/sdk/src/host/sessionconfig.ts:236-244` - declare `connectors` as an array of strings.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1486` - fill the array's `items.enum` for the person asking.
- `UPDATE: packages/sdk/test/` - cases for the picker: own and host listed, a team's and another person's left out, an adapter with no action left out.

## Steps

1. Declare `connectors` as `type: 'array'`, with `items` of `type: 'string'`, and default `[]`.
2. Read the connectors from `options.connectors?.refs()` when `resolveSessionConfig` runs.
3. Keep a connector when `sameOwnerOrHost(ref.owner, owner)` holds for the person asking.
4. Keep a connector when its adapter has at least one `action` capability.
5. Set `items.enum` to each kept connector as `connectors://<adapter>/<id>`.
6. Set `items.enumLabels` to the connector's title, or its id when it has none.
7. Leave the key out when the picker keeps no connector, so a client draws no empty control.
8. Add the test cases.

## Validation

- The new picker tests pass.
- `ahpc` and ahpw show a Connectors control on a new session, with the Telegram connector in it.

## Resume
