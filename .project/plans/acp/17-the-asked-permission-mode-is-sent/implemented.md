---
title: The permission mode a session asks for is sent - implemented
date: 2026-10-19
refs:
  - git://d362c9ca
  - git://9a31679a
  - "[code://packages/agent-acp/src/session/config.ts](../../../../packages/agent-acp/src/session/config.ts) - `sendAskedMode`, beside `setConfig`"
  - "[code://packages/agent-acp/src/session/opening.ts](../../../../packages/agent-acp/src/session/opening.ts) - the open reads the asked mode and sends it on every path"
---

An ACP session that starts with a `permissionMode` now runs in that mode.
The open sends the asked mode when the server offers it and is in another one.
It does so on the first open and on a reopen after a death.

## What was built

- [`code://packages/agent-acp/src/session/config.ts`](../../../../packages/agent-acp/src/session/config.ts) - `sendAskedMode(held, asked)` on `ctx`. It sends through the `mode` option when there is one, else `session/set_mode`. On a failure it puts back the server's mode and logs the reason.
- [`code://packages/agent-acp/src/session/opening.ts`](../../../../packages/agent-acp/src/session/opening.ts) - the open reads `settings.permissionMode` before any learn call. It calls the send on the fork, resume and new paths, before `onHandshake`.

## Verified

- `packages/agent-acp/test/agent-acp-catalog.test.ts` has five cases from `9a31679a`, named in the task 02 Resume.
- In a throwaway worktree at `d362c9ca^` with that test file, three of the five fail.
- `opens a session in the mode it was started with` and `opens a session in its asked mode through the server mode option` find no mode request.
- `sends the mode again when the server is opened after a death` finds one `session/set_mode` where it expects two.
- With the `config.ts` and `opening.ts` of `d362c9ca` in the same worktree, the 16 cases that name a mode pass.
- Task 01's gates: schema, build, typecheck, boundary, `tools/` and vitest pass, with 312 files, 5382 passed and 1 skipped.
- Softov reviewed tasks 01 and 02 on 2026-10-19.

## Departures from the plan

- The send is `ctx.sendAskedMode`, not `setConfig`, because `setConfig` calls `ctx.open()`.
- Task 02's validation says the new tests fail on the code before task 01. Two do not: `sends nothing for a session that asks for the mode the server is already in` and `leaves a session in the server mode when the one it asked for is not offered`. The old code sends no mode, so it passes both. They guard against a fix that sends too much.
- The plan stayed at `planned` while its tasks were built, and goes to `built` from there.

## Left for later

- `learnModels` still writes the server's model over `settings.model` at the open. The plan named it and left it out.
