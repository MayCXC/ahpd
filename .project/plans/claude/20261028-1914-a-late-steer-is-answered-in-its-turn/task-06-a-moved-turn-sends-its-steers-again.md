---
title: A turn that moves logins sends its steering messages again
status: done
depends: [task-05-a-steers-own-turn-ends-with-it.md]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/logins.ts#L185-L231](../../../../packages/agent-claude/src/session/logins.ts#L185-L231) - `runOn`, which puts a new CLI on a moved turn"
  - "[code://packages/agent-claude/src/session/turns.ts#L135-L145](../../../../packages/agent-claude/src/session/turns.ts#L135-L145) - `again`, which sends a moved turn's prompt again"
  - "[code://packages/agent-claude/src/session/turns.ts#L119-L123](../../../../packages/agent-claude/src/session/turns.ts#L119-L123) - `writtenAs`, which tells the host the uuid a prompt sent again goes under"
  - "[code://packages/agent-claude/src/session/turns.ts#L82-L105](../../../../packages/agent-claude/src/session/turns.ts#L82-L105) - `push`, the one door every prompt goes through to the CLI"
  - "[code://packages/agent-claude/src/session/query.ts#L594-L600](../../../../packages/agent-claude/src/session/query.ts#L594-L600) - `startQuery`, which clears what the CLI it replaces owed"
---

## Objective

A steering message sent while a refused login's attempt runs is owed by the turn.
When the turn moves to another login, the new CLI gets the message behind the prompt it gets again.
The turn ends once both are answered.
A turn opened for a steering message moves with that message as its prompt.
Where the conversation could not start over, the turn ends with the refusal.
The new CLI then gets the messages the old one never took in, each answered in a turn of its own.

## Files

- `UPDATE: packages/agent-claude/src/session/logins.ts` - `runOn` takes the turn's steering messages before the new CLI clears the map, and sends them on either road.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `again` sends the steering messages behind the prompt; `present` keeps the message as the turn's prompt; `push` hands nothing to a CLI that was put away while its blocks were built.
- `UPDATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the moved turn's steering message, the moved turn opened for one, the conversation that could not start over, and a message whose attachments were still being read.
- `UPDATE: packages/agent-claude/README.md` - the move.
- `UPDATE: .project/specs/agent-backends.md` - the move.

## Steps

1. In `runOn`, take the steering messages the CLI owes the turn before `startQuery` clears the map.
2. After the prompt goes out again, send each of them under a new uuid.
   `onTurnRecorded` tells the host the prompt's new uuid and none of theirs.
   A read then puts the messages inside the turn.
3. Make the message `present` opens a turn for that turn's prompt.
   The move then sends it again under a new uuid, which `onTurnRecorded` tells the host.
4. Where the turn fails instead, send the ones the CLI never started, after the failure.
5. In `push`, send nothing when the move replaced the CLI while the blocks took shape.
   The move sends the message itself.

## Validation

- The three move cases fail before this task, where the new CLI gets no steering message.
- The attachment case fails without the check in `push`: the new CLI gets the message twice.
- `agent-claude-logins.test.ts`, `agent-claude-late-steer.test.ts`, `attachments.test.ts`, `agent-claude-agent-pick.test.ts`, `agent-claude-handshake.test.ts`, `agent-claude-presets.test.ts` and `agent-claude-plugin-switch.test.ts` pass at one worker.

## Resume

Done 2026-10-28.
