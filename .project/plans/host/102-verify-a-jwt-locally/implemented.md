---
title: Verify a JWT locally - implemented
date: 2026-10-19
refs:
  - git://0fe64d7e
  - git://c1d88f10
  - "[code://packages/sdk/src/issuers.ts](../../../../packages/sdk/src/issuers.ts)"
  - "[code://packages/sdk/src/users.ts](../../../../packages/sdk/src/users.ts)"
  - "[code://packages/sdk/src/host/handshake.ts](../../../../packages/sdk/src/host/handshake.ts)"
  - "[code://packages/server/src/config.ts](../../../../packages/server/src/config.ts)"
---

An operator can now tell the host to check an issuer's JWT itself, with `issuerVerify: 'jwt'` or `'auto'`.
The host checks the signature against the issuer's key set, and checks `typ`, `iss`, `aud`, `exp` and `nbf`.
The token's `exp` then ends the sign-in, if it comes before the client's `expiresIn`.
A sign-in works while the issuer is down, once the host has its keys.
The default stays `userinfo`, so GitHub and every existing setup work as before.

## What was built

- [`code://packages/sdk/src/issuers.ts`](../../../../packages/sdk/src/issuers.ts) - the JWT check with WebCrypto, the algorithms RS256, PS256, ES256 and EdDSA, the key set kept by `kid`, and `jwtIssuer`.
- [`code://packages/sdk/src/users.ts`](../../../../packages/sdk/src/users.ts) - `verify` picks the issuer that `iss` names, refuses an unknown one with no request, and reads `issuerVerify` per issuer.
- [`code://packages/sdk/src/types/users.ts`](../../../../packages/sdk/src/types/users.ts) - `IssuerVerify`, `Principal.expiresAt`, and `issuerVerify` on a user record.
- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `principalUntil` is the earlier of the credential's `exp` and the client's `expiresIn`.
- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - the `issuerVerify` key beside `issuer`.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - the `serverFields` entry, with the three values.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - hands the setting and the sign-in record's `resource` to `fileUsers`.
- [`code://docs/sdk/AUTHENTICATION.md`](../../../../docs/sdk/AUTHENTICATION.md) - `Checking a token here`, and the key in the key list.
- [`code://docs/server/USERS.md`](../../../../docs/server/USERS.md) - the setting beside `--issuer`.

## Verified

- `packages/sdk/test/users-issuer.test.ts`: the JWT cases from `reads the issuer out of a JWT, and nothing out of anything else` to `lets a record say its own issuer is checked the old way`. They cover each algorithm, `none` and `HS256`, a forged token and an expired one.
  They also cover a token with no `exp`, one for another audience, `typ`, `kid` and an unknown issuer.
- `packages/sdk/test/users-issuer.test.ts`: `asks GitHub who a token belongs to, and answers with the login` still passes over `userinfo`.
- `packages/sdk/test/users-host.test.ts`: `ends the sign-in at the token's own exp, when that comes first` and `keeps the client's expiry when the token is good for longer than it asked`.
- `packages/server/test/config-check.test.ts`: `refuses a value outside an enum`, with `issuerVerify`.
- No test reaches the network, because each case generates its keys.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 02 - the Files list missed `IssuerVerify`, `UserRecord.issuerVerify`, `FileUserOptions` and the record read, which the task could not leave out.
- Task 02 - `Principal.expiresAt` was added here, because task 02 needs it before task 03 reads it.
- Task 04 - the Files list missed `packages/server/src/commands/options.ts` and `main.ts`, which the daemon key needs.
- Task 04 - the schema refuses an unknown value, so one check covers the file and the flag.
- Task 05 - the key list in `AUTHENTICATION.md` changed too, outside the task's line range.

## Left for later

- `ahpd user add` cannot set a record's own `issuerVerify`, so the users file is the only way to set it.
- A token that the provider revokes before `exp` works until `exp`, as the plan's risks say.
