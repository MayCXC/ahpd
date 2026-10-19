---
title: The token methods over AHP
status: todo
depends: [task-02-a-token-signs-in-narrowed.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/usage.ts#L982-L1020](../../../../packages/sdk/src/usage.ts#L982-L1020) - `usageMethods`, the pattern of a method whose `authorize` lets a reader in for their own records"
  - "[code://packages/sdk/src/types/plugin.ts#L402-L426](../../../../packages/sdk/src/types/plugin.ts#L402-L426) - `PluginMethod`, with `grant`, `authorize` and `handle`"
  - "[code://packages/server/src/commands/run.ts#L998-L1006](../../../../packages/server/src/commands/run.ts#L998-L1006) - where the daemon registers its own methods"
  - "[code://packages/sdk/src/index.ts#L74](../../../../packages/sdk/src/index.ts#L74) - where `usageMethods` is exported"
---

## Objective

A client on a person's AHP connection mints, lists and revokes that person's tokens with three methods.
The methods do what the commands of task 04 do, with the same checks and the same sentences.

## Files

- `CREATE: packages/sdk/src/tokens.ts` - `tokenMethods(directory)`, which answers `x-ahpd/tokens/mint`, `x-ahpd/tokens/list` and `x-ahpd/tokens/revoke`.
- `UPDATE: packages/sdk/src/index.ts:74` - export `tokenMethods`.
- `UPDATE: packages/server/src/commands/run.ts:998-1006` - register the three methods when the daemon has a users directory.
- `CREATE: packages/sdk/test/token-methods.test.ts` - the tests of the three methods, as `usage-methods.test.ts` does.

## Steps

1. Write the tests first.
2. Give each method the grant `user:write`, and a `describe` with a short title and one sentence.
3. In `authorize`, let in a reader whose `token` is not set, when `params.user` is absent or is the reader's id.
4. In `handle`, refuse with `-32009` and the sentence of task 04 when the reader has `token` set.
5. In `handle`, for another person, refuse with `-32009` when the reader lacks one of that person's grants.
6. Refuse the root connection, which has no reader, when `params.user` is absent.
7. Take `{ user?, label?, grants?, expires? }` for mint, and answer the `MintedToken` with its `secret`.
8. Take `{ user? }` for list, and answer the token records without their hashes.
9. Take `{ id }` for revoke, find the token's person, check that person as in step 5, and answer `{}`.
10. Refuse a bad param with `INVALID_PARAMS`, and a directory refusal with `-32009` and its sentence.
11. Register the methods in `run.ts` as `{ by: 'ahpd', name, method }`, as the usage methods are.
12. Set this task and the plan's Tasks table to `implemented`.

## Validation

- `token-methods.test.ts`: a `member` without `user:write` mints, lists and revokes their own tokens.
- `token-methods.test.ts`: the mint answer holds the secret, and the list answer holds no secret and no hash.
- `token-methods.test.ts`: each of the three methods refuses a reader with `token` set.
- `token-methods.test.ts`: the methods refuse `{ user: 'bob' }` from a `member`, and let an `admin` in.
- `token-methods.test.ts`: the mint refuses the root connection when `user` is absent.
- A test: the handshake lists the three methods under `_meta['ahpd.methods']` with `user:write`.
- `pnpm exec vitest run packages/sdk/test/token-methods.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
