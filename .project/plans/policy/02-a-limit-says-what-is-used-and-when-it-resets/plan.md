---
title: A limit says how much it allows, how much is used and when it resets, and a turn or a proxy call is refused when no row has room
domain: policy
status: active
priority: high
created: 2026-10-17
revalidated: 2026-10-17
requires:
  - plans/policy/01-a-policy-says-who-may-use-what/plan.md
  - plans/usage/02-a-turn-writes-what-it-used/plan.md
changes: []
creates: []
decisions:
  - decisions/a-limit-counts-the-records-tagged-with-its-key.md
refs:
  - "[code://packages/sdk/src/decide.ts#L157-L200](../../../../packages/sdk/src/decide.ts#L157-L200) - `decide`, which answers the candidates the charge walk starts from and reads no limit"
  - "[code://packages/sdk/src/types/policies.ts#L66-L98](../../../../packages/sdk/src/types/policies.ts#L66-L98) - `PolicyLimit` and `Policy`: `limits`, `pool` and `cap`, stored and read by nobody"
  - "[code://packages/sdk/src/types/usage.ts#L63](../../../../packages/sdk/src/types/usage.ts#L63) - `pools`, the opaque keys a record is charged to"
  - "[code://packages/sdk/src/types/usage.ts#L104-L131](../../../../packages/sdk/src/types/usage.ts#L104-L131) - `UsageTotal`, which has no turn count"
  - "[code://packages/sdk/src/usage.ts#L137-L330](../../../../packages/sdk/src/usage.ts#L137-L330) - `fileUsage`: running totals per key and per UTC day"
  - "[code://packages/sdk/src/usage.ts#L566-L640](../../../../packages/sdk/src/usage.ts#L566-L640) - `shown`, `startOfDay`, `mondayOf` and `firstOf`, the zoned periods of the usage scheme"
  - "[code://packages/sdk/src/usage.ts#L766-L770](../../../../packages/sdk/src/usage.ts#L766-L770) - `spansOf`, the day, week and month a pool is read over"
  - "[code://packages/sdk/src/meter.ts#L193-L197](../../../../packages/sdk/src/meter.ts#L193-L197) - `poolsOf`, the owner, team and project keys a turn's record has today"
  - "[code://packages/sdk/src/meter.ts#L218-L265](../../../../packages/sdk/src/meter.ts#L218-L265) - `write`, the one place a turn's record is made"
  - "[code://packages/sdk/src/host/spawn.ts#L577-L588](../../../../packages/sdk/src/host/spawn.ts#L577-L588) - where a session's meter is made"
  - "[code://packages/sdk/src/host/owners.ts#L166-L183](../../../../packages/sdk/src/host/owners.ts#L166-L183) - `checked`, which runs `decide` and answers a refusal sentence"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1305-L1335](../../../../packages/sdk/src/host/lifecycle.ts#L1305-L1335) - the turn's own check"
  - "[code://packages/server/src/proxy/listener.ts#L371-L385](../../../../packages/server/src/proxy/listener.ts#L371-L385) - `policyFor`, the proxy's check"
  - "[code://packages/server/src/proxy/listener.ts#L668-L700](../../../../packages/server/src/proxy/listener.ts#L668-L700) - `record`, the proxy's usage record"
  - "[code://packages/sdk/src/policy.ts#L118-L182](../../../../packages/sdk/src/policy.ts#L118-L182) - the `policy:` records, provider and channel"
  - "[code://packages/server/src/config.ts#L70-L80](../../../../packages/server/src/config.ts#L70-L80) - `PoliciesSetting`, the `policies` block with `check`"
  - "[code://packages/server/src/commands/run.ts#L348](../../../../packages/server/src/commands/run.ts#L348) - where the daemon makes its usage store"
  - "[code://packages/server/src/commands/run.ts#L872](../../../../packages/server/src/commands/run.ts#L872) - where `usage.timezone` reaches the usage scheme"
  - "[code://docs/sdk/POLICY.md#L136-L140](../../../../docs/sdk/POLICY.md#L136-L140) - \"What this does not yet enforce\""
  - file:///github/ahp-review/prospect/ahp-user-rules.md - the rules draft: the charge walk, `shared` and `each`, `pool`, `cap`, the examples
---

## Goal

A policy's limits are enforced for proxy calls and agent turns.
The check walks the rows that can pay, refuses when none has room, and names the row and the figures.
Each record of the work carries the keys of the rows that pay for it.
A client reads each limit with its amount, what is used and when it resets.
An operator with `policy:read` sees every row, and a person sees the limits that apply to them.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "limits|cap|pool" packages/sdk/src/decide.ts` - `decide` reads none of them.
- `rg -n "pools" packages/sdk/src/meter.ts packages/server/src/proxy/listener.ts` - a record names its owner, team and project, and no policy.
- `rg -n "today|slice\(0, 10\)" packages/sdk/src/usage.ts` - the store keeps its totals per UTC day.
- `rg -n "kind: 'computer'" packages` - only the computer plugin writes machine time, when a machine stops.

### Runtime path

```
turn starts -> checked() -> decide() -> [new] chargeFor(): walk, room, keys -> turn runs
  -> meter.write() -> record.pools = owner, team, project + [new] the turn's keys -> usage.total(key)
proxy call -> policyFor() -> decide() -> [new] chargeFor() -> record(): pools + [new] the keys
policy://<id>/limits, usage://limits -> [new] limitsOf(): amount, used, from, resets
```

### Gaps

- No record carries a policy key, so no limit has a total.
- The store cuts its days in UTC, so a week in `usage.timezone` counts a few hours of the week before.
- No total counts turns, and `calls` counts records, which is several per turn with `per: 'report'`.
- No read answers a limit with what is used and when it resets.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A limit counts the records tagged with its key when they were written](../../../decisions/a-limit-counts-the-records-tagged-with-its-key.md) | Softov, 2026-10-17 |

| What | Source | Task |
| --- | --- | --- |
| Every person is charged in the `auto` order, which is their own rows, then the project, then the team, then `all`, with `any` | Softov, 2026-10-02, "Most specific first"; Softov, 2026-10-17, asked whether charge rules are built here: "auto now, own plan" | 03 |
| A charge rule of a person's own, and a team default, are a later plan | Softov, 2026-10-17, "auto now, own plan" | - |
| Within one scope, `policies.payOrder` says which row pays first: `ending` (soonest `until` first, rows with none last), `regular` (rows with no `until` first), `extra` (rows with an `until` first, newest `from` first); the default is `ending` | Softov, 2026-10-17, asked "When several rows of one scope can pay, which pays first?": "Setting, default ending" | 03, 04 |
| Policy 02 counts `usd`, `tokens` and `calls` for `model` rows, and `usd`, `tokens` and `turns` for `agent` rows | Softov, 2026-10-17, asked where hours and sessions go: "Policy 03" | 02, 03 |
| Machine `hours`, open `sessions` and agent work `hours` are policy 03, with the cancel during a turn and the computer run-out | Softov, 2026-10-17, "Policy 03" | - |
| A limit in a measure this plan does not count is stored, never closes its row, and reads back as `counted: false` | (defaulted: a limit nothing counts cannot say it is out) | 03, 05 |
| `policy:read` reads every row's limits with every member, and a person reads the limits whose scope holds them, with only their own `each` figure, when `policies.ownLimits` is on, which is the default | Softov, 2026-10-17, asked "Who may read a policy's limits with used and reset?": "policy:read with a host config to enable see its own, default on" | 05 |
| The check walks each measure on its own: a row with no limits takes every measure, a row with no limit in a measure is skipped for it, a closed row spills to the next, and a `cap` row is counted and never pays | the rules draft, "A charge rule", "Answered 2026-10-01" | 03 |
| A row has room only while every counted limit has room, so a row closed in one measure pays no other measure | the rules draft, "Limits", example 14 | 03 |
| A measure whose limiting rows are all closed is recorded with no key, and the walk refuses only when no measure finds a payer | Softov, 2026-10-18, asked whether A2 pays when A3 closes: "Yes, A2 pays" | 03 |
| The keys are `policy:<id>/<measure>` for `shared`, `policy:<id>/<measure>/user:<id>` for `each`, and `pool:<name>/...` for a row that names a `pool` | [the decision](../../../decisions/a-limit-counts-the-records-tagged-with-its-key.md) | 03 |
| The check is before the work and the record after it, so two turns that start together can both go past the amount | the rules draft, "Answered 2026-10-01" | 03, 04 |
| A period begins at 00:00 in `usage.timezone`: the day, the week on Monday, the month on the 1st, and resets at the next one; `total` counts from the row's `from` and never resets | the rules draft, "Answered 2026-10-01"; [code://packages/sdk/src/usage.ts#L766-L770](../../../../packages/sdk/src/usage.ts#L766-L770) | 01, 03 |
| The store keeps its days in `usage.timezone`, so a period's total holds no hours of the period before | (defaulted: a limit that counts the wrong hours is wrong at every reset) | 01 |
| A record counts one turn when it is the first record the meter writes for that turn | (defaulted: `calls` counts each report with `per: 'report'`) | 02 |
| The limits are checked at each turn and each proxy call, and not at a session's creation | (defaulted: a session spends nothing until its first turn) | 04 |
| A refusal names the row and the figure that closed it, as `A3 has no room: 100 / 100 usd this week` | the rules draft, examples 11 and 12 | 03 |
| Every record of a turn carries the keys its check chose, and the cost is not split across rows during a turn | the rules draft, "During a turn", which policy 03 builds | 04 |
| A turn whose check is off, or whose person is root or `*:*`, carries no policy key | the rules draft, "Root and `*:*` holders are never limited" | 04 |

## Proposed architecture

- **Data flow** - the check answers the keys, the turn keeps them, and the meter and the proxy add them to the record's `pools`.
- **Event flow** - nothing new: a record is written when it is written today, and a total includes it once it settles.
- **State flow** - the store keeps one running total per key and per day in `usage.timezone`; nothing else is kept.
- **Layer responsibilities** - sdk: the periods, the charge walk, the keys, the turn's check, the meter, the reads · server: the settings, the proxy's check and record.
- **Source-of-truth files** - `packages/sdk/src/charge.ts` (new, beside `decide.ts`) and `packages/sdk/src/periods.ts` (new, out of `usage.ts`).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The periods are one module, and the store keeps its days in the usage timezone](task-01-the-store-keeps-its-days-in-the-usage-timezone.md) | implemented | - |
| [02 - A total counts the turns](task-02-a-total-counts-the-turns.md) | implemented | - |
| [03 - The charge walk says which rows pay, whether they have room, and their keys](task-03-the-charge-walk.md) | implemented | 01, 02 |
| [04 - A turn and a proxy call are refused at a limit, and their records carry the keys](task-04-a-turn-and-a-proxy-call-are-charged.md) | todo | 03 |
| [05 - A client reads each limit with its amount, what is used and when it resets](task-05-a-client-reads-each-limit.md) | todo | 03 |
| [06 - The docs say what a limit counts and how a client reads it](task-06-the-docs-say-what-a-limit-counts.md) | todo | 04, 05 |

## Risks and tradeoffs

- Usage recorded before this plan has no policy keys, so every limit starts at zero - the daemon says so once at start.
- With the default `per: 'turn'`, what is used moves only when a turn ends - a long turn can pass its amount, and policy 03 cancels it.
- Two turns that start together can both pass the amount - the rules draft accepts it.
- An `each` limit lists the members it has keys for - a member who used nothing is not listed and has used zero.
- Keys grow with rows times measures times members - the totals are kept per day, as they are today.

## Resume state

- **Done so far:** 2026-10-18, tasks 01, 02 and 03 are implemented.
- **Next action:** [task-04-a-turn-and-a-proxy-call-are-charged.md](task-04-a-turn-and-a-proxy-call-are-charged.md).
- **Open questions:** none.
- **Watch out for:** `decide` stays the four steps of policy 01, and the walk takes its candidates.
  A policy key is never written when the check is off.
  The store and the provider must have the same zone, and `run.ts` and `ahpd usage` give it to both.
  With two zones, the store and the provider count different days.

## Final verification checklist

- [ ] The tests of task 03 hold the rules draft's examples that this plan counts.
- [ ] A week's total in `America/Campo_Grande` holds no record from Sunday 20:00 local.
- [ ] `policy://<id>/limits` and `usage://limits` answer the amount, the used figure, `from` and `resets`.
- [ ] Off by default: with `policies.check` off, no record carries a policy key and nothing is refused.
- [ ] `node tools/schema.mjs`, `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and vitest pass.
- [ ] `plans/index.md` updated.
