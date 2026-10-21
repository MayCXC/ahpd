---
title: A client reads each limit with its amount, what is used and when it resets
status: done
depends: [task-03-the-charge-walk.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/access/policy.ts#L118-L182](../../../../packages/sdk/src/access/policy.ts#L118-L182) - the `policy:` records, provider and channel"
  - "[code://packages/sdk/src/resources/records.ts#L194-L240](../../../../packages/sdk/src/resources/records.ts#L194-L240) - `recordsProvider`, which refuses a leaf today"
  - "[code://packages/sdk/src/usage/usage.ts#L640-L660](../../../../packages/sdk/src/usage/usage.ts#L640-L660) - `refused` and `mayRead`, who may read which pool"
  - "[code://packages/sdk/src/usage/usage.ts#L800-L830](../../../../packages/sdk/src/usage/usage.ts#L800-L830) - `body`, the leaves of `usage://`"
  - "[code://packages/sdk/src/access/decide.ts#L96-L120](../../../../packages/sdk/src/access/decide.ts#L96-L120) - `scoped`, how a row's scope holds a person"
  - "[code://packages/server/src/commands/run.ts#L860-L875](../../../../packages/server/src/commands/run.ts#L860-L875) - where the usage scheme is made"
  - "[code://packages/sdk/test/policy-scheme.test.ts](../../../../packages/sdk/test/policy-scheme.test.ts) - the `policy:` scheme's tests"
  - "[code://packages/sdk/test/usage-scheme.test.ts](../../../../packages/sdk/test/usage-scheme.test.ts) - the `usage:` scheme's tests"
---

## Objective

`policy://<id>/limits` answers one row's limits with `limitsOf`, every member of an `each` limit included, to a reader with `policy:read`.
`usage://limits` answers each row whose scope holds the reader, with only the reader's own `each` figure, while `policies.ownLimits` is on.

## Files

- `UPDATE: packages/sdk/src/access/policy.ts:118-182` - the provider answers the `limits` leaf of a row.
- `UPDATE: packages/sdk/src/usage/usage.ts:800-830` - the `limits` leaf of `usage://`, and the policies store, the zone and the switch in `UsageProviderOptions`.
- `UPDATE: packages/server/src/commands/run.ts:860-875` - the usage scheme gets the policies store and `ownLimits`.
- `UPDATE: packages/sdk/test/policy-scheme.test.ts` - the `limits` leaf.
- `UPDATE: packages/sdk/test/usage-scheme.test.ts` - `usage://limits` on and off.

## Steps

1. Wrap the `policy:` provider so a read of `policy://<id>/limits` answers `{ id, kind, scope, limits }`, with each limit from `limitsOf`.
2. Answer `-32008` for a row that is not there, and keep every other leaf refused as it is.
3. Answer every member of an `each` limit there, because the reader holds `policy:read`.
4. Answer `usage://limits` as a list of the same shape, for each active row whose scope holds the reader.
5. Hold a row when its scope is `all`, the reader, or a team or project of the reader.
6. Answer an `each` limit in `usage://limits` with the reader's own figure only, as `used`.
7. Refuse `usage://limits` with `-32008` and a sentence when `ownLimits` is off.
8. Answer `usage://limits` as `[]` to a reader with no person, which is root or a host with no users.
9. Give the usage scheme the policies store, the zone and `ownLimits` in `run.ts`.

## Validation

- `packages/sdk/test/policy-scheme.test.ts`: `policy://A2/limits` answers the amount, `used`, `from` and `resets` of each limit, and two members of an `each` limit.
- `packages/sdk/test/policy-scheme.test.ts`: a `total` limit has no `resets`, and a row with `until` has `ends`.
- `packages/sdk/test/usage-scheme.test.ts`: alice reads the rows that hold her, with her own `each` figure and not bob's.
- `packages/sdk/test/usage-scheme.test.ts`: with `ownLimits` off, the scheme refuses `usage://limits`.
- The gates of the plan pass.

## Resume

Implemented 2026-10-18, not reviewed.

- `policy.ts` wraps the provider so `policy://<id>/limits` answers `{ id, kind, scope, limits }` from `limitsOf`.
- An `each` limit there answers every member, because the reader holds `policy:read`.
- The leaf resolves as a file and reads as JSON; every other leaf is refused as before.
- A row that is not there answers `-32008`, and a host with no usage store serves no leaf.
- `usage.ts` answers `usage://limits` with each active row whose scope holds the reader.
- An `each` limit there answers the reader's own figure as `used`, and never `members`.
- A reader with no person reads `[]`, and `policies.ownLimits` off refuses the read with `-32008`.
- `run.ts` gives the policy scheme the usage store and the zone, and the usage scheme the policies store.
- A row whose `from` or `until` puts it outside now is not read.

Open question: step 9 needs the `policies.ownLimits` key from the configuration.
`config.ts` and `options.ts` are not in Files, and they hold the key.
`run.ts` passes `ownLimits: true`, the default, until task 04 adds it.
That task's step 1 adds both `payOrder` and `ownLimits` to `PoliciesSetting`.

Tests: `policy-scheme.test.ts` and `usage-scheme.test.ts` each gained one case.
The gates pass: schema, build, typecheck, boundary and vitest over `packages/sdk` and `packages/server`.
