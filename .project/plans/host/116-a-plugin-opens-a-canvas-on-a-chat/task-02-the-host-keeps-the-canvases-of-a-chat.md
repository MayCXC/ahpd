---
title: The host keeps the canvases of a chat
status: todo
depends:
  - task-01-an-older-connection-gets-no-canvas-action.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/snapshots.ts#L73-L90](../../../../packages/sdk/src/host/snapshots.ts#L73-L90) - `snapshotOf`, where `ahp-canvas:` gets its branch"
  - "[code://packages/sdk/src/host/snapshots.ts#L310-L335](../../../../packages/sdk/src/host/snapshots.ts#L310-L335) - the chat snapshot and `movable`, the pattern for `canvases`"
  - "[code://packages/sdk/src/host/catalogue.ts#L224-L243](../../../../packages/sdk/src/host/catalogue.ts#L224-L243) - `movableMoved`, a host-owned chat action"
  - "[code://packages/sdk/src/host/routing.ts#L392-L397](../../../../packages/sdk/src/host/routing.ts#L392-L397) - `channelKind`, which must read a canvas as its chat's session"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L198-L206](../../../../packages/sdk/src/host/sessionmethods.ts#L198-L206) - a chat moved to another session"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1336-L1341](../../../../packages/sdk/src/host/sessionmethods.ts#L1336-L1341) - a removed session's chats"
  - "[code://packages/sdk/src/host/lifecycle.ts#L228-L238](../../../../packages/sdk/src/host/lifecycle.ts#L228-L238) - a closed session's chats"
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/common/canvasUri.ts - `buildCanvasUri` and `parseCanvasChatUri`
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/agentHostStateManager.ts#L1077-L1100 - `setCanvasState` and `_pruneChatCanvases`
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/agentService.ts#L9191-L9206 - the `NotFound` answer for a gone canvas
---

## Objective

The host keeps a store of canvases, and each canvas belongs to one live chat.
The store dispatches the canvas actions, answers the `ahp-canvas:` snapshot, and lists a chat's canvases in its snapshot.
A canvas goes when its chat goes.

## Files

- `CREATE: packages/sdk/src/host/canvases.ts` - the store: `open`, `update`, `close`, `snapshot`, `listOf`, `chatOf` and `forgetChat`.
- `UPDATE: packages/sdk/src/host.ts:1029` - build the store and put it on the context.
- `UPDATE: packages/sdk/src/host/context.ts` - add the store to the host context type.
- `UPDATE: packages/sdk/src/host/snapshots.ts:73-90` - answer an `ahp-canvas:` channel from the store, or `-32008` "Canvas is no longer available".
- `UPDATE: packages/sdk/src/host/snapshots.ts:310-335` - lay `canvases` over the chat state when the chat has one or more.
- `UPDATE: packages/sdk/src/host/routing.ts:392-397` - read an `ahp-canvas:` channel as the kind of the chat it names.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:198-206` - forget the canvases of a chat that moves.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1336-1341` - forget the canvases of a removed session's chats.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:228-238` - forget the canvases of a closed session's chats.
- `CREATE: packages/sdk/test/host-canvases.test.ts` - the store, the snapshots, the gate and the pruning.

## Steps

1. Build a resource as `ahp-canvas:/<base64url(chat)>/<uuid>`, and read the chat back from it.
2. Keep each resource with its chat, its plugin name and its `CanvasState`.
3. On `open`, keep the resource of an `instanceId` that is open on the chat, and make a new one otherwise.
4. Dispatch `canvas/stateChanged` on the resource first.
5. For a new resource, dispatch `chat/canvasesChanged` on the chat with the whole list after it.
6. On `update`, dispatch `canvas/stateChanged` with the new state whole.
7. On `close`, drop the resource and dispatch `chat/canvasesChanged` with the list, or `undefined` when it is empty.
8. Answer a subscribe to a kept resource with its state, and to any other resource with `-32008`.
9. Lay `canvases` over the chat snapshot only when the list is not empty.
10. Read a canvas channel in `channelKind` as its chat, so the users gate asks the chat's session.
11. Call `forgetChat` where a chat leaves `byChat`, and dispatch no action for a chat that is gone.
12. Write the resource, never the `url`, in every log line.

## Validation

- `host-canvases.test.ts`: an open dispatches `canvas/stateChanged` before `chat/canvasesChanged`.
- `host-canvases.test.ts`: the chat snapshot lists the canvas, and has no `canvases` after the close.
- `host-canvases.test.ts`: a subscribe to the canvas answers its state, and after the close answers `-32008`.
- `host-canvases.test.ts`: a second open with the same `instanceId` answers the same resource and sends no `chat/canvasesChanged`.
- `host-canvases.test.ts`: a person who cannot read the chat's session cannot subscribe to its canvas.
- `host-canvases.test.ts`: a removed session, a closed session and a moved chat each leave no canvas.
- `host-canvases.test.ts`: a connection that knows the session by another name gets the resource and the `url` unchanged.
- Run `pnpm --filter @ahpd/sdk test` and expect every case to pass.
- Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` after the run.

## Resume
