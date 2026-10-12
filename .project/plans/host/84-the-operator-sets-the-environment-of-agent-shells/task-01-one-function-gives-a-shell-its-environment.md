---
title: One function gives an agent shell its environment
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/terminals.ts#L96-L106](../../../../packages/sdk/src/terminals.ts#L96-L106) - a terminal's environment"
  - "[code://packages/sdk/src/terminals.ts#L399](../../../../packages/sdk/src/terminals.ts#L399) - `shellTerminals`"
---

## Objective

`shellEnvOf` puts the operator's map over a base environment, and removes each variable whose value is `null`.
`shellTerminals` takes the map, and each terminal it makes starts from that environment.

## Files

- `CREATE: packages/sdk/src/shellenv.ts` - `ShellEnv` and `shellEnvOf`.
- `UPDATE: packages/sdk/src/index.ts` - export both.
- `UPDATE: packages/sdk/src/terminals.ts:96-106` - start from `shellEnvOf`, and remove a key whose value is `undefined`.
- `UPDATE: packages/sdk/src/terminals.ts:399` - take `shellEnv` in the options of `shellTerminals`.
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
