---
title: One function gives an agent shell its environment
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L96-L106](../../../../packages/sdk/src/machines/terminals.ts#L96-L106) - a terminal's environment"
  - "[code://packages/sdk/src/machines/terminals.ts#L399](../../../../packages/sdk/src/machines/terminals.ts#L399) - `shellTerminals`"
---

## Objective

`shellEnvOf` puts the operator's map over a base environment, and removes each variable whose value is `null`.
`shellTerminals` takes the map, and each terminal it makes starts from that environment.

## Files

- `CREATE: packages/sdk/src/machines/shellenv.ts` - `ShellEnv`, `shellEnvOf` and `isShellName`.
- `UPDATE: packages/sdk/src/index.ts` - export both.
- `UPDATE: packages/sdk/src/machines/terminals.ts:96-106` - start from `shellEnvOf`, and remove a key whose value is `undefined`.
- `UPDATE: packages/sdk/src/machines/terminals.ts:399` - take `shellEnv` in the options of `shellTerminals`.
- `CREATE: packages/sdk/test/shellenv.test.ts` - the cases below.

## Steps

1. Define `ShellEnv` as a record of variable name to a string or `null`.
2. Write `shellEnvOf(base, shellEnv)`, which copies the base, sets each string and deletes each `null`.
3. Add `shellEnv` to the options of `shellTerminals`, and pass it to each terminal it makes.
4. Build a terminal's environment from `shellEnvOf(process.env, shellEnv)`, then the caller's `env`, then `TERM`, `COLUMNS` and `LINES`.
5. Delete each key whose value is `undefined` before the environment goes to the child.

## Validation

- A string in the map replaces the daemon's value.
- `null` removes the variable.
- A caller's `env` wins over the map.
- A caller's `undefined` removes the variable.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Implemented. `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass.

Files changed:
- `packages/sdk/src/machines/shellenv.ts` (new) - `ShellEnv`, `shellEnvOf` and `isShellName`.
- `packages/sdk/src/index.ts` - exports the three.
- `packages/sdk/src/machines/terminals.ts` - `createTerminal` and `shellTerminals` take `shellEnv`; a terminal's environment starts from `shellEnvOf(process.env, shellEnv)`, then the caller's `env`, then `TERM`, `COLUMNS` and `LINES`, and every name left with `undefined` is deleted before the child is started.
- `packages/sdk/test/shellenv.test.ts` (new) - the eight cases.

`isShellName` is past the two names the Files section lists: tasks 02 and 03 both need one rule for what a shell reads as a variable, and this is the package both of them reach.
The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` (the endpoint line and the `ahpd.` `_meta` lines); the write was denied here, so Softov reverts it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
