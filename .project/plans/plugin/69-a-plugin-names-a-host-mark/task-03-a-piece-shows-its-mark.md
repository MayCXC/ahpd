---
title: An Activepieces piece shows its mark
status: implemented
depends: [task-01-the-host-resolves-a-mark.md]
layer: "activepieces"
refs:
  - "[code://packages/activepieces/src/logos.ts#L96](../../../../packages/activepieces/src/logos.ts#L96) - `logoOf`, which reads the cache and then the CDN"
  - "[code://packages/activepieces/src/plugin.ts#L383-L390](../../../../packages/activepieces/src/plugin.ts#L383-L390) - where each piece's logo is asked for and given to its adapter"
  - "[code://.project/plans/plugin/58-plugins-and-adapters-carry-icons/task-06-a-large-logo-has-a-shipped-svg.md](../58-plugins-and-adapters-carry-icons/task-06-a-large-logo-has-a-shipped-svg.md) - the task this one replaces"
---

## Objective

A piece that maps to a host mark gets `{ src: "mark:<name>" }` as its adapter icon, and its CDN logo is not fetched.
A piece with no mark keeps its CDN logo.

## Files

- `UPDATE: packages/activepieces/src/logos.ts:96` - a table from adapter name to mark, read before the cache and the CDN.
- `UPDATE: packages/activepieces/src/plugin.ts:383-390` - give the adapter the mark icon when the piece has one.
- `UPDATE: packages/activepieces/test/logos.test.ts` - cases for a piece with a mark, which makes no fetch, and one without.
- `UPDATE: docs/plugins/activepieces.md` - say that a host mark wins over the piece's own logo.
- `UPDATE: .project/plans/plugin/58-plugins-and-adapters-carry-icons/task-06-a-large-logo-has-a-shipped-svg.md` - set `status: dropped`, and name this task.
- `UPDATE: .project/plans/plugin/58-plugins-and-adapters-carry-icons/plan.md` - mark task 06 dropped in the Tasks table and the Resume state.

## Steps

1. Add the table: `ap-jira-cloud` to `jira`, `ap-linear` to `linear`, `ap-resend` to `resend` and `ap-whatsapp` to `whatsapp`.
2. Make `logoOf` answer `{ src: "mark:<name>" }` for a piece in the table, before it reads the cache.
3. Leave the cache and the CDN fetch as they are for a piece not in the table.
4. Add the two test cases, with a fetcher that fails the test when a marked piece calls it.
5. Add a sentence to the logo section of `docs/plugins/activepieces.md`.
6. Drop plan 58 task 06, and update plan 58's Tasks table and Resume state.

## Validation

- `pnpm exec vitest run packages/activepieces` passes, with the new cases.
- By hand: with the config-dev pieces, the adapters channel rows for Jira, Linear, Resend and WhatsApp have a `data:image/svg+xml` icon.

## Resume

- **Done so far:** `packages/activepieces/src/logos.ts` holds a `MARKS` table from `ap-jira-cloud`, `ap-linear`, `ap-resend` and `ap-whatsapp` to their mark names, and `logoOf` answers `{ icon: { src: "mark:<name>" } }` before it reads the cache, so a marked piece makes no fetch. `plugin.ts` needed no change, because the icon `logoOf` answers already reaches the adapter. `logos.test.ts` has two new cases: a marked piece with a cache file and a fetcher that throws still answers the mark, and a piece with no mark fetches its CDN logo once. `docs/plugins/activepieces.md` says the four pieces show a host mark instead of their CDN logo. Plan 58 task 06 is `dropped`, names this task, and its plan says so in the Tasks table and the Resume state.
- **Next action:** none; the four marks come from task 01.
- **Files:** `packages/activepieces/src/logos.ts`, `packages/activepieces/test/logos.test.ts`, `docs/plugins/activepieces.md`, `.project/plans/plugin/58-plugins-and-adapters-carry-icons/task-06-a-large-logo-has-a-shipped-svg.md`, `.project/plans/plugin/58-plugins-and-adapters-carry-icons/plan.md`, this task file.
- **Open questions:** none.
- **Departures:** the Files list names `packages/activepieces/src/plugin.ts:383-390`, but no change was needed there: `logoOf`'s icon is already handed to `adapterOf`.
- **Watch out for:** the mark table is read before the cache, so a cached CDN logo never wins over a mark.
