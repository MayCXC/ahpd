---
title: A backend hands its list to the host
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/events.ts#L28-L47](../../../../packages/sdk/src/types/events.ts#L28-L47) - `EventName`, the closed set of host events"
  - "[code://packages/sdk/src/types/events.ts#L184-L196](../../../../packages/sdk/src/types/events.ts#L184-L196) - `ToolCallEvent`, the shape of an event about a call"
  - "[code://packages/sdk/src/types/plugin.ts#L919](../../../../packages/sdk/src/types/plugin.ts#L919) - `on`, how a plugin hears an event"
---

## Objective

A backend hands the host a harness's whole list, or one change to it, for a session and a chat.
A plugin hears it, so the tasks plugin can write the session's plan.

## Files

- `UPDATE: packages/sdk/src/types/events.ts:28-47` - add the event `plan_update`, with its type.
- `UPDATE: packages/sdk/src/types/session.ts` - add the call a backend makes to hand the host a list.
- `UPDATE: packages/sdk/src/host/spawn.ts` - raise the event when a backend makes the call.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - a backend's call reaches a plugin's handler.

## Steps

1. Add the host event `plan_update`, which a plugin hears with `on`.
2. Carry the session, the chat, the turn, the harness, the tool and the sender in the event.
3. Carry either a whole list of entries or one change with the harness's own id.
4. Give each entry its text, its status and its priority, as the harness sent them.
5. Add the event to the list in `docs/plugins/PLUGINS.md`.

## Validation

- `packages/sdk/test/host-tools.test.ts`: a fake backend hands a whole list, and a plugin's handler gets it with the session and the sender.
- `packages/sdk/test/host-tools.test.ts`: a fake backend hands one change, and the handler gets the harness's id.
- `pnpm typecheck` passes.

## Resume
