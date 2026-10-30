---
title: Only the echo carries the origin
status: todo
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host.ts#L719-L953](../../../../packages/sdk/src/host.ts#L719-L953) - `applying`, `dispatch`, `refuse` and `echoTo`"
  - "[code://packages/sdk/src/host/chatactions.ts#L383-L560](../../../../packages/sdk/src/host/chatactions.ts#L383-L560) - the wake and the turn"
---

## Objective

The echo of a client's dispatch carries its origin, said now or after an await.
No other action carries it.

## Files

- `UPDATE: packages/sdk/src/host.ts:719-953` - `applying` holds the dispatch, `owed` holds what a backend owes, and `dispatch`, `refuse` and `echoTo` read both.
- `UPDATE: packages/sdk/src/host.ts:1704-1775` - `applyNow` holds the type and the turn, and the docblock of `dispatchAction` says only the echo carries the origin.
- `UPDATE: packages/sdk/src/host/context.ts:322-330` - the documented default of `dispatch`, and `owe`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:383-431` - a turn on a sleeping session is applied again through `conn.applyNow` once it is awake.
- `UPDATE: packages/sdk/src/host/chatactions.ts:517-560` - a turn is owed before it is handed to its backend.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1115-1152` - a stop is owed under the turn it stops.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1534` - a chat started over names the origin.
- `UPDATE: packages/sdk/src/host/actions.ts:394` - the echo of a daemon key names the origin.
- `CREATE: packages/sdk/test/echo-origin.test.ts` - the echo and the actions it causes, a backend that answers late, a machine, a stop.
- `UPDATE: packages/sdk/test/session-wake.test.ts` - a prompt that wakes a session.
- `UPDATE: packages/sdk/test/policy-checks.test.ts` - a turn the check answers later.
- `UPDATE: packages/sdk/test/host-snapshots.test.ts` - a Claude turn that switches models first.
- `UPDATE: packages/sdk/test/host-chats.test.ts` - a chat started over.
- `UPDATE: packages/sdk/test/root-config.test.ts` - a daemon key written through the port.
- `UPDATE: packages/sdk/test/nested-proxy.test.ts` - a turn on a nested session.

## Steps

1. Write each case and run it on `920d154a` to see the origin missing or misplaced.
2. Hold the dispatch's type and turn in `applying`, and give the origin to its echo alone.
3. Add `owed`, set it through `owe`, and read it in `dispatch` for an action with no origin named.
4. Mark the dispatch answered in `refuse`, in `echoTo` and in an echo that names its origin.
5. Clear what a turn owes when the turn ends.
6. Apply a turn on a sleeping session again through `conn.applyNow` after the wake.
7. Owe the turn before `beginOrRun`, and the stop before `Session.cancel`.
8. Pass the origin to the start over and to the daemon key's echo.
9. Rewrite the comments that describe the origin of every action sent during an apply.

## Validation

- `packages/sdk/test/echo-origin.test.ts` and the new case in each updated test file fail before the change and pass after it.
- The touched suites pass.
- The suites that assert an origin pass: presence, catalogue, tools, names, attachments, sleep, turning, automations.
- The fixed keys, the protocol cases and the webhook bot pass.
- `pnpm run typecheck` reports no errors.

## Resume

