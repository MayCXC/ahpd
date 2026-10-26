---
title: An old plugin's refusal names the fix
status: implemented
depends: [task-01-the-host-starts-with-no-agent.md]
layer: server
refs:
  - "[code://packages/server/src/plugins.ts#L733](../../../../packages/server/src/plugins.ts#L733) - the refusal of an `ahpd.options` entry"
  - "[code://packages/server/src/plugins.ts#L1331-L1346](../../../../packages/server/src/plugins.ts#L1331-L1346) - the refusals of a `manifest` and an `optionsSchema` export"
  - "[code://packages/server/src/commands/run.ts#L1539-L1540](../../../../packages/server/src/commands/run.ts#L1539-L1540) - the no-backend line"
---

## Objective

An old plugin stays refused, with an error alert. Each refusal and the no-backend line tell the reader to run `ahpd plugin update all`, or to update the plugin from a client.

## Files

- `UPDATE: packages/server/src/plugins.ts:733` - the `ahpd.options` refusal names the update.
- `UPDATE: packages/server/src/plugins.ts:1331-1346` - the `manifest` and `optionsSchema` refusals name the update.
- `UPDATE: packages/server/src/commands/run.ts:1539-1540` - the no-backend line names `ahpd plugin update all` when a plugin is installed and refused, and the install line only when no plugin is installed.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - the refused plugin's error alert carries the new text.

## Steps

1. Add this sentence to each refusal: "An older plugin: run ahpd plugin update all, or update it from a client."
2. Keep the rest of each refusal as it is.
3. In `run.ts`, find each configured plugin that the load refused.
4. When one was, make the no-backend line name `ahpd plugin update all` and the configuration file.
5. When the configuration has no plugin, keep the line with `ahpd plugin install @ahpd/agent-claude`.
6. Add a test with a plugin that exports `optionsSchema`: its row has one error alert with the new sentence.
7. Add a test for each form of the no-backend line.
8. Run the gates, and set this task and the plan row to `implemented`.

## Validation

- The new tests pass.
- The gates pass.

## Resume
