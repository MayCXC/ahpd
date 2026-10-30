---
title: The record reaches the host inside
status: done
depends: [task-01-the-host-names-a-record-agents-plugin.md]
layer: "computer, server, sdk"
refs:
  - "[code://packages/computer/src/plugin.ts#L1395-L1420](../../../../packages/computer/src/plugin.ts#L1395-L1420) - `nestedHost` and the env it gives by name"
  - "[code://packages/server/src/commands/join.ts#L218-L230](../../../../packages/server/src/commands/join.ts#L218-L230) - a dialled node's host inside"
  - "[code://packages/server/src/commands/run.ts#L884](../../../../packages/server/src/commands/run.ts#L884) - the agents channel the host inside opens"
---

## Objective

The host inside a machine serves the record it was handed, under the record's id, from memory.

## Files

- `UPDATE: packages/computer/src/plugin.ts:1395-1420` - put the record in `AHPD_AGENT_RECORD` in the env of the start command.
- `UPDATE: packages/server/src/commands/join.ts:218-230` - the same for a dialled node.
- `UPDATE: packages/server/src/commands/run.ts:884` - open the record in `AHPD_AGENT_RECORD` with its engine at start, beside the collection's records.
- `UPDATE: packages/computer/test/computer-ssh.test.ts` - an ssh box gets the record without its secret fields.

## Steps

1. Set `AHPD_AGENT_RECORD` to the record as JSON in the env `nestedHost` gives to `reach`.
2. Remove the secret fields from the record for a machine that gets nothing of the vault.
3. Set the same variable in the env `join.ts` starts its host inside with.
4. Read `AHPD_AGENT_RECORD` in the host at start, and open the record with the engine it names.
5. Serve that agent from memory, and never write it to the `agents` collection.
6. Refuse a record whose engine no loaded plugin registered, with a sentence that names the engine.

## Validation

- A fake Docker case: the record reaches `docker exec` as `-e AHPD_AGENT_RECORD`, and no argv holds its key.
- An ssh case: the remote command holds the record without `apiKey`.
- A server case: a host started with the variable lists the record's id in its root.
- The same case: the `agents` folder of that host stays empty.
- Run a cofold record session on a disposable machine on this host, and see a turn end.
- `pnpm typecheck` passes.

## Resume

- Done. A dialled node gets the record from `nodes.ts`, in the `env` of `node/open`, which `join.ts` already applies.
- The run by hand on a disposable machine is not done; container 05 p8 task 05 runs a cofold record session on dev02.
