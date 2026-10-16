---
title: The limits are host config keys
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/root.ts#L218-L237](../../../../packages/sdk/src/host/root.ts#L218-L237) - `ROOT_CONFIG_SCHEMA`, and the keys this host acts on"
  - "[code://packages/sdk/src/host/root.ts#L283-L300](../../../../packages/sdk/src/host/root.ts#L283-L300) - `changeWords`, a key of this host's own to copy"
  - "[code://packages/sdk/src/host/gate.ts#L274-L298](../../../../packages/sdk/src/host/gate.ts#L274-L298) - a host key needs `config:write`"
  - "[code://packages/sdk/src/host/changesets.ts#L349-L350](../../../../packages/sdk/src/host/changesets.ts#L349-L350) - a reader of a root key at the time of use"
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the line that names the keys this host acts on"
---

## Objective

Two host root config keys hold the limits, with defaults that apply when nobody pushes them.
`clientQueueBytes` is the most a client's queue may hold, 16 MiB by default.
`replayBytes` is the byte budget of the replay buffer, 32 MiB by default.

## Files

- `UPDATE: packages/sdk/src/host/root.ts:218-300` - the two keys in `ROOT_CONFIG_SCHEMA`, beside `changeWords`.
- `UPDATE: packages/sdk/src/host/root.ts:225-232` - the comment that names the keys this host reads.
- `CREATE: packages/sdk/src/host/limits.ts` - the defaults, and a reader that returns a key's value or its default.
- `UPDATE: packages/sdk/test` - the schema has the keys, and a push changes what the reader returns.

## Steps

1. Declare `clientQueueBytes` as an integer with `minimum: 1048576`, a title, a description and `default: 16777216`.
2. Declare `replayBytes` as an integer with `minimum: 1048576`, a title, a description and `default: 33554432`.
3. Write a reader that returns the pushed value when it is a valid integer, else the default.
4. Read the key at the time of use, so a pushed value applies at once.
5. Check that a push of either key needs `config:write`, as any other host key does.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: the root snapshot's schema has both keys with their defaults.
- A test: a pushed value reads back, and a value below the minimum reads as the default.
- A test: the host refuses a push from a client without `config:write`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the schema gate pass.

## Resume

- **Done so far:** built 2026-10-16. `host/limits.ts` holds the defaults (`CLIENT_QUEUE_BYTES` 16 MiB, `REPLAY_BYTES` 32 MiB, `MINIMUM_LIMIT_BYTES` 1 MiB) and the two readers `clientQueueBytes(rootConfig)` and `replayBytes(rootConfig)`, each answering the pushed value when it is a safe integer at or above the minimum and the default otherwise - read from `rootConfig` where they are called, so a push applies at once. `ROOT_CONFIG_SCHEMA` declares both keys after `changeWords`, and the comment that counted the keys this host reads now says six. Three tests in `root-config.test.ts`: the two properties with their defaults, a push read back through the reader with a value below the minimum and a value that is not a number reading as the default, and a member refused with `config:change` with nothing moved.
- **Next action:** build task 03.
- **Open questions:** none.
- **Watch out for:** the keys are declared `type: 'number'` with the 1 MiB floor said in the description, not `type: 'integer'` with a `minimum` as the task's steps 01 and 02 word it. The protocol's `ConfigPropertySchema` declares five types and no bound, and `tools/ahp.strict.schema.json` closes it with `additionalProperties: false`, so the literal shape fails `wire.test.ts` with four findings (checked, not guessed) - `packages/server/src/rootconfig.ts` answers the same question the same way for the daemon's own keys.
