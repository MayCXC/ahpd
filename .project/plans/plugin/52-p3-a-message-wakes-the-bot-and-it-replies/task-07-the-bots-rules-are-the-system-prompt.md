---
title: The bot's rules are the system prompt
status: todo
depends: [task-03-a-message-wakes-a-back-session.md]
layer: "packages/sdk, packages/bot"
refs:
  - "[code://packages/sdk/src/types/agent.ts#L238](../../../../packages/sdk/src/types/agent.ts#L238) - `Start.instructions`"
  - "[code://packages/agent-claude/src/session/query.ts#L308](../../../../packages/agent-claude/src/session/query.ts#L308) - Claude appends the instructions to its preset"
  - "[code://packages/agent-pi/src/backend.ts#L155](../../../../packages/agent-pi/src/backend.ts#L155) - pi appends them to its system prompt"
  - "[code://packages/agent-cofold/src/turnagent.ts#L295](../../../../packages/agent-cofold/src/turnagent.ts#L295) - cofold joins them with its `instructions` key"
  - "[code://packages/bot/src/template.ts#L51-L54](../../../../packages/bot/src/template.ts#L51-L54) - `templateOf` and `firstTurn`"
---

## Objective

A session request may carry instructions, and the host adds them to `Start.instructions`.
A back session starts with the bot's filled template and the use of `post_message` as its instructions.
A backend that takes no system prompt gets the instructions in the first message.

## Files

- `UPDATE: packages/sdk/src/types/session.ts` - `instructions` on the session request.
- `UPDATE: packages/sdk/src/validate.ts` - check `instructions` as an array of strings.
- `UPDATE: packages/sdk/src/host/spawn.ts` - add the request's instructions to `Start.instructions`.
- `UPDATE: packages/agent-acp/src/session/opening.ts` - put the instructions before the first message.
- `UPDATE: packages/bot/src/wake.ts` - fill the template with `firstTurn`, and send it as `instructions`.
- `CREATE: packages/sdk/test/session-instructions.test.ts` - the request's instructions reach `Start.instructions`.
- `UPDATE: packages/bot/test/bot-wake.test.ts` - the back session starts with the bot's instructions.

## Steps

1. Add `instructions?: string[]` to the session request, and check it in `checkSessionRequest`.
2. Add the request's instructions after the host tools' instructions in `Start.instructions`.
3. In agent-acp, write the instructions before the text of the first turn.
4. Fill the bot's template with `firstTurn` when task 03 starts a back session.
5. Add one line that tells the back session to reply with `post_message`.

## Validation

- `session-instructions.test.ts`: test that the instructions reach `Start.instructions`.
- `session-instructions.test.ts`: test that the check refuses a value that is not an array of strings.
- `bot-wake.test.ts`: the back session's start has the filled template.
- The gates pass: build, typecheck, boundary, schema and vitest.
