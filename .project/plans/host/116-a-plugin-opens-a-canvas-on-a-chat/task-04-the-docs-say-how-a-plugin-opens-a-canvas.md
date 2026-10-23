---
title: The docs say how a plugin opens a canvas
status: todo
depends:
  - task-03-a-plugin-opens-a-canvas.md
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L160-L188](../../../../docs/plugins/PLUGINS.md#L160-L188) - the `PluginHost` method table"
  - "[code://docs/sdk/AHP.md](../../../../docs/sdk/AHP.md) - what this host serves of the protocol, and which root keys it reads"
  - "[code://docs/sdk/CHATS.md](../../../../docs/sdk/CHATS.md) - what a chat holds"
  - "[code://UPSTREAM.md#L42](../../../../UPSTREAM.md#L42) - the Pass 7 canvas box"
---

## Objective

The plugin docs list the three canvas calls and their rules.
The AHP docs say that this host serves the canvas channel to a connection at `0.10.0` or later.

## Files

- `UPDATE: docs/plugins/PLUGINS.md:160-188` - add `openCanvas`, `updateCanvas` and `closeCanvas`, and a short section after the table.
- `UPDATE: docs/sdk/AHP.md` - add the canvas channel, the version gate and `canvasesEnabled`.
- `UPDATE: docs/sdk/CHATS.md` - say that a chat lists its canvases and that a canvas goes with its chat.
- `UPDATE: UPSTREAM.md:42` - tick the canvas box and name this plan.

## Steps

1. Add a row for each call to the `PluginHost` table.
2. Write the section: the state the plugin gives, the resource it gets, the owner rule and the `url` rules.
3. Say in that section that the plugin clears `url` when its source stops.
4. Say in that section that a loopback `url` is not reachable from a remote client.
5. Say in that section that only the plugin closes a canvas, and a client cannot.
6. Add the canvas channel and the version gate to `AHP.md`, and add `canvasesEnabled` to the keys this host reads.
7. Add the canvases of a chat to `CHATS.md`.
8. Tick the Pass 7 canvas box in `UPSTREAM.md`.

## Validation

- Read each changed page and check that it names the three calls as `types/plugin.ts` declares them.
- Run `pnpm docs:build` and expect no dead link.

## Resume
