---
title: The daemon has requireIssuer and no trustToken
status: todo
depends:
  - task-01-a-local-token-names-its-person.md
layer: "server"
refs:
  - "[code://packages/server/src/commands/options.ts#L518-L521](../../../../packages/server/src/commands/options.ts#L518-L521) - the `trustToken` field and its flag"
  - "[code://packages/server/src/commands/run.ts#L345](../../../../packages/server/src/commands/run.ts#L345) - where the key reaches `fileUsers`"
  - "[code://packages/server/test/config-check.test.ts#L533](../../../../packages/server/test/config-check.test.ts#L533) - the unknown-key case to reuse for `trustToken`"
  - "[code://packages/server/test/server-http.test.ts#L364](../../../../packages/server/test/server-http.test.ts#L364) - a daemon socket opened with `?tkn=`: the shape for the handshake case"
---

## Objective

The daemon takes `requireIssuer` as a configuration key and as `--require-issuer`, and passes it to the users directory.
`trustToken` and `--trust-token` are gone, and a person who connects with their token gets `ahpd.principal` on `initialize`.

## Files

- `UPDATE: packages/server/src/commands/options.ts:70` - replace `trustToken: boolean` with `requireIssuer: boolean`.
- `UPDATE: packages/server/src/commands/options.ts:518-521` - replace the `trustToken` field with `requireIssuer`, with a description for the flag.
- `UPDATE: packages/server/src/commands/options.ts:1168` - default `requireIssuer` to false.
- `UPDATE: packages/server/src/config.ts:210-216` - replace the `trustToken` key and its comment with `requireIssuer`.
- `UPDATE: packages/server/src/commands/run.ts:345` - pass `requireIssuer` to `fileUsers`.
- `UPDATE: packages/server/src/main.ts:288` - replace `trustToken` with `requireIssuer` in the list of keys.
- `UPDATE: packages/server/README.md:133` - replace the `--trust-token` row with `--require-issuer`.
- `UPDATE: packages/server/test/config-check.test.ts:72` - check that `requireIssuer: 'yes'` is refused.
- `UPDATE: packages/server/test/config-check.test.ts:185-242` - replace `trustToken` with `requireIssuer` in the key and default cases.
- `UPDATE: packages/server/test/config-check.test.ts:533` - add a case where a file with `trustToken` starts and logs it as unknown.
- `UPDATE: packages/server/test/server-cli.test.ts:137` - replace `--trust-token` with `--require-issuer`.
- `UPDATE: packages/server/test/server-commands.test.ts:49` - replace `--trust-token` with `--require-issuer`.
- `UPDATE: packages/server/test/server-root-config.test.ts:72` - replace `trustToken` with `requireIssuer` in the keys kept out of the root config.
- `UPDATE: packages/server/test/server-http.test.ts:360-380` - add a case where a person's token on `?tkn=` gets `ahpd.principal` on `initialize`.

## Steps

1. Replace the `trustToken` field in `options.ts` with `requireIssuer`, with the same type and a false default.
2. Replace the `trustToken` key in `config.ts` with `requireIssuer`.
3. Pass `requireIssuer` to `fileUsers` in `run.ts`.
4. Replace `trustToken` in the key list in `main.ts` and the flag row in the server README.
5. Update the tests the Files lines name.
6. In `server-http.test.ts`, start a daemon with a users file and open a socket with a person's token.
7. Assert that `initialize` answers `ahpd.principal` as `user:<id>` in that case.
8. Add a second case with `requireIssuer` on, and assert that `ahpd.principal` is absent.

## Validation

- `config-check.test.ts`: the check refuses a `requireIssuer` that is not a boolean, and the default is false.
- `config-check.test.ts`: a file with `trustToken` starts and logs it.
- `server-http.test.ts`: a person's token on `?tkn=` gets `ahpd.principal`, and gets none with `requireIssuer` on.
- Run `pnpm --filter @ahpd/server test -- config-check server-cli server-commands server-root-config server-http` and expect every case to pass.
- Run `rg -n "trustToken|trust-token" packages` and expect only the case that checks the unknown key.

## Resume
