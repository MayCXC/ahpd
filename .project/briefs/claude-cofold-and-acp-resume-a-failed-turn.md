---
title: Claude, cofold and ACP resume a failed turn
created: 2026-10-31
refs:
  - git://a0c77b9b - the commit of ahpd the facts were checked at
  - git://a0c77b9b:.project/briefs/a-failed-pi-turn-is-resumed.md - the pi brief, with the protocol and VS Code facts this brief does not repeat
  - "[code://.project/plans/pi/20261031-0736-a-failed-pi-turn-is-resumed/plan.md](../plans/pi/20261031-0736-a-failed-pi-turn-is-resumed/plan.md) - the pi plan, the logic to copy"
  - "[code://packages/sdk/src/host/chatactions.ts#L1081-L1090](../../packages/sdk/src/host/chatactions.ts#L1081-L1090) - the host's `chat/turnResume`, which does not check `resumable`"
  - "[code://packages/agent-claude/src/session/parts.ts#L320-L340](../../packages/agent-claude/src/session/parts.ts#L320-L340) - the Claude error part, with no `resumable`"
  - "[code://packages/agent-claude/src/session/turns.ts#L744-L780](../../packages/agent-claude/src/session/turns.ts#L744-L780) - the Claude backend's `resume`, which sends the turn's text again and emits no `chat/turnResume`"
  - "[code://packages/agent-cofold/src/mapping.ts#L159-L163](../../packages/agent-cofold/src/mapping.ts#L159-L163) - the cofold error part, with no `resumable`"
  - "[code://packages/agent-cofold/src/mapping.ts#L746](../../packages/agent-cofold/src/mapping.ts#L746) - where a cofold turn ends with `chat/error`"
  - "[code://packages/agent-acp/src/session/turn.ts#L140-L152](../../packages/agent-acp/src/session/turn.ts#L140-L152) - where an ACP turn ends with `chat/error`, with no `resumable`"
---

# Claude, cofold and ACP resume a failed turn

Softov's goal: "one plan per agent... pi first.. brief for claude, cofold and acp copying logic."
After the pi plan, each of the Claude, cofold and ACP backends resumes a failed turn the way pi does.
Each backend gets its own plan.

## What others do

The pi brief at `git://a0c77b9b` has the protocol's rules and VS Code's agent host.
The pi plan is the logic to copy:

- A failed model call ends with an error part that has `resumable: true`, on `chat/error` and on the turn in the snapshot.
- A failure before the agent got the prompt is not resumable.
- `resume` checks that the latest turn is the one named, is in `error`, and ends with a resumable error part.
- `resume` reopens the turn with its message and parts, and emits `chat/turnResume`, so the host echoes it to the sender.
- The agent continues without a new message, and the failed reply leaves the model's context.
- A resumed run that fails again adds one more resumable error part.
- The last failed turn read back after a restart is resumable.

## What ahpd has today

### The host

- `chat/turnResume` calls `session.resume` and refuses the action when it answers `false`.
- The host does not check that the last part is a resumable error, which the protocol says it must.

### Claude

- `resume` exists. It reopens the turn and sends the turn's text to the CLI again, as a new user message.
- `resume` emits no `chat/turnResume`.
- The error part has no `resumable`. Its comment says "this host cannot resume a turn".
- So the protocol's reducer ignores a resume of a Claude turn.

### cofold

- The session has no `resume`, so the host refuses `chat/turnResume`.
- The error part has no `resumable`.

### ACP

- The session has no `resume`, so the host refuses `chat/turnResume`.
- The error part has no `resumable`.

## Who writes

- The pi plan changes `packages/agent-pi` and adds a case to `packages/sdk/test/echo-origin.test.ts`. It does not touch these backends.
- No other branch was checked for these files. Check before each plan.

## The change

- Each backend marks a failed model call resumable, and gets `resume` in the shape of pi's.
- The Claude backend's `resume` emits `chat/turnResume`.
- The host refuses a resume when the latest turn's last part is not a resumable error, before it calls `session.resume`.

## Open points

- How Claude continues: send the text again as today, or continue the CLI's conversation without a new message.
- Whether the cofold SDK can continue a run without a new message. Not checked.
- Whether an ACP agent can continue a prompt without a new message. ACP has no such method that was checked.
- Which plan carries the host's check on `resumable`.
