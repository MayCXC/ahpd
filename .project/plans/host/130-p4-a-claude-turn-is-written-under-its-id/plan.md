---
title: A Claude turn is written under its id
domain: host
status: built
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L62-L68](../../../../packages/agent-claude/src/session/turns.ts#L62-L68) - `push`, the one door a prompt reaches the CLI's input through"
  - "[code://packages/agent-claude/src/session/turns.ts#L262](../../../../packages/agent-claude/src/session/turns.ts#L262) - a turn's first prompt"
  - "[code://packages/agent-claude/src/session/turns.ts#L613-L617](../../../../packages/agent-claude/src/session/turns.ts#L613-L617) - a failed turn's prompt, sent again"
  - "[code://packages/agent-claude/src/session/query.ts#L537-L545](../../../../packages/agent-claude/src/session/query.ts#L537-L545) - `reported`, the turns whose echo was said"
  - "[code://packages/agent-claude/src/session/query.ts#L769-L787](../../../../packages/agent-claude/src/session/query.ts#L769-L787) - `onTurnRecorded`, called from the first `user` frame of a turn"
  - "[code://packages/agent-claude/src/session/query.ts#L12](../../../../packages/agent-claude/src/session/query.ts#L12) - `UUID`, what the SDK takes as an id of the host's choosing"
  - "[code://packages/sdk/src/host/spawn.ts#L1539-L1558](../../../../packages/sdk/src/host/spawn.ts#L1539-L1558) - the host keeps a turn's sender, and anchors a `!` turn, under the id the backend names"
  - "[code://packages/sdk/src/types/agent.ts#L517-L531](../../../../packages/sdk/src/types/agent.ts#L517-L531) - `onTurnRecorded`"
  - "[code://packages/agent-claude/test/agent-claude-turn-recorded.test.ts#L92-L101](../../../../packages/agent-claude/test/agent-claude-turn-recorded.test.ts#L92-L101) - the echo the cases feed, which the captures do not carry"
  - "[code://packages/sdk/test/host-local-turns.test.ts#L451-L490](../../../../packages/sdk/test/host-local-turns.test.ts#L451-L490) - the Claude case of p1, which feeds the same echo"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts#L1294-L1298 - the reference writes a prompt under its protocol id, "same pattern as `ClaudeAgent.sendMessage` reusing turnId"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L423-L444 - the reference's `send`, whose SDK uuid is the prompt's own or else the turn id
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - a streamed prompt is not echoed back, and a prompt sent with a `uuid` is written to the transcript under it
---

## Goal

A local turn after a Claude turn is anchored by the id that Claude's transcript gives that turn.
The transcript names a turn by the uuid of its prompt.
agent-claude names that uuid from the CLI's echo of the prompt, and the CLI echoes no streamed prompt.
So after a restart the anchor is gone, and the `!` turn after a Claude turn is dropped.
With this plan, agent-claude writes each prompt under the turn's own id, as the reference does.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- On SDK 0.3.301 with a streamed prompt, the CLI sends `system`, `rate_limit_event`, `assistant` and `result`.
  It sends no `user` frame for the prompt.
- In a turn with tool calls, the first `user` frame is a tool result, and its uuid is not the prompt's.
- On SDK 0.3.301, a streamed `SDKUserMessage` with a `uuid` is written to the transcript under that uuid.
- On a daemon with a signed-in CLI, a `!` turn after a Claude turn kept the turn's client id as its anchor.
  After a restart the transcript named the turn by another uuid, and the `!` turn was dropped.

### Runtime path

```
begin -> push(prompt) -> CLI writes the prompt under a uuid of its own -> no echo -> no transcript id
`!` turn ends -> anchor = the Claude turn's client id
restart -> transcript read names the Claude turn by that uuid -> the anchor is not there -> the `!` turn is dropped
```

### Gaps

- agent-claude waits for an echo that the CLI does not send.
- A Claude turn read back after a restart has no sender either, for the same reason.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A turn's first prompt carries the turn's id as its `uuid` when the id is a UUID. | The reference's `sendMessage`, which reuses the turn id as the SDK uuid | 01 |
| A turn whose id is not a UUID carries a new uuid, and `onTurnRecorded` names the pair when the prompt goes out. | [code://packages/sdk/src/types/agent.ts#L517-L531](../../../../packages/sdk/src/types/agent.ts#L517-L531), and `UUID`, what the SDK takes | 01 |
| A failed turn sent again carries a new uuid, because the first attempt may have written its prompt. | (defaulted: one uuid names one prompt in a transcript) | 01 |
| A message that steers a running turn carries no `uuid`, because it is part of that turn. | [code://packages/agent-claude/src/session/turns.ts#L506](../../../../packages/agent-claude/src/session/turns.ts#L506) | 01 |
| The report from the first `user` frame goes, with the set of turns it was said for. | The CLI echoes no streamed prompt, and its first `user` frame is a tool result | 01 |
| `UUID` moves to `common.ts`, which both `query.ts` and `turns.ts` read. | [code://packages/agent-claude/src/session/query.ts#L12](../../../../packages/agent-claude/src/session/query.ts#L12) | 01 |
| p1's Claude case sends no echo, and its transcript names the turn by the uuid that its prompt carried. | The CLI's own behaviour, measured on SDK 0.3.301 | 01 |

## Proposed architecture

- **Data flow** - the turn's id, or a new uuid, goes onto the prompt and into the transcript.
- **Event flow** - `onTurnRecorded` is called when a prompt goes out, and never from a frame the CLI sends.
- **State flow** - the host anchors a `!` turn, and keeps a sender, under that uuid, as p1 and the port do.
- **Layer responsibilities** - agent-claude, and two comments in `@ahpd/sdk`.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A turn's prompt carries the turn's id](task-01-a-turns-prompt-carries-the-turns-id.md) | done | - |

## Risks and tradeoffs

- A turn whose id is not a UUID is read back under another id after a restart.
  The host keeps its sender and its anchors under both ids.

## Resume state

- **Done so far:** planned and built 2026-10-28; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a capture of a `claude -p` run with a string prompt is not a streamed session, and its frames are not this session's.

## Final verification checklist

- [x] The first case fails on the code before this plan.
- [x] The agent-claude suite and p1's cases pass.
- [x] `plans/index.md` updated.
