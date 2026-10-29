---
title: A registration returns a disposer
created: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1054](../../packages/sdk/src/types/plugin.ts#L1054) - registerTool returns nothing"
  - "[code://packages/sdk/src/types/plugin.ts#L1290](../../packages/sdk/src/types/plugin.ts#L1290) - registerClose is apart from what it closes"
---

Each `register*` call on `PluginContext` returns a function that removes what it registered.
A plugin can then drop one tool or trigger while it runs, without a reload.
Each cleanup sits beside its setup, and an unload runs the disposers in reverse order.

Related: [swapping a port restarts only its users](swapping-a-port-restarts-only-its-users.md).
