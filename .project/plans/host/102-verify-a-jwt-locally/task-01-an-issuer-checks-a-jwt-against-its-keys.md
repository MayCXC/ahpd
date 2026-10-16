---
title: An issuer checks a JWT against its key set
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** ES256 signatures in a JWT are raw `r || s`, which WebCrypto takes as it is.
