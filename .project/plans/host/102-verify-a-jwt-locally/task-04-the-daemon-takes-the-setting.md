---
title: The daemon takes the setting
status: done
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

- **Done so far:** `Config.issuerVerify` is a key beside `issuer`, with `IssuerVerify` as its type. `serverFields.issuerVerify` carries `enum: ['userinfo', 'jwt', 'auto']` and `cli: { value: 'userinfo|jwt|auto' }`, so the file, the flag and the help all say the three words. `Options.issuerVerify` is read through `given`. It is passed to `fileUsers` beside `audience: advertisedResource()`, which is the sign-in record's `resource`. A record's own `issuerVerify` is read where that issuer is built, in `modeOf` in `users.ts`. `config-check.test.ts` has the enum case, with a refused value and a number off the list. It also has the read-through case, which now carries `issuerVerify: 'jwt'` from the file onto the options.
- **Next action:** none; task 05 is the docs.
- **Open questions:** none.
- **Watch out for:** the schema refuses an unknown value, not a `stop()` beside `--issuer`. The schema checks the file and the flag in one place. It names the file and the key: `<file>: issuerVerify must be one of userinfo, jwt, auto`. A `stop()` would be written twice and would not check the file at all. `user add` cannot set a record's own `issuerVerify`, so the file is the way to write one. The Files list missed `commands/options.ts` and `main.ts`. The daemon key cannot exist without `serverFields`/`Options` in the first and the key list in the help of the second.
