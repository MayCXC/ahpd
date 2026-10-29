---
title: Swapping a port restarts only the plugins that use it
created: 2026-10-29
refs:
  - "[code://packages/server/src/applyplugins.ts#L139-L159](../../packages/server/src/applyplugins.ts#L139-L159) - a plugin that holds a port or a URI scheme needs a daemon restart"
---

A port becomes a service that other plugins name as a dependency.
When its provider is added, reloaded, reconfigured or removed, only the plugins that use the port restart.
Today the daemon restarts instead.
This is the largest gain of the plugin ideas, and the largest change.

Related: [a registration returns a disposer](a-registration-returns-a-disposer.md).
