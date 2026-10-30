---
title: A steered turn carries its sender
status: todo
depends: [task-01-a-steer-starts-its-own-turn.md]
layer: "sdk, bot"
refs:
  - "[code://packages/sdk/src/types/session.ts#L566](../../../../packages/sdk/src/types/session.ts#L566) - `steer`, which takes no sender"
  - "[code://packages/sdk/src/host/chatactions.ts#L1188](../../../../packages/sdk/src/host/chatactions.ts#L1188) - the host calls `steer` without `messageFrom(message)`"
  - "[code://packages/sdk/src/host/chatactions.ts#L423](../../../../packages/sdk/src/host/chatactions.ts#L423) - a new turn passes `messageFrom(message)`, the pattern to copy"
  - "[code://packages/bot/src/chat.ts#L1004](../../../../packages/bot/src/chat.ts#L1004) - the steered turn begins with no sender"
  - "[code://packages/bot/test/bot-chat.test.ts#L365-L396](../../../../packages/bot/test/bot-chat.test.ts#L365-L396) - the steer test"
---

## Objective

A steered turn in a bot chat carries the sender of the steered message.
Today `steer` takes no sender, so the new turn shows the default user origin.

## Files

- `UPDATE: packages/sdk/src/types/session.ts:566` - `steer` takes an optional `from?: MessageFrom` after `attachments`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1188` - pass `messageFrom(message)` to `steer`.
- `UPDATE: packages/bot/src/chat.ts:1004` - begin the steered turn with that sender.
- `UPDATE: packages/bot/test/bot-chat.test.ts:365-396` - a steer with an origin and `_meta` shows them on the new turn.
- `UPDATE: docs/updates/v0_14.md` - the steered turn shows who sent it.

## Steps

1. Add `from?: MessageFrom` as the last parameter of `steer` in `session.ts`, and say what it is in the doc comment.
2. Pass `messageFrom(message)` to `session.steer` in `chatactions.ts`.
3. Take `from` in the bot chat's `steer`, and pass it to `beginTurn`.
4. Leave the other backends as they are: the parameter is optional, and they ignore it.
5. Add a bot chat case: a steer with `origin` and `_meta` gives a `chat/turnStarted` with the same `origin` and `_meta`.
6. Add a line under 0.14.1 in `docs/updates/v0_14.md`.
7. Run the bot tests and the sdk chat action tests, and set this task and the plan row to `implemented`.

## Validation

- `bot-chat.test.ts`: a steered message with `origin: { kind: 'agent' }` starts a turn with that origin.
- `bot-chat.test.ts`: a steered message with no origin still starts a turn with the user origin.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
