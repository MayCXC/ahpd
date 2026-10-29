---
title: The copy is deleted after the agents stop
status: pending
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L246-L256](../../../../packages/sdk/src/host/lifecycle.ts#L246-L256) - `teardown`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L631-L633](../../../../packages/sdk/src/host/lifecycle.ts#L631-L633) - `removeSession`"
  - "[code://packages/sdk/test/session-delete.test.ts](../../../../packages/sdk/test/session-delete.test.ts) - the case"
---

## Objective

`teardown` answers once every chat's close has settled.
`removeSession` waits for that before it asks the backend for its copy.

## Files

- `UPDATE: packages/sdk/src/host/lifecycle.ts:238-256` - `teardown` collects the closes and answers them.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:631` - `removeSession` awaits the teardown.
- `UPDATE: packages/sdk/test/session-delete.test.ts` - add the case.

## Steps

1. Add a case whose agent writes the CLI's last lines into its copy as its close settles.
2. Make the case expect no copy after the disposal, and see it fail.
3. Collect each chat's close in `teardown`, each failure caught, and answer them.
4. Await the teardown in `removeSession` before `deleted`.
5. Run the case again, and see it pass.

## Validation

- Run `session-delete.test.ts` before steps 3 and 4, and see the new case fail.
- Run it after step 4, and see every case pass.

## Resume

Not started.
