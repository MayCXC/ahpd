---
title: The docs and the spec say the token names the person
status: done
depends:
  - task-02-the-daemon-has-require-issuer.md
layer: "docs"
refs:
  - "[code://docs/sdk/AUTHENTICATION.md](../../../../docs/sdk/AUTHENTICATION.md) - the identity table, the `trustToken` example and the key list"
  - "[code://.project/specs/sign-in.md](../../../../.project/specs/sign-in.md) - the door scenarios, L54-L75"
---

## Objective

The docs and the sign-in spec say that a person's token names them at the door.
They say that `requireIssuer` makes the issuer's token the only way to sign in.

## Files

- `UPDATE: docs/sdk/AUTHENTICATION.md:22` - the identity of a person's token is that person, unless the issuer is required.
- `UPDATE: docs/sdk/AUTHENTICATION.md:55-68` - replace the `trustToken` example and its paragraph with a `requireIssuer` example.
- `UPDATE: docs/sdk/AUTHENTICATION.md:284` - replace the `trustToken` key with `requireIssuer`.
- `UPDATE: docs/sdk/USERS.md:15-25` - the token signs the person in, and `requireIssuer` asks for the issuer instead.
- `UPDATE: docs/sdk/USERS.md:450-456` - remove the advice to set `trustToken` for VS Code with minted secrets.
- `UPDATE: docs/server/USERS.md:82` - replace the `--trust-token` sentence with the default and `--require-issuer`.
- `UPDATE: docs/sdk/HOST.md:93` - replace `trustToken` with `requireIssuer` in the list of connection keys.
- `UPDATE: docs/sdk/HOST.md:145` - replace `trustToken` with `requireIssuer` in the keys the root config leaves out.
- `UPDATE: .project/specs/sign-in.md:54-75` - replace the two door scenarios with "A person's token names them" and "The host requires the issuer".
- `UPDATE: .project/specs/sign-in.md:76-83` - add that `authenticate` refuses a local token when the issuer is required.
- `UPDATE: .project/specs/sign-in.md:17` - say that `identify` names a person unless the issuer is required.

## Steps

1. Rewrite each place the Files lines name, one sentence per line, with no em dash.
2. Name the decision `a-persons-token-names-them-unless-the-issuer-is-required` where the old text named `the-door-is-a-door`.
3. Run `rg -n "trustToken|trust-token|the-door-is-a-door" docs .project/specs` and fix each line it prints.
4. Run the do-spec `lint-prose.mjs` on `.project/specs/sign-in.md`.

## Validation

- `rg -n "trustToken|trust-token|the-door-is-a-door" docs .project/specs` prints nothing.
- `lint-prose.mjs` passes on `.project/specs/sign-in.md`.
- The `requireIssuer` example in `AUTHENTICATION.md` is a configuration the daemon of task 02 accepts.

## Resume

- **Done so far:** every place the Files lines name. `AUTHENTICATION.md` says a person's token names them, replaces the `trustToken` example with a `requireIssuer` configuration the daemon accepts (`requireIssuer`, `issuer`, and a users path) beside the record key, and lists `requireIssuer` among the keys. `USERS.md` says the token is the sign-in and `requireIssuer` asks for the issuer instead, and the VS Code paragraph no longer advises a key for minted secrets. `server/USERS.md` has `## Require the issuer` in place of the old section. `HOST.md` lists `requireIssuer` in both places. `sign-in.md` has `A person's token names them` and `The host requires the issuer` in place of the two door scenarios, the authenticate scenario says a local token where the issuer is required answers `-32007`, "Sign in through your issuer", and the `identify` ref names the new rule.
- **Next action:** none; the plan is built.
- **Open questions:** none.
- **Watch out for:** `packages/sdk/test/people.test.ts:82` asserted `trusted: false` from the old default and now expects `trusted: true`; the sdk suite passes whole with it. The remaining `trustToken` strings are historical plan and research records, and the two intentional ones in `packages`.
