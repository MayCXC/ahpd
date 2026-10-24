---
title: The host answers vscode/stopBackgroundWork
status: done
depends: [task-01-a-backend-reports-a-task-the-host-draws.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/vscodemethods.ts#L53-L75](../../../../packages/sdk/src/host/vscodemethods.ts#L53-L75) - `VscodeMethods`"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L372-L381](../../../../packages/sdk/src/host/vscodemethods.ts#L372-L381) - the `INVALID_PARAMS` refusal"
  - "[code://packages/sdk/src/host/gate.ts#L166](../../../../packages/sdk/src/host/gate.ts#L166) - `chat:cancel`"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/protocolServerHandler.ts#L3116-L3140 - the request's checks"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/agentService.ts#L2063-L2071 - the false answers"
---

## Objective

A client stops a background task with `vscode/stopBackgroundWork`, and the host calls that task's `stop`.

## Files

- `UPDATE: packages/sdk/src/host/vscodemethods.ts` - the request.
- `UPDATE: packages/sdk/src/host/gate.ts` - the request needs `chat:cancel`.
- `UPDATE: packages/sdk/src/host/background.ts` - find a record and call its `stop`.
- `UPDATE: docs/sdk/AHP.md` - a row for the request.
- `CREATE: packages/sdk/test/host-stop-background-work.test.ts` - the cases below.
- `UPDATE: packages/sdk/test/users-gate-tables.test.ts` - the new gate row.

## Steps

1. Refuse an empty `id`, or a `chat` that is not `ahp-chat:`, with `INVALID_PARAMS`.
2. Gate the request on `chat:cancel` for the chat's session.
3. Answer `{ stopped: false }` for an unknown chat, an unknown id or a task with no `stop`.
4. Call `stop`, and answer `{ stopped }` with its result.
5. Answer `{ stopped: false }` when `stop` rejects, and log the error.
6. Add the docs row.
7. Write the tests.
8. Set this task and its plan row to `implemented`.

## Validation

- A task with `stop` answers its result, and `stop` ran once.
- An unknown id and a task with no `stop` answer false.
- An empty id is `INVALID_PARAMS`.
- The gate refuses a client without `chat:cancel`.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** built. `vscode/stopBackgroundWork` checks `chat` and `id`, refuses an empty id and a chat that is not `ahp-chat:` with `INVALID_PARAMS`, and answers `{ stopped }` from `ctx.background.stop(chat, id)`. That finds the record through `chatOf` and calls the backend's stop. It answers false for an unknown chat, an unknown id, a task with no stop and a stop that rejects, and it logs the rejection. The gate row is `chat:cancel` and `SERVED` went from 50 to 51. The docs row in `docs/sdk/AHP.md` names the request in its section and in the departures table, and `wire.test.ts` names the same row. The request's `stop` is now the plan's `() => Promise<boolean>`; task 01 had typed it `boolean`, so its row flag and its test moved with it. Seven cases pass in `test/host-stop-background-work.test.ts`.
- **Next action:** task 04, the nested host's inner tasks.
- **Open questions:** none.
- **Watch out for:** the row stays until the backend removes it; the request does not remove it.
  `session:write` covers every `chat:*` write, so a role written with it holds `chat:cancel` too; the gate case uses a role with neither.
