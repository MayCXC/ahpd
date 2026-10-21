---
title: A turn and a proxy call are refused at a limit, and their records carry the keys
status: done
depends: [task-03-the-charge-walk.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/host/owners.ts#L166-L183](../../../../packages/sdk/src/host/owners.ts#L166-L183) - `checked`, which answers a refusal sentence only"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1305-L1335](../../../../packages/sdk/src/host/lifecycle.ts#L1305-L1335) - the turn's own check"
  - "[code://packages/sdk/src/host/machines.ts#L401-L415](../../../../packages/sdk/src/host/machines.ts#L401-L415) - the session's check, which stays without limits"
  - "[code://packages/sdk/src/usage/meter.ts#L193-L197](../../../../packages/sdk/src/usage/meter.ts#L193-L197) - `poolsOf`, the keys a turn's record has today"
  - "[code://packages/sdk/src/usage/meter.ts#L218-L265](../../../../packages/sdk/src/usage/meter.ts#L218-L265) - `write`, where the turn's keys join `pools`"
  - "[code://packages/sdk/src/host/spawn.ts#L577-L588](../../../../packages/sdk/src/host/spawn.ts#L577-L588) - where a session's meter is made"
  - "[code://packages/sdk/src/types/host.ts#L288-L320](../../../../packages/sdk/src/types/host.ts#L288-L320) - `usagePer`, `policies` and `policiesCheck` in `HostOptions`"
  - "[code://packages/server/src/proxy/listener.ts#L371-L385](../../../../packages/server/src/proxy/listener.ts#L371-L385) - `policyFor`, the proxy's check"
  - "[code://packages/server/src/proxy/listener.ts#L668-L700](../../../../packages/server/src/proxy/listener.ts#L668-L700) - `record`, the proxy's usage record"
  - "[code://packages/server/src/config.ts#L70-L80](../../../../packages/server/src/config.ts#L70-L80) - `PoliciesSetting`, where `payOrder` and `ownLimits` go"
  - "[code://packages/server/src/commands/options.ts#L577](../../../../packages/server/src/commands/options.ts#L577) - the `policies` option"
  - "[code://packages/server/src/commands/run.ts#L389](../../../../packages/server/src/commands/run.ts#L389) - the start-up note about an empty store"
  - "[code://packages/sdk/test/policy-checks.test.ts](../../../../packages/sdk/test/policy-checks.test.ts) - the host's policy checks"
---

## Objective

With `policies.check` on, a turn and a proxy call run `chargeFor` after `decide`, and are refused when a measure has no row with room.
Every record of the turn or the call carries the keys the check chose, beside its owner, team and project.

## Files

- `UPDATE: packages/server/src/config.ts:70-80` - `payOrder?: 'ending' | 'regular' | 'extra'` and `ownLimits?: boolean` in `PoliciesSetting`.
- `UPDATE: packages/server/src/commands/options.ts:577` - the two keys of the `policies` block, file only as `check` is.
- `UPDATE: packages/sdk/src/types/host.ts:288-320` - `policiesPayOrder`, `policiesOwnLimits` and `usageTimezone` in `HostOptions`.
- `UPDATE: packages/server/src/commands/run.ts:389` - the start-up note says that limits count usage from now, and the options reach the host and the proxy.
- `UPDATE: packages/sdk/src/host/owners.ts:166-183` - `checked` answers the refusal or the keys.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1305-1335` - the turn's check runs `chargeFor` and keeps the keys by turn id.
- `UPDATE: packages/sdk/src/host/spawn.ts:577-588` - the meter gets `keysOf(turn)`.
- `UPDATE: packages/sdk/src/usage/meter.ts:193-265` - `write` adds the turn's keys to `pools`.
- `UPDATE: packages/server/src/proxy/listener.ts:371-385` - `policyFor` runs `chargeFor` and answers the refusal or the keys.
- `UPDATE: packages/server/src/proxy/listener.ts:668-700` - `record` adds the call's keys to `pools`.
- `UPDATE: packages/sdk/test/policy-checks.test.ts` - a turn refused at a limit, and the keys on its record.
- `UPDATE: packages/server/test/proxy.test.ts` - a call refused at a limit with 403, and the keys on its record.

## Steps

1. Add `payOrder` and `ownLimits` to `PoliciesSetting`, with `ending` and `true` as the defaults the comments name.
2. Declare both in the `policies` option, file only, and pass them to the host and to the proxy.
3. Give the host `usageTimezone`, so the walk cuts the periods the store keeps.
4. Make `checked` answer `{ refusal }` or `{ pools }`, and keep the session's check reading only the refusal.
5. Run `chargeFor` after an allowed `decide` for the turn's `agent` check, and refuse with its sentence.
6. Keep the turn's keys in a map by turn id, and remove them when the meter reports the turn's end.
7. Give the meter `keysOf(turn)`, and add those keys after `poolsOf` in `write`, without a repeat.
8. Run `chargeFor` after an allowed `decide` in `policyFor`, and refuse with 403 and its sentence.
9. Add the call's keys to `pools` in `record`.
10. Add no key when the check is off, with no store, with no person, or for `*:*`.
11. Say once at start, with the check on, that limits count the usage recorded from now.

## Validation

- `packages/sdk/test/policy-checks.test.ts`: the host refuses a turn on a row at its amount with `has no room`, and the session stays.
- `packages/sdk/test/policy-checks.test.ts`: an allowed turn's record has `policy:<id>/usd` and its owner, team and project keys.
- `packages/sdk/test/policy-checks.test.ts`: with `per: 'report'`, every record of the turn has the same keys.
- `packages/sdk/test/policy-checks.test.ts`: with the check off, a record has only its owner, team and project keys.
- `packages/server/test/proxy.test.ts`: a call on a row at its amount answers 403 with the sentence.
- `packages/server/test/proxy.test.ts`: an allowed call's record has the keys.
- The gates of the plan pass.

## Resume

Implemented 2026-10-18, not reviewed.

- `checked` answers `{ refusal }` or `{ pools }`, and only walks the kind it is told to charge.
- The turn's `agent` check runs `chargeFor`; the session's check reads the refusal only.
- The turn's keys are kept by turn id, moved when a queued message becomes a turn, and let go when the turn ends.
- The meter reads `keysOf(turn)` for every record, so `per: 'report'` charges each report the same way.
- The proxy's `policyFor` walks each candidate entry and answers its keys; `record` adds them after owner, team and project.
- `policies.payOrder` and `policies.ownLimits` are file only; `usage.timezone` reaches the host and the proxy.
- The start-up note says limits count the usage recorded from now.

Open question: the Files name `packages/server/test/proxy.test.ts`, which does not exist.
The proxy cases are in `packages/server/test/proxy-policy-usage.test.ts`, which already holds the proxy's policy and usage cases.

The proxy resolves `usage.timezone` with its own `zoneOf`, because `@ahpd/sdk` does not export one.

`packages/sdk/test/fixtures/wire.jsonl` is dirty because the sdk suite rewrites it.
Restore it with `git restore packages/sdk/test/fixtures/wire.jsonl`.

Tests: the sdk suite passed 157 files and 3067 tests, and the server suite passed 55 files and 1122 tests.
