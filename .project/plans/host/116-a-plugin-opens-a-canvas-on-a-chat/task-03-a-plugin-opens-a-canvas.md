---
title: A plugin opens, updates and closes a canvas
status: todo
depends:
  - task-02-the-host-keeps-the-canvases-of-a-chat.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L740-L746](../../../../packages/sdk/src/types/plugin.ts#L740-L746) - `sessionOwner`, a late-bound call with its comment"
  - "[code://packages/sdk/src/types/plugin.ts#L855-L891](../../../../packages/sdk/src/types/plugin.ts#L855-L891) - `planChanged` and `sessionMetaChanged`, the calls to put the new ones beside"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1276-L1287](../../../../packages/sdk/src/plugins/plugins.ts#L1276-L1287) - `planChanged`, which throws by name until a host fills it in"
  - "[code://packages/sdk/src/host/facts.ts#L598-L601](../../../../packages/sdk/src/host/facts.ts#L598-L601) - the host fills a late-bound call in after the fold"
  - "[code://packages/sdk/src/host/trust.ts#L172](../../../../packages/sdk/src/host/trust.ts#L172) - a root key read from `rootConfig`"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L205-L211](../../../../packages/sdk/src/vscoderootconfig.ts#L205-L211) - `canvasesEnabled` and its comment"
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/agentService.ts#L6005-L6048 - `_assertCanvasesEnabled` and its message
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L4303-L4320 - `_canvasSource`, the http(s) check
---

## Objective

`PluginHost` has `openCanvas(chat, state)`, `updateCanvas(resource, state)` and `closeCanvas(resource)`.
Each call goes to the host's canvas store and refuses a bad argument by name.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:855-891` - declare the three calls, with a comment on each.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1276-1287` - add the three calls beside `planChanged`, and send each to the host's store with the plugin's name.
- `UPDATE: packages/sdk/src/host/facts.ts:598-601` - fill the store in for every plugin after the fold.
- `UPDATE: packages/sdk/src/host/canvases.ts` - check the arguments, the owner and `canvasesEnabled`.
- `UPDATE: packages/sdk/src/vscoderootconfig.ts:205-211` - say that this host reads `canvasesEnabled`.
- `CREATE: packages/sdk/test/plugin-canvases.test.ts` - the three calls through a plugin.

## Steps

1. Declare `openCanvas(chat: string, state: CanvasState): string` and say that it answers the canvas resource.
2. Declare `updateCanvas(resource: string, state: CanvasState): void` and say that it replaces the state whole.
3. Declare `closeCanvas(resource: string): void` and say that a gone resource does nothing.
4. Throw by name from each call when there is no host yet, as `planChanged` does.
5. Throw `Canvases are disabled.` unless `rootConfig.canvasesEnabled` is true.
6. Refuse a chat that the host does not have live.
7. Refuse a state with no `instanceId`, `extensionId` or `canvasId`.
8. Refuse a `url` that is not absolute http(s) with an authority, and do not write the `url` in the error.
9. Refuse an update or a close from a plugin that did not open the canvas.
10. Add the three calls to the list of calls in the `vscoderootconfig.ts` header comment.

## Validation

- `plugin-canvases.test.ts`: a call with no host yet throws by name.
- `plugin-canvases.test.ts`: with `canvasesEnabled` off, `openCanvas` throws the message `Canvases are disabled.`
- `plugin-canvases.test.ts`: with the key on, `openCanvas` answers an `ahp-canvas:` resource and the chat lists it.
- `plugin-canvases.test.ts`: `updateCanvas` without `url` sends a state without `url`.
- `plugin-canvases.test.ts`: a `file:` url, a relative url and a chat that is not live are each refused.
- `plugin-canvases.test.ts`: a second plugin cannot update or close the first plugin's canvas.
- `plugin-canvases.test.ts`: `closeCanvas` twice does nothing the second time.
- Run `pnpm --filter @ahpd/sdk test` and expect every case to pass.
- Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` after the run.

## Resume
