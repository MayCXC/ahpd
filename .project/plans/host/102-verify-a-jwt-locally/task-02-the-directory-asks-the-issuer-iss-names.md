---
title: The directory asks the issuer that iss names
status: todo
depends: [task-01-an-issuer-checks-a-jwt-against-its-keys.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/users.ts#L873-L919](../../../../packages/sdk/src/users.ts#L873-L919) - `verify`"
  - "[code://packages/sdk/src/users.ts#L853](../../../../packages/sdk/src/users.ts#L853) - `rolesFromClaim`"
---

## Objective

`verify` reads `iss` from a JWT and asks only the issuer it names.
A JWT from an unknown issuer is refused without a request, and every other token goes to `userinfo` as now.

## Files

- `UPDATE: packages/sdk/src/users.ts:873-919` - pick the issuer by `iss` for a JWT, before the ordered search.
- `UPDATE: packages/sdk/test/users-issuer.test.ts` - a JWT from each of two issuers, one from an unknown issuer, and an opaque token.

## Steps

1. Keep the local hash check first, as now.
2. Read `iss` from a token that has the shape of a JWT, without trusting it yet.
3. Find the issuer whose `id` equals `iss`, among the default and the records' issuers.
4. Refuse the token when no issuer matches and the setting says `jwt` or `auto`.
5. Ask that issuer to check the token locally when its setting is `jwt` or `auto`.
6. Use the ordered `userinfo` search for an opaque token under `auto`, and for every token under `userinfo`.
7. Read `rolesFrom` from the token's claims, and make no `userinfo` request for it.
8. Carry the expiry from the `IssuerAnswer` onto the `Principal`.
9. Write the tests.
10. Set this task and the plan row to `implemented`.

## Validation

- `users-issuer.test.ts` passes.
- A JWT from an unknown issuer makes no request.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** an issuer `id` may differ from `iss` by a trailing slash; compare them as the discovery document spells them.
