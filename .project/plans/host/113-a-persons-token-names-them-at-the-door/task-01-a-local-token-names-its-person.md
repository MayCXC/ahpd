---
title: A local token names its person unless the issuer is required
status: implemented
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/access/users.ts#L939-L992](../../../../packages/sdk/src/access/users.ts#L939-L992) - `principalOf`, where `trusted` is stamped"
  - "[code://packages/sdk/src/access/users.ts#L1078-L1110](../../../../packages/sdk/src/access/users.ts#L1078-L1110) - `verify`, whose local branches are the ones `requireIssuer` refuses"
  - "[code://packages/sdk/src/host/handshake.ts#L584-L606](../../../../packages/sdk/src/host/handshake.ts#L584-L606) - `authenticate`, which sets the principal after `verify`"
  - "[code://packages/server/src/commands/run.ts#L553-L565](../../../../packages/server/src/commands/run.ts#L553-L565) - `identify`, which keeps reading `who.trusted`"
---

## Objective

`users.verify` stamps `trusted` as true for every token, except a local token of a record that requires the issuer.
The door names that person, and `authenticate` refuses a principal whose `trusted` is false.

## Files

- `UPDATE: packages/sdk/src/types/users.ts:80-89` - rewrite the `Principal.trusted` comment: a local token of a record that requires the issuer is false, every other token is true.
- `UPDATE: packages/sdk/src/types/users.ts:197-198` - replace `trustToken` on `UserRecord` with `requireIssuer`, which wins over the host's.
- `UPDATE: packages/sdk/src/types/users.ts:361` - say in the `list` comment that `trusted` is whether a local token signs the person in.
- `UPDATE: packages/sdk/src/types/listen.ts:196-204` - say in the `Arrival` comment that a person's token carries a principal unless the issuer is required.
- `UPDATE: packages/sdk/src/access/users.ts:427-436` - replace `FileUserOptions.trustToken` with `requireIssuer`, off by default.
- `UPDATE: packages/sdk/src/access/users.ts:471` - replace `trustAll` with the host's `requireIssuer` default.
- `UPDATE: packages/sdk/src/access/users.ts:717-736` - read a record's boolean `requireIssuer`, and log `once` for a record that still sets `trustToken`.
- `UPDATE: packages/sdk/src/access/users.ts:939-992` - give `principalOf` a `local` argument and stamp `trusted` from it and `requireIssuer`.
- `UPDATE: packages/sdk/src/access/users.ts:1094-1110` - pass `local` as true from the record branch and the minted branch.
- `UPDATE: packages/sdk/src/access/users.ts:1225-1234` - give each list row `trusted` as the opposite of the record's resolved `requireIssuer`.
- `UPDATE: packages/sdk/src/host/handshake.ts:584-606` - refuse a principal whose `trusted` is false with `-32007` and the sign-in resource.
- `UPDATE: packages/sdk/src/listen.ts:96-110` - replace the `the-door-is-a-door` comment with the new decision.
- `UPDATE: packages/server/src/commands/run.ts:548-565` - replace the `identify` comment; the code stays `who.trusted === true`.
- `UPDATE: packages/sdk/test/users.test.ts:250-290` - replace the `trustToken` cases with `requireIssuer` cases.
- `UPDATE: packages/sdk/test/listen-identity.test.ts:70-80` - replace the comment that cites `the-door-is-a-door`.
- `UPDATE: packages/sdk/test/users-gate-commands.test.ts:292-330` - add the `authenticate` refusal case for a local token that requires the issuer.

## Steps

1. Replace `trustToken` with `requireIssuer` on `UserRecord` and on `FileUserOptions`, with the comments the Files lines name.
2. Read a record's `requireIssuer` as the code reads `issuerVerify`, and log `once` for a record that still sets `trustToken`.
3. Log `once` for a record that requires the issuer and has no issuer of its own or from the host.
4. Add a `local` argument to `principalOf`, and pass true from the record branch and the minted branch of `verify`.
5. Stamp `trusted` as false when `local` is true and the record's resolved `requireIssuer` is true, and as true otherwise.
6. Set each `list` row's `trusted` to the opposite of the record's resolved `requireIssuer`.
7. In `authenticate` for the sign-in resource, throw `-32007`, "Sign in through your issuer", when `held.trusted` is false.
8. Put the sign-in resource in that error's data, as the refusal below it does.
9. Replace every comment in `packages/sdk` and `packages/server/src/commands/run.ts` that cites `the-door-is-a-door` with the new decision's slug.
10. Update the tests the Files lines name.

## Validation

- `users.test.ts`: a record's token and a minted token are `trusted` by default.
- `users.test.ts`: with the host's `requireIssuer`, both are not `trusted`, and a record with `requireIssuer: false` is.
- `users.test.ts`: a record with `requireIssuer: true` on a host without it is not `trusted`.
- `users.test.ts`: a record that sets `trustToken` logs once and is `trusted` by default.
- `users-gate-commands.test.ts`: `authenticate` with a local token of a record that requires the issuer answers `-32007` and leaves the connection nobody.
- `users-gate-commands.test.ts`: `authenticate` with that record's issuer token signs the person in.
- Run `pnpm --filter @ahpd/sdk test -- users listen-identity users-gate` and expect every case to pass.
- Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` after the run.

## Resume

- **Done so far:** `UserRecord.requireIssuer` replaces `trustToken`, and `FileUserOptions.requireIssuer` replaces the host default; both are off when absent and a record's answer wins. `read` keeps a boolean `requireIssuer`, says once for a value that is not one, says once for a record that still sets `trustToken`, and says once for a record that requires the issuer while neither it nor the host names one. `verify` passes `local: true` from the record branch and the minted branch, and `principalOf` stamps `trusted` false only for those when the record resolves to `requireIssuer`. `list` answers `trusted` as the opposite of the resolved `requireIssuer`, and `authenticate` refuses `held.trusted === false` with `-32007`, "Sign in through your issuer", and the sign-in resource in `data.resources`. Every comment in `packages/sdk` and `packages/server/src/commands/run.ts` that cited `the-door-is-a-door` now cites `a-persons-token-names-them-unless-the-issuer-is-required`.
- **Next action:** task-02, step 1.
- **Open questions:** none.
- **Watch out for:** `pnpm -s typecheck` reports `packages/server/src/commands/run.ts:345` until task 02 replaces its `trustToken` with `requireIssuer`; the sdk and its tests are clean. The runs rewrite `packages/sdk/test/fixtures/wire.jsonl`, and `git checkout --` on it was denied in this session, so it is left dirty for the commit by hand.
