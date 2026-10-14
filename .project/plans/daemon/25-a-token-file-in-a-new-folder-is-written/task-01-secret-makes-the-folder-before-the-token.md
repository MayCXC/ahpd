---
title: secret makes the folder before the token
status: implemented
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

Done 2026-10-14. Every step is built, and every case the Validation names passes.

`secret` makes the folder of the token file before it writes a new token.
The read of a token that is there is unchanged, and so is every other branch.

File by file:

- `packages/server/test/server-secret.test.ts` - new, with the two cases of steps 2 and 3. `writes a token into a folder that is not there yet` calls `secret` for a token file two folders deep under the case's own root. It expects a token, the `written to` wording, the file on disk, and the token in it. `keeps the token it wrote, so a second start reads the same one` calls `secret` twice and expects the same token and the `read from` wording. Step 4: run before the fix, both failed with `ENOENT: no such file or directory, open '<root>/app-data/ahpd/token'` at `options.ts:1105`, the `writeFileSync`.
- `packages/server/src/commands/options.ts` - `mkdirSync` is added to the `node:fs` import and `dirname` to the `node:path` import (step 5). One `mkdirSync(dirname(options.tokenFile), { recursive: true })` sits between the `randomUUID` call and the write (step 6). Step 7: both cases pass.

Judgement calls the plan does not decide, each visible in the file it is made in:

- The call sits in the branch that writes, after the `existsSync` check, and not before it. A token that is already there is read and nothing is made, so a folder appears only where a token does.
- The folder is `dirname(options.tokenFile)` and not the configuration directory. The flag may name a path anywhere, and the folder the write needs is the token's own. The default value of the flag is in the configuration directory, so a first run is covered either way. This is the same reasoning as daemon/24 task 01.
- The case passes the flag over `connectionTokenFile` and not `tokenFile`. `tokenFile` is the field of `Options` after the fold, and passing it to `optionsFrom` is read as an unknown key and dropped. The first run of the new case failed on exactly that, before the fix was reached.
- The case gives `optionsFrom` a `configFile` under its own temporary root, so it reads no configuration of whoever runs the suite. The file holds `{}`, which is a configuration this daemon accepts.

Validation:

- `pnpm -s schema`, `pnpm -s typecheck` and `pnpm -s boundary` each exit 0.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` in one command, from the repository root: 243 files and 4366 tests, all pass. Run with `--maxWorkers=2 --testTimeout=10000`. The new file is 2 of those cases.
- The new cases fail without step 6, with ENOENT at the write.

Left:

- The by-hand check on Windows is not run: this build is on Linux. It wants a start with `--connection-token-file` naming a folder that is not there. The path is `secret` alone, which the new cases cover.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. 33 lines differ: the `_meta` lines and the two `version` values, which the fixture holds as `0.0.1` and this daemon writes as `0.11.0`. None of it is about the token. `git restore`, `git checkout --` and a `git show` redirect are each denied in this mode, so it is left as the suite wrote it. Run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
- Nothing is committed, as asked.

