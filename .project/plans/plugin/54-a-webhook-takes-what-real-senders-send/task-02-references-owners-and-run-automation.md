---
title: References and owners are checked, and a plugin runs one automation
status: todo
depends: [task-01-plugin-trigger-checked-on-save-and-fire.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1024](../../../../packages/sdk/src/types/plugin.ts#L1024) - `fireTrigger`, which carries no owner"
  - "[code://packages/sdk/src/host/automations.ts#L1002-L1007](../../../../packages/sdk/src/host/automations.ts#L1002-L1007) - `maySee`, the only owner check at a fire"
  - "[code://packages/sdk/src/host/automations.ts#L1384](../../../../packages/sdk/src/host/automations.ts#L1384) - `runAutomation`, the client command a plugin call can reuse"
  - "[code://packages/sdk/src/connectors/channel.ts](../../../../packages/sdk/src/connectors/channel.ts) - the connectors channel, where a put is checked"
  - "[code://packages/server/src/commands/run.ts#L685](../../../../packages/server/src/commands/run.ts#L685) - where the daemon builds the connectors channel and the automation store"
---

## Objective

A schema field can name a connector or an automation, and the host checks that the record exists and that the owners agree.
The owner rule is: both have the same owner, or the connector is the host's.
A plugin starts one automation by its id, and every fire carries the owner of the connector it came from.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `runAutomation(id, data, owner)` on `PluginHost`, and an `owner` argument on `fireTrigger`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - the two calls in `pluginHost`.
- `UPDATE: packages/sdk/src/host/automations.ts` - the owner rule at a fire and at a run.
- `UPDATE: packages/sdk/src/automations/automations.ts` - an `x-ahpd-connector` field is checked on save.
- `UPDATE: packages/sdk/src/connectors/channel.ts` - an `x-ahpd-automation` field is checked on put.
- `UPDATE: packages/server/src/commands/run.ts` - give each check the lookup it needs.
- `CREATE: packages/sdk/test/references.test.ts` - the cases below.

## Steps

1. Read `x-ahpd-connector: { adapter }` on a trigger config field as the id of a connector of that adapter.
2. Refuse a save whose field names no connector of that adapter, with the id named.
3. Refuse a save whose connector fails the owner rule against the automation's owner.
4. Read `x-ahpd-automation: true` on an adapter config field as the id of an automation.
5. Refuse a connector put whose field names no automation, or an automation that fails the owner rule.
6. Treat the automation owner `root:<host>` as the host when the owner rule compares.
7. Add `runAutomation(id, data, owner)` to `PluginHost`, which starts one run with `data` on its origin.
8. Refuse that run when the automation is off or fails the owner rule, and write a problem line.
9. Add the `owner` argument to `fireTrigger`, and run only the automations that pass the owner rule.
10. Keep the `maySee` check at both calls.
11. Give the store and the channel their lookups in `run.ts`.
12. Run the SDK and server tests, and set this task and the plan row to `implemented`.

## Validation

- `references.test.ts`: the host refuses to save an automation of `user:bob` whose trigger names a connector of `user:alice`.
- `references.test.ts`: the same automation saves when the connector is the host's.
- `references.test.ts`: the host refuses a put of a `user:alice` connector that names an automation of `user:bob`.
- `references.test.ts`: a fire with owner `user:alice` does not run an automation of `user:bob`.
- `references.test.ts`: `runAutomation` starts one run whose origin holds `data`, and only that automation runs.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a connector owner is `host`, `team:<id>` or `user:<id>`, and an automation owner can also be `project:<id>` or `root:<host>`.
  A `project:` owner matches only the host's connectors.
