---
title: Export writes local for every zone
status: done
layer: server
depends:
  - task-01-automation-exported-as-vscode-file.md
refs:
  - "[code://packages/server/src/blueprint.ts#L222-L236](../../../../packages/server/src/blueprint.ts#L222-L236) - `projectSchedule`, which refuses a zone other than the host's"
  - "[code://packages/server/test/blueprint.test.ts#L182-L185](../../../../packages/server/test/blueprint.test.ts#L182-L185) - the test of that refusal"
---

## Goal

Export writes `timeZone: local` for an automation in any zone, with the same hour and minute.
The file moves to a computer whose zone is not known, so the zone is not a reason to refuse.

## Files

- `UPDATE: packages/server/src/blueprint.ts` - `projectSchedule` no longer compares the zone, and `automationToBlueprint` no longer takes one.
- `UPDATE: packages/server/test/blueprint.test.ts` - the refusal test becomes a test that another zone exports as `local`.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - the export section says the zone is not kept.

## Steps

1. Remove the zone check from `projectSchedule`.
2. Remove the `zone` parameter from `automationToBlueprint` and its callers, if nothing else reads it.
3. Keep `scheduleTrigger`, because import still writes the host's zone.
4. Change the test at `blueprint.test.ts:182` to export a `Europe/Lisbon` automation and expect `timeZone: local` and the same cron.
5. Write one sentence in `docs/sdk/AUTOMATIONS.md`: export keeps the hour and drops the zone.

## Validation

- Export of an automation in `America/Campo_Grande` on a host in `America/Porto_Velho` writes the file.
- The other refusals keep their sentences.
- The gates pass: build, typecheck, boundary, schema and vitest.
