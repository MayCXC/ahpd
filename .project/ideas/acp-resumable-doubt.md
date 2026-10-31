---
title: An ACP turn might be resumable
created: 2026-10-31
refs:
  - git://cb47945e:.project/briefs/claude-cofold-and-acp-resume-a-failed-turn.md - the brief that asked for ACP with Claude and cofold
  - "[code://packages/agent-acp/src/session/turn.ts#L140-L152](../../packages/agent-acp/src/session/turn.ts#L140-L152) - where an ACP turn ends with `chat/error`, with no `resumable`"
  - https://agentclientprotocol.com/protocol/prompt-turn - the ACP prompt turn, with no method that continues or retries one
---

An ACP turn that failed is not resumable for now: Softov, 2026-10-31, "for now not resumable".
ACP has no method that continues a prompt or runs it again, so a resume can only send the same prompt as a new `session/prompt`.
The doubt is whether that is a resume at all: the agent's conversation still holds the failed prompt, and the host cannot cut it back.
An ACP agent that adds a retry or a rewind to its own protocol would make this worth a brief.
The Claude and cofold plans, `claude/20261031-1200-a-failed-claude-turn-is-resumed` and `cofold/20261031-1200-a-failed-cofold-turn-is-resumed`, are the logic to copy.
