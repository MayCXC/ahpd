---
title: Verify a JWT locally
domain: host
status: built
priority: low
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/host/08-an-issuer-behind-the-users-port/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://.project/plans/host/08-an-issuer-behind-the-users-port/deferred.md](../../../../.project/plans/host/08-an-issuer-behind-the-users-port/deferred.md) - host/08 set this work aside"
  - "[code://packages/sdk/src/access/issuers.ts#L1-L16](../../../../packages/sdk/src/access/issuers.ts#L1-L16) - the header: `userinfo`, not JWT verification"
  - "[code://packages/sdk/src/access/issuers.ts#L27-L69](../../../../packages/sdk/src/access/issuers.ts#L27-L69) - `Fetcher`, `get` and `answer`, the request helpers to reuse"
  - "[code://packages/sdk/src/access/issuers.ts#L136-L157](../../../../packages/sdk/src/access/issuers.ts#L136-L157) - `oidcIssuer` reads the discovery document and `userinfo_endpoint`"
  - "[code://packages/sdk/src/access/issuers.ts#L167-L186](../../../../packages/sdk/src/access/issuers.ts#L167-L186) - `issuerKind` and `issuerFrom`"
  - "[code://packages/sdk/src/types/users.ts#L40-L60](../../../../packages/sdk/src/types/users.ts#L40-L60) - `Principal` and `standing`"
  - "[code://packages/sdk/src/types/users.ts#L185-L215](../../../../packages/sdk/src/types/users.ts#L185-L215) - `IssuerAnswer` and `Issuer`"
  - "[code://packages/sdk/src/access/users.ts#L300-L345](../../../../packages/sdk/src/access/users.ts#L300-L345) - `DEFAULT_RESOURCE` and `signInRecord`"
  - "[code://packages/sdk/src/access/users.ts#L853](../../../../packages/sdk/src/access/users.ts#L853) - `rolesFromClaim`"
  - "[code://packages/sdk/src/access/users.ts#L873-L919](../../../../packages/sdk/src/access/users.ts#L873-L919) - `verify` asks the default issuer, then each record's issuer, in order"
  - "[code://packages/sdk/src/host/handshake.ts#L67-L108](../../../../packages/sdk/src/host/handshake.ts#L67-L108) - `expire` drops the principal and sends `auth/required` with `expired`"
  - "[code://packages/sdk/src/host/handshake.ts#L564-L610](../../../../packages/sdk/src/host/handshake.ts#L564-L610) - `expiresIn`, `verify` and `principalUntil`"
  - "[code://packages/sdk/src/host/admission.ts#L353-L378](../../../../packages/sdk/src/host/admission.ts#L353-L378) - the gate answers `-32007`"
  - "[code://packages/server/src/config.ts#L166-L175](../../../../packages/server/src/config.ts#L166-L175) - `issuer` is a string"
  - "[code://packages/server/src/config.ts#L707-L718](../../../../packages/server/src/config.ts#L707-L718) - `namedIssuer`"
  - "[code://packages/server/src/commands/run.ts#L255-L286](../../../../packages/server/src/commands/run.ts#L255-L286) - `--issuer`, and the record built from `advertisedResource`"
  - "[code://docs/sdk/AUTHENTICATION.md#L80-L124](../../../../docs/sdk/AUTHENTICATION.md#L80-L124) - \"An issuer\" and \"An issuer per person\""
  - "[code://packages/sdk/test/users-issuer.test.ts](../../../../packages/sdk/test/users-issuer.test.ts) - the issuer tests to extend"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `auth/required` with `AuthRequiredReason.Expired`, and no notice ahead of expiry
  - https://www.rfc-editor.org/rfc/rfc9068 - the JWT access token profile: `typ: at+jwt`, and the `aud` check
  - https://www.rfc-editor.org/rfc/rfc7517 - the JSON Web Key set at `jwks_uri`
---

## Goal

When an issuer's token is a JWT, the host checks it itself against the issuer's key set.
The token's `exp` then ends the sign-in, and `iss` names the one issuer to consult.
A sign-in still works while the issuer is down, once the host has its keys.
Every other token goes to `userinfo` as now, so GitHub does not change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "jwks\|jose\|crypto.subtle" packages/` - nothing; no JWT code and no JOSE dependency.
- `git grep -n "crypto\." packages/sdk/src` - the sdk uses the global `crypto` already, so WebCrypto adds no dependency.
- `git grep -n "principalUntil\|expiresIn" packages/sdk/src` - a sign-in already has an end, from the client's `expiresIn`.
- The idea's line refs are stale: `verify` is now at `users.ts` L873-L919.

### Runtime path

```
authenticate(token) -> users.verify -> JWT? -> iss -> issuer's key set (cached by kid) -> signature, aud, exp -> IssuerAnswer + expiry -> principalUntil -> expire: auth/required expired
                                    -> not a JWT -> userinfo as now
```

### Gaps

- `IssuerAnswer` has no expiry, so `exp` cannot reach `principalUntil`.
- `oidcIssuer` reads `userinfo_endpoint` from discovery, and not `jwks_uri`.
- `verify` asks each issuer in order, and does not read `iss` first.
- `issuer` in the daemon's config is a string, with no place for a setting.

## Answers

| What | Source | Task |
| --- | --- | --- |
| No dependency: WebCrypto verifies the signature from a JWK | Softov, 2026-09-26, the idea | 01 |
| The algorithms are RS256, PS256, ES256 and EdDSA; `none` and `HS*` are refused | Softov, 2026-09-26, the idea | 01 |
| Keys are kept per issuer by `kid`, and an unknown `kid` refetches the set at most once a minute | (defaulted: the idea asks for a minimum interval; one minute is common) | 01 |
| The clock skew on `exp` and `nbf` is 60 seconds | (defaulted: the idea asks for a small allowance) | 01 |
| A verified token gives the same `IssuerAnswer`, and the users file still maps the subject to a record | Softov, 2026-09-26, the idea | 01, 02 |
| A token that is not a JWT, or an issuer with no `jwks_uri`, goes to `userinfo` | Softov, 2026-09-26, the idea | 02 |
| A JWT whose `iss` names no known issuer is refused without a request | Softov, 2026-09-26, the idea | 02 |
| Local checking is opt in per issuer: `verify: 'userinfo' \| 'jwt' \| 'auto'`, default `userinfo` | Softov, 2026-10-16, chose "opt in per issuer, default `userinfo`" for "Opt in or automatic" | 02, 04 |
| The setting is a daemon key beside `issuer` | Softov, 2026-10-16, chose "a daemon key beside `issuer`" for "Where the setting lives" | 04 |
| `aud` must hold the sign-in record's `resource` | Softov, 2026-10-16, chose "the sign-in record's `resource`" for "What `aud` must hold" | 01, 04 |
| The earlier of `exp` and `expiresIn` sets `principalUntil` | Softov, 2026-10-16, chose "the earlier of `exp` and `expiresIn`" for "What `exp` does to a live connection" | 03 |
| `rolesFrom` reads the token's claims | Softov, 2026-10-16, chose "`rolesFrom` reads the token's claims" for "Where roles come from" | 02 |
| The `typ` header may be `at+jwt` or `JWT` | Softov, 2026-10-16, chose "`at+jwt` and `JWT`" for "Which `typ` header is accepted" | 01 |
| A JWT with no `exp` is refused by the local check | Softov, 2026-10-18, chose "Refuse it" for "Should the local check refuse it?" | 01 |
| A header with no `typ` is accepted | Softov, 2026-10-18, chose "Accept it" for "What happens to a header with no `typ`?" | 01 |
| A token with no `kid` reads the key set again after a minute, like an unknown `kid` | (defaulted: review 2026-10-18; an issuer down at the first read never sent its one key) | 01 |
| The key is `issuerVerify`; a record that names its own issuer may carry its own `issuerVerify`, else the daemon's applies | (defaulted: one key per issuer, beside `issuer`) | 04 |

## Proposed architecture

- **Data flow** - `verify` reads the token's header and `iss` without trust. It picks the issuer that `iss` names and checks the signature with that issuer's key. Then it checks `aud`, `exp` and `nbf`, and returns the subject, the claims and the expiry.
- **State flow** - each issuer keeps its key set in memory, by `kid`, with the time of the last fetch.
- **Layer responsibilities** - The sdk holds the JWT check in `issuers.ts`, the choice of issuer in `users.ts` and the expiry in `handshake.ts`. The server reads the setting in `config.ts` and `run.ts`. The docs are AUTHENTICATION.md.
- **Source-of-truth files** - [`code://packages/sdk/src/access/issuers.ts`](../../../../packages/sdk/src/access/issuers.ts), [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An issuer checks a JWT against its key set](task-01-an-issuer-checks-a-jwt-against-its-keys.md) | done | - |
| [02 - The directory asks the issuer that iss names](task-02-the-directory-asks-the-issuer-iss-names.md) | done | 01 |
| [03 - The token's exp ends the sign-in](task-03-the-tokens-exp-ends-the-sign-in.md) | done | 02 |
| [04 - The daemon takes the setting](task-04-the-daemon-takes-the-setting.md) | done | 02 |
| [05 - The docs say how a JWT is checked](task-05-the-docs-say-how-a-jwt-is-checked.md) | done | 03, 04 |

## Risks and tradeoffs

- A token the provider revoked before `exp` still works until `exp`. `userinfo` sees a revocation on its one call. The docs say so.
- A wrong check signs in a person who should not be. The algorithm allowlist, the `aud` check and tests with forged tokens keep this closed.
- `exp` would end live connections in existing deployments. The setting is opt in, so nothing changes until an operator sets it.
- A flood of tokens with unknown `kid` values could become a flood of fetches. The minimum interval stops that.

## Resume state

- **Done so far:** drafted 2026-10-16 from `ideas/verify-a-jwt-locally.md`. Softov answered the six questions 2026-10-16. All five tasks are implemented and the code is committed. Task 01: `issuers.ts` checks a JWT against the key set at `jwks_uri`. `Issuer.verify(token, audience)` answers the subject, the claims and `expiresAt`. `jwtIssuer(token)` reads `iss` without trusting it. Task 02: `Users.verify` picks the issuer `iss` names. It refuses an unknown issuer with no request. It honours `issuerVerify` per issuer and carries the expiry onto the `Principal`. Task 03: `principalUntil` is the earlier of the credential's `exp` and the client's `expiresIn`. Task 04: `issuerVerify` is a daemon key beside `issuer` and a flag. It takes only `userinfo`, `jwt` and `auto`. `run.ts` hands it to `fileUsers`, with the sign-in record's `resource` as the audience. Task 05: `AUTHENTICATION.md` says what the setting is, what `jwt` checks, what `exp` ends and what a revocation does not. `USERS.md` names it beside `--issuer`. The header of `issuers.ts` names both checks. Softov reviewed the plan 2026-10-19 and approved the close, and [implemented.md](implemented.md) says what was built.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** an ID token is a JWT too. The `aud` check is what keeps it from signing in. `packages/sdk/test/fixtures/wire.jsonl` is rewritten by each suite run, so it is dirty in `git status`. `git checkout -- packages/sdk/test/fixtures/wire.jsonl` restores it. Task 02 added `Principal.expiresAt`, so task 03 reads it rather than adding it. Task 04's Files list missed `commands/options.ts` and `main.ts`. The daemon key needs `serverFields`/`Options` in the first and the key list in the help of the second. Task 05's line range covers "An issuer" and "An issuer per person" only. The key list further down was edited too.

## Final verification checklist

- [x] A JWT signed by a known key signs in, and a forged or expired one does not.
- [x] `none`, `HS256` and a token for another `aud` are refused.
- [x] A GitHub token signs in through `userinfo` as before.
- [x] With no `issuerVerify`, every token goes to `userinfo` as before.
- [x] A connection whose token passes `exp` gets `auth/required` with `expired`.
- [ ] `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.
- [ ] `plans/index.md` updated.
