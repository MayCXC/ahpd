---
title: The daemon takes the setting
status: todo
depends: [task-02-the-directory-asks-the-issuer-iss-names.md]
layer: server
refs:
  - "[code://packages/server/src/config.ts#L166-L175](../../../../packages/server/src/config.ts#L166-L175) - `issuer`"
  - "[code://packages/server/src/config.ts#L707-L718](../../../../packages/server/src/config.ts#L707-L718) - `namedIssuer`"
  - "[code://packages/server/src/commands/run.ts#L255-L286](../../../../packages/server/src/commands/run.ts#L255-L286) - `--issuer` and the sign-in record"
---

## Objective

The daemon reads the JWT setting and the audience, and hands them to the directory.

## Files

- `UPDATE: packages/server/src/config.ts:166-175` - the `issuerVerify` key beside `issuer`.
- `UPDATE: packages/server/src/config.ts:707-718` - `namedIssuer` reads the new shape.
- `UPDATE: packages/server/src/commands/run.ts:255-286` - pass the setting and the audience to `fileUsers`.
- `UPDATE: packages/server/test` - the config parse, and a refused value.

## Steps

1. Add `issuerVerify` beside `issuer`, with `userinfo` as the default.
2. Refuse an unknown value with a startup line, as `--issuer` does.
3. Pass the sign-in record's `resource` to the directory as the audience.
4. Write the tests.
5. Set this task and the plan row to `implemented`.

## Validation

- The server tests pass.
- A config with no setting starts as today.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a record may name its own issuer and `issuerVerify`; read both where that issuer is built.
