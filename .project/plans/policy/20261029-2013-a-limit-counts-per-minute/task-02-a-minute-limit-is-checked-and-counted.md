---
title: A minute limit is checked and counted
status: implemented
depends: [task-01-a-minute-is-a-period-with-a-meter.md]
layer: "sdk, server, docs"
refs:
  - "[code://packages/sdk/src/usage/charge.ts](../../../../packages/sdk/src/usage/charge.ts) - `limitsOf` and `chargeFor`"
  - "[code://packages/server/src/proxy/listener.ts](../../../../packages/server/src/proxy/listener.ts) - `policyFor`, which passes the meter"
---

## Objective

A `minute` limit reads its total from the meter, and a row out of room in this minute refuses with `this minute`.
An allowed call adds 1 to each `calls` and `turns` key it is charged to, before the call starts.

## Files

- `UPDATE: packages/sdk/src/usage/charge.ts:47-60` - `ChargeOptions` gets `meter`.
- `UPDATE: packages/sdk/src/usage/charge.ts:161-200` - `limitsOf` reads a `minute` limit from the meter, and answers `used: 0` when there is no meter.
- `UPDATE: packages/sdk/src/usage/charge.ts:253-264` - `refusalOf` says `this minute` for a `minute` limit.
- `UPDATE: packages/sdk/src/usage/charge.ts:283-363` - an allowed `chargeFor` adds 1 to the meter for each `calls` and `turns` key in its pools.
- `UPDATE: packages/server/src/proxy/listener.ts:509-565` - `policyFor` passes the meter to `chargeFor`.
- `UPDATE: packages/server/src/commands/run.ts:428` - the daemon makes one meter and gives it to the usage store, the proxy and the turn check.
- `UPDATE: packages/sdk/src/host/owners.ts:247` - the turn check passes the meter to `chargeFor`.
- `UPDATE: packages/sdk/test/charge.test.ts` - the minute limit.
- `UPDATE: packages/server/test/proxy-policy-usage.test.ts` - two calls a minute.
- `UPDATE: docs/sdk/POLICY.md` - "The row" and "How a limit is counted" name `minute`.
- `UPDATE: docs/server/PROXY.md` - "What a refusal means" names a minute limit.

## Steps

1. Add `meter` to `ChargeOptions` and to the options `limitsOf` takes.
2. In `limitsOf`, read `meter.sum(key, now)` for a `minute` limit, in place of the store's total.
3. Make `refusalOf` say `this minute` for a `minute` limit.
4. When `chargeFor` allows, add 1 to the meter for each pool key that ends in `/calls` or `/turns`.
5. In `run.ts`, make one meter beside `fileUsage`, and pass it to the store and the proxy options.
6. Pass the same meter to the host options that reach the turn check in `owners.ts`.
7. Write the tests and the docs.

## Validation

- `charge.test.ts`: with `2 calls a minute`, two allowed walks fill it and the third is refused with `this minute`.
- `charge.test.ts`: the walk one minute later is allowed; a walk with no meter is allowed.
- `proxy-policy-usage.test.ts`: two proxy calls pass and the third in the same minute is 403.
- Run `pnpm typecheck` and `pnpm test`.

## Resume

- **Done so far:** `ChargeOptions` and `limitsOf` take a `meter`, and a `minute` limit reads `meter.sum(key, now)`, or 0 with no meter. `refusalOf` already said `this minute`, because it says `this <period>` for every period but `total`. An allowed `chargeFor` adds 1 to each `calls` and `turns` key in its pools. `HostOptions` and the proxy's options take the meter, and `owners.ts` and `policyFor` pass it to the walk. `run.ts` makes one meter and gives it to `fileUsage`, the host and the proxy.
- **Next action:** none; the plan's final verification checklist is next.
- **Files:** `packages/sdk/src/usage/charge.ts`, `packages/sdk/src/types/host.ts`, `packages/sdk/src/host/owners.ts`, `packages/server/src/proxy/listener.ts`, `packages/server/src/commands/run.ts`, `packages/sdk/test/charge.test.ts`, `packages/server/test/proxy-policy-usage.test.ts`, `docs/sdk/POLICY.md`, `docs/server/PROXY.md`, this task file and the plan.
- **Open questions:** none.
- **Departures:** `HostOptions` in `packages/sdk/src/types/host.ts` and `ProxyOptions` in `listener.ts` each take the meter, which the Files list did not name. `refusalOf` needed no edit. The two limit reads, `policy://<id>/limits` and `usage://limits`, hold no meter, so a `minute` limit answers `used: 0` there.
- **Watch out for:** the meter is given to the store and to the walk, so a `tokens` minute limit reads the records the store keeps. `usage://limits` and `policy://<id>/limits` answer 0 for a minute limit until a read is given the meter too.

