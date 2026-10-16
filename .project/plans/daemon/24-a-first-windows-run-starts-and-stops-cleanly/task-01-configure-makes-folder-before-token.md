---
title: configure makes the folder before the token
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/configure.ts#L166-L191](../../../../packages/server/src/commands/configure.ts#L166-L191) - the two writes of the token file"
---

## Objective

`ahpd configure` runs to the end when the configuration folder does not exist yet.
It makes the folder of the token file before it writes the token.

## Files

- `UPDATE: packages/server/src/commands/configure.ts:182-189` - make the folder of `tokenFile` before each `writeFileSync`.
- `UPDATE: packages/server/test/server-configure.test.ts` - a case with no configuration folder.

## Steps

1. Open `packages/server/test/server-configure.test.ts`.
2. Add a case: run `configure` with a missing `configDir`, and expect the token file and `config.json` in it.
3. Run the case and see it fail with ENOENT.
4. In `configure.ts`, import `mkdirSync` from `node:fs` and `dirname` from `node:path`.
5. Call `mkdirSync(dirname(tokenFile), { recursive: true })` once, before the `if` at line 179.
6. Run the case again and see it pass.

## Validation

- The new case passes, and it fails without step 5.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand on Windows: remove `%USERPROFILE%\.config\ahpd`, then run `ahpd configure`. It runs to the end.

## Resume

Done 2026-10-13. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/test/server-configure.test.ts` - `makes the configuration folder on a first run, rather than failing on the token file`. Steps 1 to 3. It runs `configure` against a `configDir` under the case's own temporary root that nothing has made, and expects the token file, a non-empty token in it, and a `config.json` naming that file. Run before the fix it failed with the plan's own error, at `configure.ts:189`: `ENOENT: no such file or directory, open '<root>/never-made/connection-token'`. 18 cases before, 19 after.
- `packages/server/src/commands/configure.ts` - `mkdirSync` from `node:fs` and `dirname` from `node:path` added to the two imports, and one `mkdirSync(dirname(tokenFile), { recursive: true })` between the token question and the `if` that writes the file. Steps 4 to 6. One call, because both writes of the token are in the two arms of that `if`.

Judgement calls the plan does not decide:

- The folder is made from `dirname(tokenFile)` and not from `options.configDir`. `connectionTokenFile` may name a path anywhere, and the folder the write needs is the token's own; the default is `configDir`'s, so a first run is covered either way.
- The call sits after the question is asked rather than before it. Nothing reads the folder before the write, and a question that ends the command early - a refusal, a Ctrl-C - is then a command that made no folder.

What the plan did not know:

- `writeEntry` needs no such fix. It goes through `@ahpd/sdk`'s `writeJsonAtomic`, which makes `dirname(file)` itself (`packages/sdk/src/jsonfile.ts:103`), so the configuration file was never the ENOENT. The token's own `writeFileSync` is the only one of the two writes with no folder made for it, which is what the plan's reference to "the two writes of the token file" already implies.
- Nothing else in this file writes before the configuration file does, so one `mkdirSync` covers a first run.

Validation:

- The new case passes, and it failed with ENOENT before step 5.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on the four packages in one command, with `--maxWorkers=2 --testTimeout=10000`: 242 files and 4358 tests pass.
- The Windows check by hand is not run: this build is on Linux.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. 33 lines differ, none of them about `configure`. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
