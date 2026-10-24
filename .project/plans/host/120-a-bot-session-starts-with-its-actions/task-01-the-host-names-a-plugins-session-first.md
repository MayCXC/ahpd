---
title: The host names a plugin's session first
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L851](../../../../packages/sdk/src/types/plugin.ts#L851) - `PluginHost.startSession` gains the door"
  - "[code://packages/sdk/src/types/plugin.ts#L230](../../../../packages/sdk/src/types/plugin.ts#L230) - `PluginStarts.start` carries it"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1128-L1135](../../../../packages/sdk/src/plugins/plugins.ts#L1128-L1135) - the plugin boundary passes it on"
  - "[code://packages/sdk/src/host/automations.ts#L686-L697](../../../../packages/sdk/src/host/automations.ts#L686-L697) - `beginSession` names the URI"
  - "[code://packages/sdk/src/host/automations.ts#L969-L970](../../../../packages/sdk/src/host/automations.ts#L969-L970) - `startForPlugin`"
---

## Objective

A plugin that starts a session can pass a function.
The host calls it with the session's URI before it makes the tree or spawns.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:851` - `startSession(wanted, named?)`, with the docblock saying when `named` is called.
- `UPDATE: packages/sdk/src/types/plugin.ts:230` - `PluginStarts.start` takes `named?` as its second argument.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1128-1135` - refuse a `named` that is not a function, and pass it to `start`.
- `UPDATE: packages/sdk/src/host/automations.ts:686-697` - `beginSession` takes `named?` and calls it after the URI is named.
- `UPDATE: packages/sdk/src/host/automations.ts:969-970` - `startForPlugin` and `beginPluginSession` pass `named` through.
- `UPDATE: packages/sdk/test/plugin-start-session.test.ts` - the door is called once, with the URI the start answers, before the backend spawns.
- `UPDATE: CHANGELOG.md` - a plugin is told its session's URI before the session spawns.

## Steps

1. Add `named?: (uri: string) => void` to `startSession` and to `PluginStarts.start`.
2. Refuse a `named` that is not a function at the plugin boundary, with the boundary's `miss` words.
3. Pass `named` from `startForPlugin` through `beginPluginSession` to `beginSession`.
4. Call `named(uri)` in `beginSession` right after `unheld(uri)`, before `isolated`.
5. Catch a throw from `named`, report it as a host problem, and continue the start.
6. Leave an automation's start as it is.
7. Add the tests, with a fake backend that records the order of the call and the spawn.
8. Update the CHANGELOG.
9. Set this task and its plan row to `implemented`.

## Validation

- The host calls `named` once, with the URI the start answers.
- The host calls `named` before the backend spawns.
- A `named` that throws does not stop the start.
- A plugin that passes no `named` starts as it does now.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and the sdk tests pass.

## Resume

- **Done so far:** `PluginStarts.start` and `PluginHost.startSession` take `named?`, a function the host calls with the session's URI. `plugins.ts` refuses a `named` that is not a function with `miss` words and passes it to `start`. `startForPlugin` and `beginPluginSession` take it through, and `beginSession` calls `named(uri)` right after `unheld(uri)`, before `isolated`. A throw from it is logged as a host line naming the URI and the start goes on. An automation's start passes no `named`, so it is unchanged. Tests: the door is called once with the URI the start answers and before the backend spawns, a throw does not stop the start and is logged, and a non-function is refused at the boundary.
- **Next action:** none - built.
- **Files:** `packages/sdk/src/types/plugin.ts`, `packages/sdk/src/plugins/plugins.ts`, `packages/sdk/src/host/automations.ts`, `packages/sdk/test/plugin-start-session.test.ts`, `CHANGELOG.md`.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the fake backend in the order test records the spawn inside `create`, which is where the host asks the backend to start. `beginSession` is shared with an automation's run, so the door is optional there and none is passed.
