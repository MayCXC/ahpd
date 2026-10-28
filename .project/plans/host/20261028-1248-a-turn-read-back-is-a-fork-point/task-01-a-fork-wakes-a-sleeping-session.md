---
title: A fork wakes a sleeping session
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1111-L1117](../../../../packages/sdk/src/host/sessionmethods.ts#L1111-L1117) - `createChat`, which refuses a session that is not live"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L56-L67](../../../../packages/sdk/src/host/sessionmethods.ts#L56-L67) - what the session methods take from the host context"
  - "[code://packages/sdk/src/host/chatactions.ts#L477-L501](../../../../packages/sdk/src/host/chatactions.ts#L477-L501) - the action applied again to the session that is live"
  - "[code://packages/sdk/src/host/tooling.ts#L1666-L1694](../../../../packages/sdk/src/host/tooling.ts#L1666-L1694) - hold, wake, act, release"
  - "[code://packages/sdk/test/session-wake.test.ts](../../../../packages/sdk/test/session-wake.test.ts) - the wake cases, and the counting backend they share"
---

## Objective

A `createChat` call on a session asleep in the catalogue wakes the session and makes the chat in it.
A fork of a sleeping chat then forks at its turn, as on a live session.

## Files

- `UPDATE: packages/sdk/src/host/sessionmethods.ts:56-67` - take `owners`, `wake` and `hold` from the host context.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:358` - name the methods object, so that `createChat` can call itself again.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1111-1117` - wake a session asleep in the catalogue, and make the call again on the live session.
- `UPDATE: packages/sdk/test/session-wake.test.ts` - a fork of a sleeping chat, and a new chat in a sleeping session.

## Steps

1. Write the tests first, and see each fail on main with -32001.
2. Name the returned methods object `methods`, and return it.
3. Take `owners`, `wake` and `hold` from the host context.
4. In `createChat`, answer -32002 for a session whose agent is not loaded, as `fetchTurns` does.
5. Hold a session that is asleep in the catalogue, wake it, and call `methods.createChat` again.
6. Release the hold when that call ends, however it ends.
7. Refuse with -32001 when the wake leaves no live session.
8. Set this task and the plan's Tasks table to `done`.

## Validation

- `session-wake.test.ts`: a fork of a sleeping chat wakes the session, and the fork starts at the turn's point.
- `session-wake.test.ts`: a new chat in a sleeping session wakes the session and opens.
- `pnpm -s boundary`, `pnpm -s typecheck` and `pnpm -s build` pass.
- The sdk suite passes at one worker.

## Resume

- **Done so far:** steps 1 to 8. Both cases answered -32001 on main.
- **Next action:** none.
- **Open questions:** none.
