---
title: A key is minted with a scope
status: todo
depends: []
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/users.ts](../../../../packages/sdk/src/types/users.ts) - `TokenRecord` gets `scope`"
  - "[code://packages/sdk/src/access/users.ts](../../../../packages/sdk/src/access/users.ts) - the tokens file reader and `mintToken`"
  - "[code://packages/sdk/src/access/tokens.ts](../../../../packages/sdk/src/access/tokens.ts) - the `scope` param"
  - "[code://packages/server/src/commands/token.ts](../../../../packages/server/src/commands/token.ts) - the `--scope` flag and the list column"
---

## Objective

`ahpd token mint --scope <team[:project]>` and `x-ahpd/tokens/mint { scope }` write a token record with that scope.
The mint refuses a scope the person is not in now, and `token list` shows the scope.

## Files

- `UPDATE: packages/sdk/src/types/users.ts:271-299` - adds `scope?: string` to `TokenRecord`, and the mint options type gets `scope`.
- `UPDATE: packages/sdk/src/access/users.ts:905-940` - the tokens file reader accepts `scope` when it is a string that `membership` parses and that is not `team:*`.
- `UPDATE: packages/sdk/src/access/users.ts:1512-1569` - `mintToken` refuses a scope that `scopeFor` refuses for the person now, and writes it.
- `UPDATE: packages/sdk/src/access/tokens.ts:36-136` - `x-ahpd/tokens/mint` takes `scope` as a string.
- `UPDATE: packages/server/src/commands/token.ts:110-240` - `--scope <team[:project]>` on `token mint`, and the scope in each `token list` line.
- `UPDATE: packages/sdk/test/users-tokens.test.ts` - the mint cases.
- `UPDATE: packages/sdk/test/token-methods.test.ts` - the `scope` param.
- `UPDATE: packages/server/test/token-command.test.ts` - the flag and the list line.

## Steps

1. Add `scope` to `TokenRecord`, and to the options `mintToken` takes.
2. Make the tokens file reader refuse a `scope` that is not a string, or that `membership` cannot parse.
3. Make the reader refuse a `scope` that names `*` as its project.
4. In `mintToken`, build the person's principal from the current file and ask `scopeFor(principal, scope)`.
5. Throw the refusal of `scopeFor` as the mint error when it refuses.
6. Throw `this host names no team, so a key has no scope to carry` when `scopeFor` returns nothing.
7. Write `scope` on the record and return it in the `MintedToken`.
8. Add the `scope` param to `x-ahpd/tokens/mint`, refused when it is not a string.
9. Add `--scope` to `ahpd token mint` and update the command description.
10. Add `scope <value>` to each `token list` line that has one.

## Validation

- `users-tokens.test.ts`: a mint with a scope the person holds writes it; a project under `team:*` is accepted; `team:*` is refused; a team the person is not in is refused with the `scopeFor` sentence; a host with no teams refuses the scope.
- `users-tokens.test.ts`: a tokens file with `scope: "x:*"` or `scope: 3` is reported as broken.
- `token-methods.test.ts`: `scope` that is not a string is `INVALID_PARAMS`.
- `token-command.test.ts`: `--scope` reaches the record, and `token list` shows it.
- Run `pnpm typecheck` and `pnpm test`.

## Resume

