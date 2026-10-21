---
title: An old owner name reads as the new one
status: done
depends: [task-01-ahpds-plugins-export-slugs.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/utils/values.ts#L40-L41](../../../../packages/sdk/src/utils/values.ts#L40-L41) - `ownerOf`, the reading of a saved owner"
  - "[code://packages/sdk/src/sessions/sessions.ts#L610-L618](../../../../packages/sdk/src/sessions/sessions.ts#L610-L618) - a saved session's owner and senders"
  - "[code://packages/server/src/scheduled.ts#L404](../../../../packages/server/src/scheduled.ts#L404) - a saved automation's owner"
  - "[code://packages/sdk/src/usage/usage.ts#L242-L266](../../../../packages/sdk/src/usage/usage.ts#L242-L266) - `entriesIn`, the reading of a usage line"
  - "[code://packages/sdk/src/automations/triggers.ts#L192-L193](../../../../packages/sdk/src/automations/triggers.ts#L192-L193) - a trigger's `owners` filter"
---

## Objective

When the host reads an owner `plugin:@ahpd/<x>`, it takes it as `plugin:<x>`, and `plugin:ahpd-web` as `plugin:web`.
This holds for saved sessions, wake senders, automations, usage lines and a trigger's `owners` filter.
Nothing on disk is rewritten.

## Files

- `UPDATE: packages/sdk/test/values.test.ts` - the cases for `currentOwner` and `ownerOf`.
- `UPDATE: packages/sdk/test/usage.test.ts` - a usage line with an old owner.
- `UPDATE: packages/sdk/test/sessions.test.ts` - a saved row with an old owner and sender.
- `UPDATE: packages/sdk/test/triggers.test.ts` - a rule whose `owners` names an old owner.
- `UPDATE: packages/sdk/src/utils/values.ts:31-41` - `currentOwner`, and `ownerOf` reads through it.
- `UPDATE: packages/sdk/src/usage/usage.ts:242-266` - `entriesIn` reads `owner` and `pools` through `currentOwner`.
- `UPDATE: packages/sdk/src/automations/triggers.ts:192-193` - the `owners` filter reads through `currentOwner`.
- `UPDATE: packages/sdk/src/index.ts` - export `currentOwner`.

## Steps

1. Write the `values.test.ts` cases from Validation, and see them fail.
2. Write the `usage.test.ts` case from Validation, and see it fail.
3. Add `currentOwner(owner)` to `values.ts`, which maps `plugin:@ahpd/<x>` to `plugin:<x>` and `plugin:ahpd-web` to `plugin:web`.
4. Make `currentOwner` return every other string as it is.
5. Make `ownerOf` return `currentOwner` of a typed reference.
6. In `entriesIn`, map the line's `owner` and each pool through `currentOwner`.
7. In the trigger filter, compare the session's owner with the `owners` mapped through `currentOwner`.
8. Export `currentOwner` from `index.ts`.
9. Run the gates.

## Validation

- `values.test.ts` cases:
  - `currentOwner('plugin:@ahpd/webhook')` is `plugin:webhook`.
  - `currentOwner('plugin:ahpd-web')` is `plugin:web`.
  - `currentOwner` keeps `plugin:@acme/x`, `plugin:bot` and `user:@ahpd/x` as they are.
  - `ownerOf('plugin:@ahpd/bot')` is `plugin:bot`.
- A sessions test: a saved row with owner `plugin:@ahpd/bot` reads back with owner `plugin:bot`.
- A `usage.test.ts` case: the store charges a line with owner `plugin:@ahpd/bot` to the pool `plugin:bot`.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume

- **Done:** 2026-10-14. `currentOwner` in `values.ts` reads `plugin:@ahpd/<x>` as `plugin:<x>` and `plugin:ahpd-web` as `plugin:web`.
- **Readers:** `ownerOf`, `entriesIn` and the trigger filter call `currentOwner`. Sessions, wake senders and scheduled automations read through `ownerOf`, so they need no change of their own.
- **Departure:** a `triggers.test.ts` case was added, because the trigger filter had no test for this.
- **Gates:** typecheck, boundary and schema pass. The test gate passes with 5086 tests.
