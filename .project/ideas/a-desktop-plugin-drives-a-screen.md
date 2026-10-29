---
title: A desktop plugin drives a screen
created: 2026-10-29
refs:
  - "[code://packages/computer/src/tools.ts#L140](../../packages/computer/src/tools.ts#L140) - the computer package runs commands, it does not drive a desktop"
  - "[code://packages/sdk/src/tools/mcpcontent.ts](../../packages/sdk/src/tools/mcpcontent.ts) - image results already become MCP image blocks"
  - https://github.com/trycua/cua - Cua Driver, MIT, with Linux, macOS and Windows binaries
---

A `desktop` plugin lets an agent see and use a desktop: list apps, read the screen, click, type and scroll.
The first provider starts `cua-driver mcp` and passes its tools through.
It is a separate plugin, not part of the computer package.
The user allows each app for each session, and can revoke it.
A disposable computer with Xvfb could run the same driver, which gives a desktop inside a machine.
