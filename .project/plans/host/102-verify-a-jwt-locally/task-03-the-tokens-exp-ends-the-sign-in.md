---
title: The token's exp ends the sign-in
status: todo
depends: [task-02-the-directory-asks-the-issuer-iss-names.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L67-L108](../../../../packages/sdk/src/host/handshake.ts#L67-L108) - `expiring` and `expire`"
  - "[code://packages/sdk/src/host/handshake.ts#L564-L610](../../../../packages/sdk/src/host/handshake.ts#L564-L610) - `expiresIn` and `principalUntil`"
  - "[code://packages/sdk/src/types/host.ts#L934](../../../../packages/sdk/src/types/host.ts#L934) - `principalUntil`"
  - "[code://packages/sdk/src/host/admission.ts#L353-L378](../../../../packages/sdk/src/host/admission.ts#L353-L378) - the `-32007` answer"
---

## Objective

A sign-in with a JWT ends at the earlier of the token's `exp` and the client's `expiresIn`.

## Files

- `UPDATE: packages/sdk/src/host/handshake.ts:585-610` - set `principalUntil` from the expiry of the principal.
- `UPDATE: packages/sdk/src/types/users.ts:40-60` - `Principal` carries an optional expiry.
- `UPDATE: packages/sdk/test` - a connection whose token expires gets `auth/required` with `expired`.

## Steps

1. Read the expiry from the principal that `verify` returns.
2. Set `principalUntil` to the earlier of that expiry and `expiresIn`.
3. Start the `expire` timer from that time, as for `expiresIn`.
4. Write the test with a fake clock.
5. Set this task and the plan row to `implemented`.

## Validation

- The sdk test passes.
- A token with no expiry keeps today's behaviour.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the timer exists for the host resource only; check a resource with its own issuer too.
