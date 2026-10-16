---
title: A webhook fires an automation, and the run reads the event
status: done
depends: [task-01-webhook-keeps-endpoints-checks-caller.md]
layer: "packages/sdk, packages/webhook"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L828-L842](../../../../packages/sdk/src/types/plugin.ts#L828-L842) - `registerTriggerType` and `fireTrigger`"
  - "[code://packages/sdk/src/host/automations.ts#L1117-L1139](../../../../packages/sdk/src/host/automations.ts#L1117-L1139) - `fired`, which builds the facts of a fire and drops its `data` from them"
  - "[code://packages/sdk/src/host/automations.ts#L1019-L1030](../../../../packages/sdk/src/host/automations.ts#L1019-L1030) - `watchFor`, which keeps a watched trigger without its `config`"
  - "[code://packages/sdk/src/types/plugin.ts#L96](../../../../packages/sdk/src/types/plugin.ts#L96) - `config`, the form values of a saved trigger"
  - "[code://packages/sdk/src/host/automations.ts#L482-L496](../../../../packages/sdk/src/host/automations.ts#L482-L496) - `hold`, which keeps the newest facts of a folded wake"
  - "[code://packages/sdk/src/wakemessage.ts#L18-L74](../../../../packages/sdk/src/wakemessage.ts#L18-L74) - `WakeFacts`, `WAKE_PLACEHOLDERS` and `wakeMessage`, whose `\\w+` pattern does not match `{{event.<field>}}`"
  - "[code://packages/sdk/test/plugin-triggers.test.ts#L116-L132](../../../../packages/sdk/test/plugin-triggers.test.ts#L116-L132) - the case where a plugin fires its event, to extend"
  - "[code://packages/sdk/test/automation-wake.test.ts#L217](../../../../packages/sdk/test/automation-wake.test.ts#L217) - the case that fills the placeholders, to extend"
  - "[code://docs/sdk/AUTOMATIONS.md#L142-L167](../../../../docs/sdk/AUTOMATIONS.md#L142-L167) - the placeholder table of a run's message"
---

## Objective

A call to an automation endpoint fires the `webhook` trigger type with the call's JSON fields and the endpoint id as its data.
An automation runs only when its trigger's `config` names that endpoint.
A run's message can name each field as `{{event.<field>}}`, which the wake filler fills from the fire's data.

## Files

- `UPDATE: packages/sdk/src/wakemessage.ts:18-74` - add `data` to `WakeFacts`, and fill `{{event.<field>}}` from it.
- `UPDATE: packages/sdk/src/host/automations.ts:1019-1030` - keep the trigger's `config` on the watched entry.
- `UPDATE: packages/sdk/src/host/automations.ts:1133-1136` - skip an automation whose trigger `config` does not match the fire's data, and put the fire's `data` on the facts of the run.
- `UPDATE: packages/sdk/test/automation-wake.test.ts:217` - add the `{{event.<field>}}` cases beside the case that fills the placeholders.
- `UPDATE: packages/sdk/test/plugin-triggers.test.ts:116-132` - assert that a fired run's message holds a field of the fire's data, and add the `config` match cases.
- `CREATE: packages/webhook/src/automation.ts` - the automation target: read the JSON body and fire the trigger.
- `UPDATE: packages/webhook/src/plugin.ts` - register the `webhook` trigger type and build the automation seam over `host.fireTrigger`.
- `UPDATE: packages/webhook/src/route.ts` - give the automation target its handler.
- `CREATE: packages/webhook/test/webhook-automation.test.ts` - cases for the automation target, over a stub fire.
- `UPDATE: docs/sdk/AUTOMATIONS.md:142-167` - add `{{event.<field>}}` to the placeholder table and its rules.
- `UPDATE: docs/plugins/WEBHOOKS.md` - the automation call, the trigger type, and a message that names a field.

## Steps

1. Add the `{{event.<field>}}` cases from Validation to `automation-wake.test.ts`, and see them fail.
2. Add `data?: Record<string, unknown>` to `WakeFacts`, with a comment that says what it holds.
3. Change `PLACEHOLDER` so that it also matches `{{event.<field>}}` for one top-level field name of word characters.
4. Fill a string field as it is, and any other value as its JSON text.
5. Fill a field that the data does not hold, or facts with no data, with nothing.
6. Keep `{{event}}` as the event's title, and keep every other unknown name as written.
7. Add `event.<field>` to `WAKE_PLACEHOLDERS` in the form that the docs show.
8. In `fired`, put `data` on the `WakeFacts` it builds.
9. See the `automation-wake.test.ts` cases pass.
10. Extend the plugin fire case in `plugin-triggers.test.ts` with a message that names `{{event.where}}`, and see it pass.
11. Add the `config` match cases from Validation to `plugin-triggers.test.ts`, and see them fail.
12. In `watchFor`, keep the saved trigger's `config` on the watched entry.
13. In `fired`, skip an automation when a `config` value differs from the fire's data under the same key.
14. Keep the current behaviour for a trigger with no `config`, which every fire of its type and event reaches.
15. See the `config` match cases pass.
16. Write `webhook-automation.test.ts` with the webhook cases from Validation, and see it fail.
17. In `plugin.ts`, register the `webhook` trigger type with one event, `call`.
18. Give the type a `configSchema` with a required `endpoint` string, so that a client form offers it.
19. In `automation.ts`, answer 400 when the body is not a JSON object.
20. Call `fireTrigger('webhook', 'call', data)`, where `data` is the body with `endpoint` set to the endpoint id.
21. Let the endpoint id win over a body field named `endpoint`, so that a caller cannot reach another endpoint's automations.
22. Answer 202 after the fire, because a fire has no answer.
23. See the webhook cases pass.
24. Add `{{event.<field>}}` to the table in `docs/sdk/AUTOMATIONS.md`, and change "one of the six" to match.
25. Write the automation section of `docs/plugins/WEBHOOKS.md`.
26. Say there that the run's origin keeps the body, so the body must carry no secret.
27. Run the gates.

## Validation

- `automation-wake.test.ts` holds these cases:
  - A message that names `{{event.repo}}` gets the string value of `repo` from the fire's data.
  - A message that names a number field gets that number as text.
  - A message that names an object field gets its JSON text.
  - A message that names a field the data does not hold gets nothing in its place.
  - A message that names `{{event.repo}}` on a session event, which has no data, gets nothing in its place.
  - `{{event}}` still gets the event's title.
- `plugin-triggers.test.ts` holds these cases:
  - A run that a plugin fire starts gets `{{event.where}}` filled with `the coast`.
  - A trigger whose `config` holds `where: 'the coast'` runs on a fire with that data.
  - A trigger whose `config` holds `where: 'the hills'` does not run on a fire with `where: 'the coast'`.
  - A trigger with no `config` runs on every fire of its type and event.
- `webhook-automation.test.ts` holds these cases:
  - A JSON object body fires `webhook` and `call` once, and the call answers 202.
  - The data of that fire holds the body and the endpoint id.
  - A body field named `endpoint` does not replace the endpoint id in the data.
  - The `webhook` type offers one event, `call`, and a form with a required `endpoint`.
  - A body that is not JSON answers 400 and fires nothing.
  - A JSON body that is not an object answers 400 and fires nothing.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/webhook packages/sdk` passes.

## Resume

Built in `packages/sdk/src/wakemessage.ts`, `packages/sdk/src/host/automations.ts` and `packages/webhook/src/automation.ts`, with the trigger type and the automation seam in `plugin.ts`. `automation-wake.test.ts` gained 7 cases, `plugin-triggers.test.ts` gained 3 and changed 1, and `packages/webhook/test/webhook-automation.test.ts` holds 6.

How the parts work:

- `wakeMessage` fills `{{event.<field>}}` from `WakeFacts.data`. A string is filled as it is, any other value as JSON, and a missing field as nothing.
- A dotted name on anything other than `event` is left as written.
- `watchFor` keeps the trigger's `config`. `fired` skips an automation when a `config` value differs from the fire's data under a key that the data holds.
- Values are compared as JSON text, so a nested value matches by content.
- An empty `config` matches every fire, as a missing one does.
- `automationTarget` answers 400 for a body that is not a JSON object.
- Otherwise it fires with the body and `endpoint` set to the endpoint id, and answers 202.

Where the build departs from the plan:

- `TriggerTypeDefinition` is now exported from `@ahpd/sdk`, because the plugin declares its type with it.
- `route.ts` is not changed. Its seams already had the `automation` target, so `plugin.ts` gives it.
- The 202 answer carries `{ endpoint }`.
- `automation-wake.test.ts` has one more case: a dotted name on something other than `event` is left as written.
- `fired` compares only the `config` keys that the fire's data also holds, and `plugin-triggers.test.ts` has two cases for it. Softov chose this after the build. The webhook plugin is the only caller of `fireTrigger`, and it puts `endpoint` in every fire's data, so its match on `endpoint` stays strict.

Open questions: none.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/sdk packages/server packages/bot packages/webhook` passes 3993 of 3993 tests. One earlier run failed `nested-proxy.test.ts` once under load, and it passed on the next run.
