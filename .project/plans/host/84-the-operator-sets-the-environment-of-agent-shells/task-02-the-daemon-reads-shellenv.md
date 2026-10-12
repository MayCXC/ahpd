---
title: The daemon reads shellEnv, and its terminals use it
status: todo
depends: [task-01-one-function-gives-a-shell-its-environment.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/config.ts#L196-L202](../../../../packages/server/src/config.ts#L196-L202) - `clientToolTimeoutMs`, the pattern for this key"
  - "[code://packages/server/src/commands/run.ts#L556](../../../../packages/server/src/commands/run.ts#L556) - `shellTerminals`"
  - "[code://packages/server/src/commands/run.ts#L652](../../../../packages/server/src/commands/run.ts#L652) - where `clientToolTimeoutMs` goes to the host"
  - "[code://packages/sdk/src/host/spawn.ts#L589](../../../../packages/sdk/src/host/spawn.ts#L589) - where the host puts `clientToolTimeoutMs` on `Start`"
  - "[code://docs/HOST.md#L56-L70](../../../../docs/HOST.md#L56-L70) - the configuration keys"
---

## Objective

The daemon reads `shellEnv` from `config.json`, and refuses a value that is not a string or `null`.
It gives the map to its terminals, and to each backend on `Start`.

## Files

- `UPDATE: packages/server/src/config.ts:196-202` - the key `shellEnv`, and its check.
- `UPDATE: packages/server/src/commands/run.ts:556` - pass `shellEnv` to `shellTerminals`.
- `UPDATE: packages/server/src/commands/run.ts:652` - pass `shellEnv` to the host.
- `UPDATE: packages/sdk/src/types/host.ts:416` - `shellEnv` in the host options.
- `UPDATE: packages/sdk/src/types/agent.ts:287` - `shellEnv` on `Start`.
- `UPDATE: packages/sdk/src/host/spawn.ts:589` - put `shellEnv` on `Start`.
- `UPDATE: docs/HOST.md:56-70` - a row for `shellEnv`, with the `XDG_CONFIG_HOME` example.
- `UPDATE: packages/server/test/config-check.test.ts` - the cases below.

## Steps

1. Add `shellEnv` to `Config`, as a map of variable name to a string or `null`.
2. Refuse a key that is not a shell name, and say the key in the message.
3. Refuse a value that is not a string or `null`, and say the key in the message.
4. Do not add a flag, because a map is not a flag.
5. Pass `shellEnv` to `shellTerminals` in `run.ts`.
6. Pass `shellEnv` to the host options, and from there to `Start`, as `clientToolTimeoutMs` goes.
7. Add the row to `docs/HOST.md`, and say that a client uses `shellInitScripts` for one session.

## Validation

- The check refuses a config with a number as a value, and its message names the key.
- The check keeps a config with `null` as a value.
- `pnpm exec vitest run packages/server packages/sdk` passes.

## Resume
