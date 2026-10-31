---
title: A plugin gives a view
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L799-L851](../../../../packages/sdk/src/types/plugin.ts#L799-L851) - `Alert`, `alert` and `clearAlert`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L895-L907](../../../../packages/sdk/src/plugins/plugins.ts#L895-L907) - the loader options `alert` and `clearAlert`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1184-L1185](../../../../packages/sdk/src/plugins/plugins.ts#L1184-L1185) - the plugin host passes them on"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1488-L1496](../../../../packages/sdk/src/plugins/plugins.ts#L1488-L1496) - `registerMethod` and `contribution.methods`"
  - "[code://packages/sdk/src/host/canvases.ts#L144-L155](../../../../packages/sdk/src/host/canvases.ts#L144-L155) - the URL check to share"
---

## Objective

`PluginHost` gets `showView(view)` and `clearView()`.
The sdk checks a view before it goes to the loader's sink, and refuses one that a client cannot draw.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:799-851` - add `PluginView`, `ViewComponent`, `showView` and `clearView`, with their docs.
- `CREATE: packages/sdk/src/plugins/view.ts` - `checkView(view, by, methods)`, which throws an error that names the rule.
- `CREATE: packages/sdk/src/weburl.ts` - `isWebUrl(text)`, the check of an absolute http(s) URL with a host.
- `UPDATE: packages/sdk/src/host/canvases.ts:144-155` - use `isWebUrl`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:895-907` - add the loader options `showView` and `clearView`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1184-1185` - check the view, then pass it to `options.showView`.
- `UPDATE: packages/sdk/src/index.ts` - export `PluginView` and `ViewComponent`.
- `CREATE: packages/sdk/test/plugin-view.test.ts` - the cases of this task.
- `UPDATE: docs/plugins/PLUGINS.md:874` - add a section on `showView` and `clearView` after `alert`.

## Steps

1. Add `PluginView` as `{ root: string; components: Record<string, ViewComponent> }`.
2. Add `ViewComponent` as `{ id, component, child?, children?, action?, [prop]: unknown }`.
3. Add `showView(view)` and `clearView()` to `PluginHost`, next to `clearAlert`.
4. Move the URL check of `canvases.ts` into `isWebUrl`, and call it there.
5. In `checkView`, refuse a component name that is not in the set of the plan's *Answers*.
6. Refuse a key that is not the component's `id`, and a `root` that is not a key.
7. Refuse a `child` or a `children` entry that names no component.
8. Refuse a component that two parents name, and a cycle from `root`.
9. Refuse more than 200 components, or more than 64 KiB of JSON.
10. Refuse a Link whose `href` fails `isWebUrl`.
11. Refuse an `action` that is not `{ event: { name, context? } }`.
12. Refuse an event `name` that is not in the plugin's `contribution.methods`.
13. Refuse a `context` that is not a plain JSON object.
14. In the plugin host, call `checkView` with the plugin's methods, then `options.showView`.
15. Pass `clearView` to `options.clearView`.
16. Add a test for each refusal of steps 5 to 13.
17. Add a test that a good view and a clear reach the loader's sinks.
18. Add a test that a canvas with a bad URL is still refused.
19. Document the calls, the components, the limits and the Button in `PLUGINS.md`.

## Validation

- `pnpm vitest run packages/sdk/test/plugin-view.test.ts` passes.
- `pnpm vitest run packages/sdk/test` passes, with the canvas tests.
- `pnpm typecheck` is clean.

## Resume
