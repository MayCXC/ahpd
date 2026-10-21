---
title: The directory asks the issuer that iss names
status: done
depends: [task-01-an-issuer-checks-a-jwt-against-its-keys.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/access/users.ts#L873-L919](../../../../packages/sdk/src/access/users.ts#L873-L919) - `verify`"
  - "[code://packages/sdk/src/access/users.ts#L853](../../../../packages/sdk/src/access/users.ts#L853) - `rolesFromClaim`"
---

## Objective

`verify` reads `iss` from a JWT and asks only the issuer it names.
A JWT from an unknown issuer is refused without a request, and every other token goes to `userinfo` as now.

## Files

- `UPDATE: packages/sdk/src/access/users.ts:873-919` - pick the issuer by `iss` for a JWT, before the ordered search.
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

- **Done so far:** every step. `verify` reads `iss` with `jwtIssuer` before the ordered search. It matches `iss` against the names this directory knows by the issuer's own `id`, so a configured name and a spelled one are one issuer. It refuses a JWT naming an unknown issuer with no request at all. It checks a token here when its mode is `jwt` or `auto`. Under `auto`, and for every token whose mode is `userinfo`, it falls through to the ordered `userinfo` search. It never shows an issuer set to `jwt` a token over `userinfo`. It carries `answer.expiresAt` onto the `Principal` and reads `rolesFrom` from the checked token's claims. `users-issuer.test.ts` has ten cases.
- **Next action:** task 03. `expiresAt` reaches the `Principal` and nothing reads it yet.
- **Open questions:** none.
- **Watch out for:** an issuer `id` may differ from `iss` by a trailing slash. Compare them as the discovery document spells them. The record read drops every key it does not name. A new record field has to be added there before any file that holds one is believed. The Files list missed `IssuerVerify` in `types/users.ts`, `UserRecord.issuerVerify` and `FileUserOptions.issuerVerify`/`audience`. It also missed the record read keeping `issuerVerify`. None of them can be left out. `Principal.expiresAt` is here too, because step 8 needs it before task 03 can read it. `identity add` cannot set a record's `issuerVerify`. The file is the way, and `read` keeps the field.
