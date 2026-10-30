---
title: A steered bot chat message is its own turn - implemented
date: 2026-10-30
refs:
  - "[code://packages/bot/src/chat.ts](../../../../packages/bot/src/chat.ts)"
  - "[code://packages/bot/src/wake.ts](../../../../packages/bot/src/wake.ts)"
  - "[code://packages/sdk/src/types/session.ts](../../../../packages/sdk/src/types/session.ts)"
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
  - "[code://docs/updates/v0_14.md](../../../../docs/updates/v0_14.md)"
---

A message a person sends in a bot chat while a turn runs shows as its own turn, live and after a restart. The back session's answer after it lands under that turn. The turn carries the sender of the steered message, so a correction another session's agent sent does not show as the person's.

## What was built

- [`code://packages/bot/src/chat.ts`](../../../../packages/bot/src/chat.ts) - `steer` ends the open turn as `complete` with what it holds. It begins a turn of its own with the steered text and its sender. `finish` takes a `next` flag, so the split leaves the queue waiting. `logAt` reads an old `steering` line as a finished turn of its own, with a derived id.
- [`code://packages/bot/src/wake.ts`](../../../../packages/bot/src/wake.ts) - no code change; `answering` already takes the turn id of the message, so a steer moves the entry to the new turn. Its comments say so.
- [`code://packages/sdk/src/types/session.ts`](../../../../packages/sdk/src/types/session.ts) - `Session.steer` takes an optional `from?: MessageFrom` after `attachments`.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - a steering message hands `messageFrom(message)` to `session.steer`.
- [`code://docs/updates/v0_14.md`](../../../../docs/updates/v0_14.md) - a `### Bots` line under 0.14.0 for the split, and one under 0.14.1 for the sender.

## Verified

- `packages/bot/test/bot-chat.test.ts` (16 cases): a steer sends `chat/turnComplete` then `chat/turnStarted`. The reply lands in the steered turn, and a reload reads `hello` then `stop that`. A queued message waits for the steered turn, and an old `steering` line reads as a turn. A steer carries `origin` and `_meta`, and each turn shows one subagent call.
- `packages/bot/test` (14 files, 188 cases) passed, including the wake case where a steer into a working back session answers on the new turn.
- `packages/sdk/test/host-chats.test.ts`, `host-attachments.test.ts` and `host-input.test.ts` (87 cases) passed.
- `pnpm exec tsc -p tsconfig.json --noEmit`, `pnpm -s build` and `pnpm -s boundary` passed.
- The plan's final verification checklist runs by hand on a real bot, in review.

## Departures from the plan

- None.

## Left for later

- The final verification checklist: the live turns after a steer, and the same two turns after a daemon restart. This plan set nothing aside, so there is no [deferred.md](deferred.md).
