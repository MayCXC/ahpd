---
title: A records channel keeps a reader's list current
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/bot/src/catalogue.ts](../../../../packages/bot/src/catalogue.ts) - the per-client sets and `recompute` this copies"
  - "[code://packages/sdk/src/resources/records.ts#L37-L64](../../../../packages/sdk/src/resources/records.ts#L37-L64) - `Records`, the store the channel reads"
---

## Objective

`recordsChannel(scheme, source, options)` answers a `PluginChannel`, a `bind` step and a `refresh` step.
The source has only `ids` and `find`, so the computer plugin can use it in p4.

## Files

- `CREATE: packages/sdk/src/resources/recordschannel.ts` - `recordsChannel`, its options and its actions.
- `UPDATE: packages/sdk/src/index.ts` - export `recordsChannel`.
- `CREATE: packages/sdk/test/recordschannel.test.ts` - cases for the snapshot, the actions and the reader filter.

## Steps

1. Take the channel scheme, a source with `ids` and `find`, the read grant and an optional `mayRead(id, reader)`.
2. Return the channel, `bind(handle)` and `refresh`, as `botCatalogue` does.
3. Answer a snapshot of `{ records: [{ id, record }] }` for each record the reader may read.
4. Keep the ids sent to each client, and remove the set at `left`.
5. In `refresh`, read every id and record from the store.
6. Send `added` to a client that gains a record, with `to`.
7. Send `changed` to a client that holds a record whose JSON differs from the last one sent.
8. Send `removed` to a client that loses a record or holds one the store removed.
9. Send nothing when nothing differs.
10. Let in a reader without the grant through `authorize` when `mayRead` holds for one record.
11. Let a reader who is nobody see every record, as the bot catalogue does.

## Validation

- `recordsChannel.test.ts` subscribes two readers and checks each snapshot.
- A put and a `refresh` send `added`, an edit sends `changed`, and a drop sends `removed`.
- A grant that a reader loses, then `refresh`, sends `removed` for each record to that reader.
- Two calls to `refresh` with no change send nothing the second time.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Implemented 2026-10-11. `recordsChannel` is in `packages/sdk/src/resources/recordschannel.ts`, with its cases in `packages/sdk/test/recordschannel.test.ts`. A refresh runs after the one before it, and a refresh that cannot read the store is said through `onProblem` rather than thrown.
