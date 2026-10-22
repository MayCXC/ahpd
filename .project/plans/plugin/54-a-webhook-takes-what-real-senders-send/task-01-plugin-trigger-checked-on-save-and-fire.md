---
title: A plugin trigger is checked on save and at a fire
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/automations/automations.ts#L264-L276](../../../../packages/sdk/src/automations/automations.ts#L264-L276) - `checkTriggers`, which looks only in `EVENT_TRIGGERS`"
  - "[code://packages/sdk/src/automations/automations.ts#L180](../../../../packages/sdk/src/automations/automations.ts#L180) - `pluginTriggerTypes`, the plugin types the check must also read"
  - "[code://packages/sdk/src/automations/automations.ts#L226-L250](../../../../packages/sdk/src/automations/automations.ts#L226-L250) - `wrongIn`, the schema check to reuse"
  - "[code://packages/sdk/src/host/automations.ts#L1174-L1196](../../../../packages/sdk/src/host/automations.ts#L1174-L1196) - `fired`, which runs a trigger with an empty config on every fire"
  - "[code://packages/sdk/test/plugin-triggers.test.ts#L180](../../../../packages/sdk/test/plugin-triggers.test.ts#L180) - the test that makes an empty config the intended behaviour"
---

## Objective

A trigger of a type a plugin registered is checked when the automation is saved, as the host's own types are.
A config that fails the type's schema, or an event the type does not offer, is refused.
A stored trigger that fails its type's schema does not fire.

## Files

- `UPDATE: packages/sdk/src/automations/automations.ts:264-276` - `checkTriggers` reads the plugin types too.
- `UPDATE: packages/sdk/src/host/automations.ts:1174-1196` - `fired` skips a trigger whose config fails its type's schema.
- `UPDATE: packages/sdk/test/plugin-triggers.test.ts` - the cases below.

## Steps

1. Give `checkTriggers` the plugin trigger types that the store already lists.
2. Check a plugin trigger's config against its type's `configSchema` with `wrongIn`.
3. Refuse a plugin trigger event that its type does not offer, with the event id named.
4. Leave a trigger of a type no loaded plugin registers unchecked.
5. Skip a trigger in `fired` whose config fails its type's schema, and write a problem line once for it.
6. Change the test at line 180, so that an empty config fires only when the schema requires nothing.
7. Run the SDK tests, and set this task and the plan row to `implemented`.

## Validation

- `plugin-triggers.test.ts`: the host refuses a save whose webhook trigger has no `connector`, and names `connector`.
- `plugin-triggers.test.ts`: the host refuses a save whose trigger names the event `calls`.
- `plugin-triggers.test.ts`: a stored trigger with no required key does not run on a fire.
- `plugin-triggers.test.ts`: the host saves a trigger of an unloaded plugin's type.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** `checkTriggers` is a module function, so the store passes the plugin types to it.
