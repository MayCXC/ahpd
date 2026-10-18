---
title: An issuer checks a JWT against its key set
status: implemented
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/issuers.ts#L27-L69](../../../../packages/sdk/src/issuers.ts#L27-L69) - `Fetcher`, `get` and `answer`"
  - "[code://packages/sdk/src/issuers.ts#L136-L157](../../../../packages/sdk/src/issuers.ts#L136-L157) - `oidcIssuer`"
  - "[code://packages/sdk/src/types/users.ts#L185-L215](../../../../packages/sdk/src/types/users.ts#L185-L215) - `IssuerAnswer` and `Issuer`"
  - https://www.rfc-editor.org/rfc/rfc9068 - the claims to check
---

## Objective

An OpenID issuer reads `jwks_uri` from its discovery document and checks a JWT against those keys.
It returns the subject, the claims and the expiry, or nothing.

## Files

- `UPDATE: packages/sdk/src/issuers.ts:136-157` - read `jwks_uri`, keep the key set, and check a JWT.
- `UPDATE: packages/sdk/src/types/users.ts:185-190` - `IssuerAnswer` gains an optional expiry.
- `UPDATE: packages/sdk/src/types/users.ts:201-215` - `Issuer` gains a way to say which tokens it can check locally.
- `UPDATE: packages/sdk/test/users-issuer.test.ts` - good, forged, expired and wrong-audience tokens, and each refused algorithm.

## Steps

1. Read `jwks_uri` from the discovery document that `oidcIssuer` already fetches.
2. Split the token into header, payload and signature, and decode each as base64url.
3. Refuse any `alg` outside RS256, PS256, ES256 and EdDSA.
4. Refuse a `typ` other than `at+jwt` or `JWT`.
5. Find the key by `kid`, and refetch the set once on an unknown `kid`, at most once a minute.
6. Import the key with `crypto.subtle.importKey('jwk', ...)` and verify the signature.
7. Check `iss`, `exp` and `nbf`, with 60 seconds of skew.
8. Check that `aud` holds the sign-in record's `resource`.
9. Return the subject from `sub`, the claims and the expiry from `exp`.
10. Return nothing for every failure, as `who` does today.
11. Write the tests with keys made in the test.
12. Set this task and the plan row to `implemented`.

## Validation

- `users-issuer.test.ts` passes.
- No test reaches the network.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** every step. `issuers.ts` holds the `ALGORITHMS` table (RS256, PS256, ES256, EdDSA), `SKEW` (60s) and `REFETCH_MS` (60s), `split()` and the exported `jwtIssuer(token)` that reads `iss` untrusted, `checked()` which refuses an algorithm off the table, a `typ` other than `at+jwt`/`JWT`, a token that is not three parts, an empty signature, a missing key, an unsigned signature, a wrong `iss`/`exp`/`nbf`/`aud` and a missing `sub`, and `oidcIssuer`'s `published()`/`keyFor()` which cache the key set by `kid` and read it again only for an unknown `kid`, at most once a minute. `Issuer.verify(token, audience)` returns `subject`, the whole `claims` and `expiresAt` from `exp`. Eleven cases in the JWT section of `users-issuer.test.ts`, keys generated in the case.
- **Next action:** task 02. `Users.verify` still asks every issuer in order; nothing calls `verify` yet.
- **Open questions:** two readings the task left open, both taken permissively and both flagged in the report. A token with no `exp` at all is accepted (nothing to compare, so nothing to refuse) rather than refused; a header naming no `typ` is accepted as `at+jwt`. A `kid` that is absent is placed only against a set of exactly one key.
- **Watch out for:** ES256 signatures in a JWT are raw `r || s`, which WebCrypto takes as it is. The key set must be published as `{ keys: [...] }` - a bare JWK is not one, and a test that answers with one fails as a missing key rather than as a bad signature.
