---
title: A working directory action is answered as the protocol says
status: todo
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L583-L662](../../../../packages/sdk/src/host/chatactions.ts#L583-L662) - the session's three working directory actions"
  - "[code://packages/sdk/src/host/chatactions.ts#L1040-L1080](../../../../packages/sdk/src/host/chatactions.ts#L1040-L1080) - the chat's two"
  - "[code://packages/sdk/src/host/lifecycle.ts#L893-L903](../../../../packages/sdk/src/host/lifecycle.ts#L893-L903) - the restart's announcement of a move"
---

## Objective

Each working directory action does what the protocol's reducer does with it, and is answered: changed, by the client's action after the restart; unchanged, to its sender alone; naming no folder, refused.

## Files

- `UPDATE: packages/sdk/src/host/chatactions.ts:583-662` - the session's folders put through the action as one list; `echoTo` for no change; a refusal for no folder; a new first folder handed to the restart as a move.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1040-1080` - the chat's set of a held folder and removal of an absent one answered with `echoTo`, and no folder refused.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:731-733` - the first folder clients hold, as the backend reports it, read before the restart.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:893-903` - a moved first folder said as `{ directory, replacement }`, and a first folder where there was none as a set.
- `UPDATE: docs/sdk/AHP.md` - the five rows and "An action that changes nothing is not a change".
- `UPDATE: packages/sdk/test/host-files.test.ts` - the cases, and the move cases reading the announcement's two fields.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the move case reading the announcement's two fields.
- `UPDATE: packages/sdk/test/ahp-test-cases.test.ts` - the six replacement cases, which now run and agree.

## Steps

1. Write the cases and run them on `27bfa9b4` to see the no-ops dropped, the replacement misread, the empty folder let through and the move said without `replacement`.
2. Put the session's folders through the action as the reducer would, and answer no change with `echoTo`.
3. Hand a new first folder to the restart as a move, the rest as they are.
4. Say a moved first folder from the one clients hold to the one it went to.
5. Answer the chat's no-ops, and refuse an action naming no folder.
6. Bring the protocol case lists and AHP.md to what the host does.

## Validation

- The new cases in `host-files.test.ts` fail on `27bfa9b4` and pass after the change, and so do the move cases in `host-files.test.ts` and `host-tools.test.ts`.
- `host-files`, `host-tools`, `host-trust`, `host-chats` and `ahp-test-cases` pass.
- `pnpm run typecheck` and `pnpm run boundary` report no errors.

## Resume
