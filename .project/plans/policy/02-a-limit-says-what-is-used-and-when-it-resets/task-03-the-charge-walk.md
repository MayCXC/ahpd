---
title: The charge walk says which rows pay, whether they have room, and their keys
status: implemented
depends: [task-01-the-store-keeps-its-days-in-the-usage-timezone.md, task-02-a-total-counts-the-turns.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/decide.ts#L157-L200](../../../../packages/sdk/src/decide.ts#L157-L200) - `decide`, whose `candidates` the walk starts from"
  - "[code://packages/sdk/src/decide.ts#L96-L120](../../../../packages/sdk/src/decide.ts#L96-L120) - `scoped`, how a row's scope holds a person"
  - "[code://packages/sdk/src/types/policies.ts#L66-L98](../../../../packages/sdk/src/types/policies.ts#L66-L98) - `PolicyLimit`, `pool` and `cap`"
  - "[code://packages/sdk/src/policies.ts](../../../../packages/sdk/src/policies.ts) - `MEASURES`, the measures of each kind"
  - "[code://packages/sdk/src/types/usage.ts#L104-L131](../../../../packages/sdk/src/types/usage.ts#L104-L131) - `UsageTotal`, the figures a limit reads"
  - "[code://packages/sdk/test/decide.test.ts](../../../../packages/sdk/test/decide.test.ts) - the draft's setup, which the walk's tests extend"
  - file:///github/ahp-review/prospect/ahp-user-rules.md - the rules draft: \"A charge rule\", \"Limits\", the setup and examples 1 to 30
---

## Objective

`chargeFor` takes an allowed decision and answers whether each measure has a row with room, and the keys the work's records carry.
`limitsOf` answers one row's limits with what is used, `from` and `resets`, which the check and the reads both use.
Nothing here is wired into the host.

## Files

- `CREATE: packages/sdk/src/charge.ts` - `COUNTED`, `keysOf`, `limitsOf`, `chargeFor`, `PayOrder` and the refusal sentence.
- `UPDATE: packages/sdk/src/decide.ts:96-120` - `scoped` is exported, so the walk sorts candidates by scope level with the same reading.
- `UPDATE: packages/sdk/src/types/policies.ts:1-17` - the header no longer says that nothing reads `limits`, `pool` and `cap`.
- `UPDATE: packages/sdk/src/index.ts` - `chargeFor`, `limitsOf` and their types.
- `CREATE: packages/sdk/test/charge.test.ts` - the draft's examples over a `memoryUsage`.

## Steps

1. Write `COUNTED` as `usd`, `tokens` and `calls` for `model`, and `usd`, `tokens` and `turns` for `agent`.
2. Write `keysOf(row, measure, person)` to answer one key per limit of `row` in `measure`.
3. Make the key `policy:<id>/<measure>` for a `shared` limit and `policy:<id>/<measure>/user:<person>` for an `each` limit.
4. Use `pool:<name>` in place of `policy:<id>` when the row names a `pool`.
5. Write `limitsOf(row, usage, zone, now, person?)` to answer each limit with `counted`, `used`, `from` and `resets`.
6. Read `used` as the limit's measure out of `usage.total(key, from, now)`, with `periodOf` from task 01.
7. Answer an `each` limit with no person as `members`, one per `user:` key in `usage.pools()` under the row's prefix.
8. Answer a limit outside `COUNTED` as `counted: false`, with no `used`.
9. Answer `ends` as the row's `until` when it has one.
10. Say a row has room when every counted limit has `used` below `amount`.
11. Write `chargeFor(decision, kind, principal, scope, usage, options)`, with `options` holding `zone`, `payOrder` and `at`.
12. Answer allowed and no keys at once when the decision has no candidates, which is a `*:*` holder.
13. Sort the allowed candidates by scope level: `user:`, then `project:`, then `team:`, then `all`.
14. Within one level, sort by `payOrder`, with ties in the store's order.
15. For `ending`, put the soonest `until` first and rows with no `until` last.
16. For `regular`, put rows with no `until` first, then the soonest `until`.
17. For `extra`, put rows with an `until` first, newest `from` first, then rows with no `until`.
18. Walk each measure in `COUNTED` for the kind on its own, in that order.
19. Stop the walk for the measure at a row with no limits, which takes it and adds no key.
20. Skip a row with no limit in the measure, so the measure keeps walking.
21. Add the keys of a `cap` row in the measure, and refuse when it has no room, and walk on.
22. Add the keys of the first other row in the measure with room, and stop the walk there.
23. Record a measure with no key when every row that limits it has no room.
24. Leave a measure no candidate limits with no key, which is a measure only recorded.
25. Refuse with the first row that closed the walk, the limit that closed it, and the period.
26. Word the refusal as `A3 has no room: 100 / 100 usd this week`, with `in total` for `total`.
27. Answer `{ allowed: true, pools }` with the keys of every measure, without a repeat.
28. Read each row's totals once per call, however many measures read it.

## Validation

- `packages/sdk/test/charge.test.ts`, over the draft's setup with a `memoryUsage` filled to each example's state:
- Examples 1 and 19 charge the row the draft names.
- Example 10 charges M1, which has no limits, and adds no key.
- Examples 2 and 4 charge M4, because `auto` walks the project before the team.
- The draft charges M2 there, through charge rules this plan does not build.
- Example 6 under `auto`: M5 pays the tokens and M2 pays the usd, as the draft says.
- Examples 11 and 12 refuse with `M6 has no room` and the figure that closed it, and 13 allows.
- Example 14: A3 closed by tokens pays no usd, and A2 pays usd.
- Examples 17 and 18: A3 pays usd and tokens with room, and A2 pays usd when A3 is at 100.
- Examples 28, 29 and 30: A6 pays inside its window under `ending`, and A2 after it ends.
- `regular` and `extra` order A3 and A6 as step 16 and step 17 say.
- A `cap` row at its amount refuses, and below it adds its key and the next row pays.
- An `each` limit adds `policy:<id>/<measure>/user:<id>`, and two rows naming one `pool` read one total.
- A `hours` limit reads back `counted: false` and never closes its row.
- `limitsOf` answers `from` and `resets` for a week in `America/Campo_Grande`, and `ends` for a row with `until`.
- `pnpm -s typecheck` and vitest over `packages/sdk` pass.

## Resume

Implemented 2026-10-18, not reviewed.

- `packages/sdk/src/charge.ts` holds `COUNTED`, `keysOf`, `limitsOf`, `chargeFor`, `PayOrder` and the refusal sentence.
- `COUNTED` is `usd`, `tokens` and `calls` for `model`, `usd`, `tokens` and `turns` for `agent`, and nothing for `computer`.
- `keysOf` answers `policy:<id>/<measure>` for `shared`, `policy:<id>/<measure>/user:<id>` for `each`, and `pool:<name>/...` for a row naming a pool.
- `limitsOf` answers each limit with `counted`, `used`, `from`, `resets` and `ends`, and an `each` limit read without a person with `members`.
- `chargeFor` walks each counted measure in `COUNTED` order over the candidates sorted by scope level and then by `payOrder`, which defaults to `ending`.
- `scoped` is exported from `decide.ts`, and the walk filters the decision's candidates with it.
- The index exports `chargeFor`, `COUNTED`, `keysOf`, `limitsOf` and their types.

The first step 23 refused examples 14, 18, 28 and 30, whose validation says another row pays.
Softov chose on 2026-10-18 that another row pays, and step 23 now says so.
A measure whose limiting rows are all closed is recorded with no key.
The walk refuses only when no measure finds a payer.

Tests: `charge.test.ts` is new, 25 cases over the draft's store and a `memoryUsage` filled to each example's state.

