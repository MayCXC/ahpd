---
title: The docs say how a connector shows health
status: todo
depends: [task-02-a-host-secret-can-name-an-env-variable.md, task-03-the-channel-keeps-health.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L503](../../../../docs/plugins/PLUGINS.md#L503) - the adapter section"
  - "[code://docs/plugins/PLUGINS.md#L1176](../../../../docs/plugins/PLUGINS.md#L1176) - the connectors commands table"
  - "[code://docs/sdk/HOST.md#L177](../../../../docs/sdk/HOST.md#L177) - the grants table for connectors"
---

## Objective

The plugin docs say how an adapter gives a check, and what `health` holds.
They say how a host connector names an environment variable, and what the check command does.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - the adapter section gets `check` and the env reference, and the commands table gets `x-ahpd/connectors/check`.
- `UPDATE: docs/sdk/HOST.md` - the grants table gets a row for checking a connector.

## Steps

1. Add `check` to the adapter section, with a short example that calls a service with the connector's key.
2. Describe the four results and the 10 second limit.
3. Describe the `health` key on a row, and say it lives in memory only.
4. Describe `{ "$env": "<NAME>" }` for a host connector, and say a team or person's connector cannot use it.
5. Add the `x-ahpd/connectors/check` row to the commands table.
6. Add the row "Check a connector" to the grants table in `HOST.md`.
7. Keep each paragraph on one line, as the files already are.

## Validation

- `pnpm -s build` passes, with the docs build if the gate runs it.
- By hand: each new command and field in the docs matches the code.

## Resume
