---
title: A command's turn is kept when it ends
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L1428-L1432](../../../../packages/sdk/src/host/spawn.ts#L1428-L1432) - the end of a command turn"
  - "[code://packages/sdk/src/host/spawn.ts#L1547-L1551](../../../../packages/sdk/src/host/spawn.ts#L1547-L1551) - `onTurnRecorded`"
  - "[code://packages/sdk/src/host/outputs.ts#L126-L167](../../../../packages/sdk/src/host/outputs.ts#L126-L167) - where a file is, and how one is written and read"
  - "[code://packages/sdk/src/host/context.ts#L49](../../../../packages/sdk/src/host/context.ts#L49) - `HostContext`, which each area joins"
  - "[code://packages/sdk/src/host.ts#L1107](../../../../packages/sdk/src/host.ts#L1107) - where host 129's area is built"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts#L86-L109 - `record` and `findAnchorTurnId`
---

## Objective

At the end of a command turn, the host writes the turn to one file in the session's folder.
The file names the turn's anchor by its transcript id, and a `seq` that orders the chat's local turns.

## Files

- `CREATE: packages/sdk/src/host/localturns.ts` - the area: where a chat's local turns are, keep one, read and check them, and each chat's transcript ids.
- `UPDATE: packages/sdk/src/host/context.ts:49` - `HostContext` joins the new area.
- `UPDATE: packages/sdk/src/host.ts:1107` - build the area after host 129's.
- `UPDATE: packages/sdk/src/host/spawn.ts:1428-1432` - at the end of a command turn, keep it.
- `UPDATE: packages/sdk/src/host/spawn.ts:1547-1551` - `onTurnRecorded` gives the area the turn's transcript id.
- `CREATE: packages/sdk/test/host-local-turns.test.ts` - the cases below.

## Steps

1. Write the folder of a chat: the session's folder, then `turns`, then the hex SHA-256 of the chat.
2. Write the file of a local turn in it: the hex SHA-256 of the turn id, then `.json`.
3. Answer no folder where the store has no session folder, as `outputs.ts` does.
4. Hold each chat's transcript ids in a map from the turn id, written by `turnRecordedAs`.
5. Write `keepLocalTurn(session, chat, turns, turnId)`, which finds the turn in `turns` and does nothing when it is absent.
6. Find the anchor: walk back from the turn, and take the first turn that has no file of its own.
7. Write the anchor as the turn's transcript id from the map, or as its own id.
8. Read the highest `seq` of the chat's files, and write `seq` as one more.
9. Write `{ version: 1, turnId, anchor, seq, turn }` with `writeJsonAtomic` and a folder mode of `0o700`.
10. Log a write that fails, and go on.
11. In `spawn`, call `keepLocalTurn` with the chat's `allTurns()` before `commandTurns` forgets the turn.
12. In `onTurnRecorded`, call `turnRecordedAs` when the two ids differ.

## Validation

- `packages/sdk/test/host-local-turns.test.ts`: a `!` turn that completes is a file in the session's folder, under its chat.
- The same file for a turn that a stop cancels, and for one that ends with `chat/error`.
- A question's turn is no file.
- The anchor is the turn before, by the id from `onTurnRecorded`, or by its own id without one.
- A second `!` turn after the first has the same anchor and a higher `seq`.
- A `!` turn before every other turn has no anchor.
- A memory store keeps nothing.
- `pnpm vitest run packages/sdk/test/host-local-turns.test.ts` passes.

## Resume

- **Done:** 2026-10-27.
  The area's own cases are in `packages/sdk/test/localturns.test.ts`, which the plan did not name.
  They need the new area, so they live apart from the host's cases, which run on the code before this plan.

