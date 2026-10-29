---
title: A steering message's own turn ends with the message
status: done
depends: [task-04-a-stop-opens-the-steers-turn.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L533-L547](../../../../packages/agent-claude/src/session/turns.ts#L533-L547) - `present`, which opens the turn that answers a steering message"
  - "[code://packages/agent-claude/src/session/turns.ts#L560-L564](../../../../packages/agent-claude/src/session/turns.ts#L560-L564) - `handOver`, which a stop calls with the turn it ended"
  - "[code://packages/agent-claude/src/session/query.ts#L737-L760](../../../../packages/agent-claude/src/session/query.ts#L737-L760) - an answer whose turn has ended goes nowhere"
---

## Objective

A turn opened for a steering message has the message as its prompt.
A stop of that turn stops the message too.
No turn opens for it again, and the CLI's answer to it goes nowhere.

## Files

- `UPDATE: packages/agent-claude/src/session/turns.ts` - `present` makes the message the turn's prompt.
- `UPDATE: packages/agent-claude/test/agent-claude-late-steer.test.ts` - the turn stopped before the CLI took the message in.
- `UPDATE: docs/sdk/CHATS.md` - a stop of that turn.
- `UPDATE: .project/specs/agent-backends.md` - a stop of that turn.

## Steps

1. Make the message the new turn's prompt rather than a steering message when `present` opens its turn.
2. Add the case: the stop capture, with the message's own turn stopped before the CLI's frames for it arrive.

## Validation

- The case fails before this task.
  The stop handed the message over again, and a second turn opened under its id.
- `agent-claude-late-steer.test.ts`, `agent-claude-logins.test.ts` and `attachments.test.ts` pass at one worker.

## Resume

Done 2026-10-28.
