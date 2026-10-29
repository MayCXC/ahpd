---
title: Plugins declare typed events
created: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/events.ts#L30](../../packages/sdk/src/types/events.ts#L30) - the closed EventName union"
  - "[code://packages/sdk/src/types/events.ts#L350](../../packages/sdk/src/types/events.ts#L350) - handlers observe only"
---

A plugin declares its own events by declaration merging, and other plugins listen to them with full types.
Today `EventName` is a closed union in the SDK, so only the host can add an event.
The events stay observe-only, as host events are.
