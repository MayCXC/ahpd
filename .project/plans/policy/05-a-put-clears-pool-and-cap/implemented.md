---
title: A put clears pool and cap, and a client imports the limits type - implemented
date: 2026-10-19
refs:
  - git://d6cab489
  - "[code://packages/sdk/src/policies.ts](../../../../packages/sdk/src/policies.ts) - `checkPolicy`, which reads `null` for `pool` and `cap` as absent"
  - "[code://packages/sdk/src/index.ts](../../../../packages/sdk/src/index.ts) - the type export of `PolicyLimits`"
---

A put to `policy://<id>` removes a row's `pool` or `cap` when the body sends `null`, as it already did for `from`, `until` and `limits`.
A client imports `PolicyLimits` from `@ahpd/sdk` to type what `policy://<id>/limits` answers.

## What was built

- [`code://packages/sdk/src/policies.ts`](../../../../packages/sdk/src/policies.ts) - `checkPolicy` takes `null` for `pool` and `cap`, and the row it answers leaves the field out.
- [`code://packages/sdk/src/policy.ts`](../../../../packages/sdk/src/policy.ts) - the manifest takes `null` for every field the check reads it for, so a form does not refuse a body the host accepts.
- [`code://packages/sdk/src/index.ts`](../../../../packages/sdk/src/index.ts) - `PolicyLimits` is exported beside `PolicyChannels` and `PolicyProvider`.
- [`code://docs/sdk/POLICY.md`](../../../../docs/sdk/POLICY.md) - The scheme says a field sent as `null` is removed, and names the fields.

## Verified

- `packages/sdk/test/policy-scheme.test.ts`: `removes a pool and a cap a put sends as null` reads the row back after each write.
- `packages/sdk/test/policy-scheme.test.ts`: `still refuses a pool that is not a string or null, and a cap that is not a boolean`.
- `packages/sdk/test/policy-scheme.test.ts`: the last assertions of `accepts each kind's own body and refuses a choice the kind does not take` cover the manifest.
- `pnpm -s typecheck`, `pnpm boundary` and `node tools/schema.mjs` passed for task 02.
- Softov reviewed tasks 01 and 02 on 2026-10-19.

## Departures from the plan

- The manifest also takes `null` for `from`, `until`, `limits` and the lists under `match`. Task 01 step 3 named only `pool` and `cap`, but the check already read `null` for the others.

## Left for later

- A release of `@ahpd/sdk` with the export waits for Softov's call.
