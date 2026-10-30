---
title: A limit counts per minute - implemented
date: 2026-10-29
refs:
  - git://fefecddc
  - "[code://packages/sdk/src/types/policies.ts](../../../../packages/sdk/src/types/policies.ts)"
  - "[code://packages/sdk/src/usage/minute.ts](../../../../packages/sdk/src/usage/minute.ts)"
  - "[code://packages/sdk/src/usage/charge.ts](../../../../packages/sdk/src/usage/charge.ts)"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts)"
---

A policy row or a key can limit a minute: so many calls a minute, or so many tokens a minute.
The window is the minute of the clock in UTC.
A `calls` limit counts a call when it is allowed, so a burst of calls cannot pass one.
A `tokens`, `usd` or `hours` limit counts a record when the store keeps it.
The totals are kept in memory, so a restart starts every minute count at zero.

## What was built

- [`code://packages/sdk/src/types/policies.ts`](../../../../packages/sdk/src/types/policies.ts) - `Period` gets `minute`.
- [`code://packages/sdk/src/access/policies.ts`](../../../../packages/sdk/src/access/policies.ts) - `PERIODS` lists `minute` first, so a check takes it and a policy form offers it.
- [`code://packages/sdk/src/usage/periods.ts`](../../../../packages/sdk/src/usage/periods.ts) - `minuteOf` names the minute of an instant, and `periodOf` answers a minute from the UTC minute of `now`, with `resets` a minute later.
- [`code://packages/sdk/src/usage/minute.ts`](../../../../packages/sdk/src/usage/minute.ts) - `createMinuteMeter`: `add` and `sum`, over two buckets per key, the current minute and the one before it. An add in a newer minute turns the buckets and drops anything older than the minute before. A record that arrives late counts in the minute it is in, and a record for a minute already turned is dropped rather than moving the window back.
- [`code://packages/sdk/src/usage/usage.ts`](../../../../packages/sdk/src/usage/usage.ts) - `fileUsage` takes an optional `meter`, and `record` adds the record's `usd`, `tokens` and `hours` to each pool key that ends in one of them.
- [`code://packages/sdk/src/usage/charge.ts`](../../../../packages/sdk/src/usage/charge.ts) - `ChargeOptions` and `limitsOf` take the meter. A `minute` limit reads `meter.sum(key, now)`, and answers 0 with no meter. An allowed `chargeFor` adds 1 to each `calls` and `turns` key in its pools. A refusal for a minute limit says `this minute`.
- [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) and [`code://packages/sdk/src/host/owners.ts`](../../../../packages/sdk/src/host/owners.ts) - `HostOptions` takes the meter, and the turn check passes it to the walk.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - `ProxyOptions` takes the meter, and `policyFor` passes it to the walk.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the daemon makes one meter and gives it to `fileUsage`, the host and the proxy.
- [`code://packages/sdk/src/index.ts`](../../../../packages/sdk/src/index.ts) - exports `createMinuteMeter` and `MinuteMeter`.
- `docs/sdk/POLICY.md` names `minute` among the periods and says how each measure is counted in it; `docs/server/PROXY.md` names a minute limit in what a 403 means.

## Verified

- `pnpm exec tsc -p tsconfig.json --noEmit` passes.
- `packages/sdk/test/minute-meter.test.ts` has 6 cases: two adds sum, a key starts at zero in the next minute and keeps the one before it, an idle key is dropped, a late record counts in the minute it is in and never turns the window back, an unknown key is zero, and `periodOf` cuts a minute in UTC.
- `packages/sdk/test/usage.test.ts` has a case where a record charged to `policy:a/tokens`, `policy:a/calls` and `policy:a/usd` adds its tokens and cost to the first two and nothing to the calls key.
- `packages/sdk/test/charge.test.ts` has 5 cases for a minute limit: two calls then a refusal with `this minute`, a call in the next minute, every call without a meter, a tokens limit read from the meter rather than the day, and a minute figure with its `from` and `resets`.
- `packages/sdk/test/policy-checks.test.ts` takes `minute` for a key's `calls` and `tokens` limits.
- `packages/server/test/proxy-policy-usage.test.ts` allows two calls a minute and refuses the third in the same minute with `burst has no room: 2 / 2 calls this minute`.
- The full suite passes with `pnpm exec vitest run --maxWorkers=3 --testTimeout=30000` after `pnpm -s schema`: 460 files passed and 1 skipped, 7676 tests passed and 29 skipped.

## Departures from the plan

- `HostOptions` in `packages/sdk/src/types/host.ts` and `ProxyOptions` in `packages/server/src/proxy/listener.ts` each take the meter, which the Files list did not name; the walk a turn and a call run needs the meter to reach it.
- `refusalOf` needed no change: it already says `this <period>` for every period but `total`.

## Left for later

- The two limit reads, `policy://<id>/limits` and `usage://limits`, hold no meter, so a `minute` limit answers `used: 0` there. A read that answers the same figure as the walk needs a meter too.
- The proxy walks every entry of a name that speaks its dialect, so a model with two such entries adds 2 to a `calls` minute limit for one request.
- A sliding minute window is the idea `sliding-minute-window`.
- Two daemons over one usage folder keep two meters, so a minute total is not shared between them.
