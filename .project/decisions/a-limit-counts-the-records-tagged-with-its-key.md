---
title: A limit counts the records tagged with its key when they were written
status: accepted
date: 2026-10-17
refs:
  - "[code://packages/sdk/src/types/usage.ts#L63](../../packages/sdk/src/types/usage.ts#L63) - `pools`, the opaque keys a record is charged to"
  - "[code://packages/sdk/src/usage/usage.ts#L202-L212](../../packages/sdk/src/usage/usage.ts#L202-L212) - `charge`, the running total each key gets per day"
  - "[code://packages/sdk/src/usage/meter.ts#L193-L197](../../packages/sdk/src/usage/meter.ts#L193-L197) - `poolsOf`, the owner, team and project keys a turn's record has today"
  - file:///github/ahp-review/prospect/ahp-user-rules.md - the rules draft: the charge walk, `shared` and `each`, `pool`, `cap`
---

## Context

A limit needs one number: how much was used against it in the current period.
A usage record names its owner, its team and its project, and no policy.
A team total cannot answer for a row, because it holds models, harnesses and members the row does not match.
Which row pays for a piece of work depends on the charge walk at that moment.
The walk reads the order, the pay order, `cap`, and which rows still have room.

## Decision

When the check allows a piece of work, the charge walk names a key for each row that counts each measure.
The record of that work carries those keys in `pools`.
The keys are `policy:<id>/<measure>` for a `shared` limit and `policy:<id>/<measure>/user:<id>` for an `each` limit.
A row that names a `pool` uses `pool:<name>` in place of `policy:<id>`.
What a limit has used is the store's total for its key, from the start of the period to now.
Source: Softov, 2026-10-17, asked "Write policy 02 with \"used\" counted this way: each usage record is tagged with the policy rows it counts against, and used is the store's running total for that tag?", answered "Write it".

## Consequences

Reading what is used is one lookup in the totals the store already keeps, whatever the scope or the number of members.
A key names the measure, because one record can be paid by different rows for different measures.
Usage recorded before this change has no policy keys, so every limit starts at zero.
An edit to a row changes no record already written.
A new amount applies at once, and a new match or scope counts only the work that follows.

## Options

- **Match the records to each row at read time.** It replays the charge walk over every record, with the rows and memberships of that time.
  Nothing keeps those, so the number would be a guess.
- **Tag new records and match the old ones once.** The old records would get keys from today's rows.
  The first period after the change would then mix two rules.
