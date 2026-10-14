---
title: secret makes the folder before the token
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/options.ts#L1097-L1106](../../../../packages/server/src/commands/options.ts#L1097-L1106) - the write of a new token to `--connection-token-file`"
  - "[code://packages/server/src/commands/configure.ts#L166-L191](../../../../packages/server/src/commands/configure.ts#L166-L191) - the same fix in `configure`"
---

## Objective

`secret` writes a new token to `--connection-token-file` when the folder of the file does not exist yet.
It makes the folder before it writes the token.

## Files

- `UPDATE: packages/server/src/commands/options.ts:1097-1106` - make the folder of `options.tokenFile` before the `writeFileSync`.
- `CREATE: packages/server/test/server-secret.test.ts` - cases for a token file in a missing folder.

## Steps

1. Create `packages/server/test/server-secret.test.ts`.
2. Add a case: call `secret` with a `tokenFile` in two new folders, and expect a token in it.
3. Add a case: call `secret` a second time with the same file, and expect the same token.
4. Run the cases and see the first one fail with ENOENT.
5. In `options.ts`, import `mkdirSync` from `node:fs` and `dirname` from `node:path`.
6. Call `mkdirSync(dirname(options.tokenFile), { recursive: true })` before the `writeFileSync` of the new token.
7. Run the cases again and see them pass.

## Validation

- The new cases pass, and the first one fails without step 6.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand on Windows: start ahpd with `--connection-token-file` in a folder that does not exist. The daemon starts, and the file holds the token.

## Resume

Not started.
