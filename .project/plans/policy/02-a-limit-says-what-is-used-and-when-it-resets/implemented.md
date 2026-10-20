---
title: A limit says how much it allows, how much is used and when it resets - implemented
date: 2026-10-19
refs:
  - git://25c95a4d
  - git://48d40cd9
  - "[code://packages/sdk/src/charge.ts](../../../../packages/sdk/src/charge.ts) - the charge walk"
  - "[code://packages/sdk/src/periods.ts](../../../../packages/sdk/src/periods.ts) - the periods of a limit in `usage.timezone`"
---

A policy's limits are enforced for agent turns and proxy calls when `policies.check` is on.
The charge walk picks the rows that pay, refuses when none has room, and names the row and the figure.
Each usage record carries the keys of the rows that pay for it.
A client reads each limit with its amount, what is used, `from` and `resets`.

## What was built

- [`code://packages/sdk/src/periods.ts`](../../../../packages/sdk/src/periods.ts) - `periodOf`, the start and reset of a day, a week and a month in one zone.
- [`code://packages/sdk/src/usage.ts`](../../../../packages/sdk/src/usage.ts) - `fileUsage` keeps its days in `usage.timezone`, and a total counts `turns`.
- [`code://packages/sdk/src/meter.ts`](../../../../packages/sdk/src/meter.ts) - the first record of a turn carries `opens`, and every record of a turn carries the turn's policy keys.
- [`code://packages/sdk/src/charge.ts`](../../../../packages/sdk/src/charge.ts) - the walk over `shared` and `each`, `pool`, `cap`, `payOrder` and the windows of a row.
- [`code://packages/sdk/src/host/owners.ts`](../../../../packages/sdk/src/host/owners.ts) - `checked` answers a refusal or the keys, and the turn's check charges the turn.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - the proxy walks each candidate entry, answers 403 at a limit, and adds the keys to its record.
- [`code://packages/sdk/src/policy.ts`](../../../../packages/sdk/src/policy.ts) - `policy://<id>/limits`, and `usage://limits` for the limits that hold the reader, behind `policies.ownLimits`.
- `docs/sdk/POLICY.md`, `docs/sdk/USAGE.md` and `docs/sdk/HOST.md` say what a limit counts, the policy keys, `payOrder`, `ownLimits` and the store's days.

## Verified

- `packages/sdk/test/periods.test.ts`: each period's start and reset across a month's end and a year's end.
- `packages/sdk/test/usage.test.ts`: `keeps a record of Sunday evening out of the week that begins on Monday` and `counts a turn once, by the record that opened it`.
- `packages/sdk/test/usage-meter.test.ts`: `writes one record per report where the host was asked for that` and `writes the reports of a turn that never said it began, per report`.
- `packages/sdk/test/charge.test.ts`: 25 cases, with the rules draft's examples 1, 2, 4, 6, 10 to 14, 17 to 19 and 28 to 30.
- `packages/sdk/test/policy-checks.test.ts`: `refuses the turn at the amount, and leaves the session standing`, and the keys per turn, per report and with the check off.
- `packages/server/test/proxy-policy-usage.test.ts`: `refuses a call on a row at its amount, with the limit sentence, without touching a provider`, and the keys on an allowed call.
- `packages/sdk/test/policy-scheme.test.ts`: `reads a row's limits with what is used and when they reset`.
- `packages/sdk/test/usage-scheme.test.ts`: `answers each limit whose scope holds the reader, with their own each figure`, and the refusal with `ownLimits` off.
- Task 04's run: the sdk suite passed 157 files and 3067 tests, and the server suite passed 55 files and 1122 tests.
- Softov reviewed tasks 01 to 06 on 2026-10-19.

## Departures from the plan

- The proxy cases are in `packages/server/test/proxy-policy-usage.test.ts`. Task 04 named `packages/server/test/proxy.test.ts`, which does not exist.
- `policies.payOrder`, `policies.ownLimits` and the store's days are in `HOST.md`, not `docs/server/REFERENCE.md`. That page is generated from the built server.
- The generated `usage` text now says the store keeps its days in `usage.timezone`. Commit `48d40cd9` changed it in `options.ts` and `config.ts`, outside the tasks.
- The proxy resolves `usage.timezone` with its own `zoneOf`, because `@ahpd/sdk` does not export one.
- Examples 2 and 4 charge M4, not M2 as the draft says, because this plan builds no charge rules.

## Left for later

- Policy 03 cancels a long turn that passes its amount. With `per: 'turn'`, the used figure moves only when a turn ends.
