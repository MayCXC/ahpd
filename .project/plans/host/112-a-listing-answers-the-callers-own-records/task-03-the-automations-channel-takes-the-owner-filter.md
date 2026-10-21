---
title: The automations channel takes the owner filter
status: todo
depends: [task-01-one-helper-reads-the-owner-filter.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/snapshots.ts#L109-L114](../../../../packages/sdk/src/host/snapshots.ts#L109-L114) - the automations snapshot"
  - "[code://packages/sdk/src/host/channels.ts#L15](../../../../packages/sdk/src/host/channels.ts#L15) - `AUTOMATIONS`"
  - "[code://packages/sdk/test/host-snapshots.test.ts](../../../../packages/sdk/test/host-snapshots.test.ts) - the snapshot cases"
---

## Objective

A subscription to `ahp-automations://?owner=me` gets a snapshot of the caller's automations only.
The actions after the snapshot reach that subscription only for those automations.

## Files

- `UPDATE: packages/sdk/src/host/snapshots.ts:109-114` - accept the channel with a query, and filter the entries.
- `UPDATE: packages/sdk/src/host/channels.ts` - send an automations action to a filtered subscription only for its owner.
- `UPDATE: packages/sdk/test/host-snapshots.test.ts` - the cases below.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - say that the channel takes `?owner=me`.

## Steps

1. Accept `ahp-automations://` with a query in the subscribe path, and read it with `ownerFilter`.
2. Answer INVALID_PARAMS when `ownerFilter` throws.
3. With an owner, keep only the entries whose `owner` equals it in the snapshot.
4. Send an action about one automation to a filtered subscription only when that automation has the same owner.
5. Keep `ahp-automations://` with no query as it is now.
6. Add a case with two people, where each snapshot has only that person's automations.
7. Add a case where an action about another person's automation does not reach a filtered subscription.
8. Run the sdk tests, and set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass from the repository root.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a client keys its state by the channel URI. The filtered channel is a second URI, so it holds its own state.
