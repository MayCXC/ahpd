---
title: A Claude turn read back is a point to fork and cut at
domain: host
status: planned
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/host/130-a-commands-turn-survives-a-restart/plan.md
changes:
  - specs/sessions-and-chats.md
refs:
  - "[code://packages/sdk/src/types/session.ts#L450-L480](../../../../packages/sdk/src/types/session.ts#L450-L480) - `forkPoint` and `endPoint`, answered today only for a turn this process watched run"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1111-L1117](../../../../packages/sdk/src/host/sessionmethods.ts#L1111-L1117) - `createChat`, which answers -32001 for a session asleep in the catalogue"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1170-L1179](../../../../packages/sdk/src/host/sessionmethods.ts#L1170-L1179) - a fork asks the source chat for `forkPoint` and `agentId`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L484-L486](../../../../packages/sdk/src/host/sessionmethods.ts#L484-L486) - a page read answers -32002 for a session whose agent is not loaded"
  - "[code://packages/sdk/src/host/chatactions.ts#L477-L501](../../../../packages/sdk/src/host/chatactions.ts#L477-L501) - any other action on a sleeping session: held, woken, and applied again to the live session"
  - "[code://packages/sdk/src/host/chatactions.ts#L1484-L1527](../../../../packages/sdk/src/host/chatactions.ts#L1484-L1527) - a truncation asks `endPoint`, and refuses a turn that has none"
  - "[code://packages/sdk/src/host/tooling.ts#L1666-L1694](../../../../packages/sdk/src/host/tooling.ts#L1666-L1694) - `send_message` holds a sleeping session, wakes it and acts on the live one"
  - "[code://packages/sdk/src/host/sleep.ts#L247-L378](../../../../packages/sdk/src/host/sleep.ts#L247-L378) - `resume`, which reads each chat's transcript and then creates its session with `resume` and `seed`"
  - "[code://packages/sdk/src/host/history.ts#L374-L394](../../../../packages/sdk/src/host/history.ts#L374-L394) - `past`, the lead chat's transcript read, kept until the session sleeps"
  - "[code://packages/agent-claude/src/transcript.ts#L48-L66](../../../../packages/agent-claude/src/transcript.ts#L48-L66) - `turnsOf`, the read, over `getSessionMessages`"
  - "[code://packages/agent-claude/src/transcript.ts#L274-L534](../../../../packages/agent-claude/src/transcript.ts#L274-L534) - `buildTurns`, one turn per prompt, from the entries of the conversation chain"
  - "[code://packages/agent-claude/src/session/query.ts#L535-L545](../../../../packages/agent-claude/src/session/query.ts#L535-L545) - `ends`, the last chain entry of each turn by turn id"
  - "[code://packages/agent-claude/src/session/query.ts#L650-L662](../../../../packages/agent-claude/src/session/query.ts#L650-L662) - the rule: the last `user` or `assistant` frame of a turn is its end"
  - "[code://packages/agent-claude/src/claude.ts#L537-L554](../../../../packages/agent-claude/src/claude.ts#L537-L554) - `transcript`, which reads a conversation for the host"
  - "[code://packages/agent-claude/src/claude.ts#L587-L700](../../../../packages/agent-claude/src/claude.ts#L587-L700) - `create`, which resumes a conversation the CLI wrote"
  - "[code://packages/agent-claude/src/session.ts#L85](../../../../packages/agent-claude/src/session.ts#L85) - `agentId` starts as the conversation that the session resumes"
  - "[code://packages/agent-pi/src/session.ts#L229-L250](../../../../packages/agent-pi/src/session.ts#L229-L250) - pi gives a resumed session the ends of its earlier turns, read from its own file"
  - "[code://docs/sdk/CHATS.md#L63](../../../../docs/sdk/CHATS.md#L63) - the rewind paragraph, which refuses a turn read back"
  - "[code://docs/sdk/SESSIONS.md#L38](../../../../docs/sdk/SESSIONS.md#L38) - what wakes a sleeping session"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeReplayMapper.ts#L72-L112 - the reference's anchor for a turn of a transcript: the turn's last assistant entry
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1104-L1138 - the reference truncates at a turn of any session, and resumes an unloaded session first
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1689-L1705 - the reference forks at a turn of any session, from the transcript
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `getSessionMessages` builds the conversation chain through `parentUuid` and answers its user and assistant messages in order
---

## Goal

After a restart, a client can fork or truncate a Claude chat at a turn that the host read back from the transcript.
Today the host refuses both, and the reference host does both.
A sleeping session answers a fork with -32001, because a fork does not wake a session.
A live session refuses a turn read back, because agent-claude names a turn's end only from its own CLI's frames.
With this plan, a fork wakes a sleeping session, as every other action does.
agent-claude names the end of each turn when it reads the transcript, by the rule that it applies to live frames.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- A local daemon with a real CLI, 2026-10-28: after a restart, a fork at a `!` turn of a sleeping session answered -32001.
- After a turn woke that session, the same fork answered -32602 "is not a turn this host can fork from".
- `rg "wake\(" packages/sdk/src/host` - a chat action, a host tool, an automation and a child's event wake a sleeping session; `createChat` does not.
- `rg "ends.set" packages/agent-claude/src` - one place, the live frames in `query.ts`.
- `rg "ends.set" packages/agent-pi/src` - pi names the ends of a resumed session's earlier turns from its own file.
- `agentId` starts as the resumed conversation's id, so a woken session names it before its CLI does.

### Runtime path

```
createChat {fork} -> session asleep -> hold -> wake -> createChat again -> forkPoint(turn) -> spawn {resume, forkAt}
chat/truncated on a sleeping chat -> wake -> endPoint(turn) -> spawn {resume, rewindAt}
wake -> transcript (claude) -> the last entry of each turn, kept by conversation -> create {resume} -> ends
```

### Gaps

- `createChat` does not wake a session asleep in the catalogue.
- agent-claude keeps no end for a turn that it read back, so a woken session has none to give.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A fork of a sleeping chat wakes its session first, and the call is made again on the live session. | [code://packages/sdk/src/host/chatactions.ts#L477-L501](../../../../packages/sdk/src/host/chatactions.ts#L477-L501) | 01 |
| `createChat` wakes a sleeping session for every source, and for a chat with no source. | `(defaulted: the wake comes before the source is read, and a new chat opens in a woken session as in a live one)` | 01 |
| The session is held from before the wake until the chat is made. | [code://packages/sdk/src/host/tooling.ts#L1666-L1694](../../../../packages/sdk/src/host/tooling.ts#L1666-L1694) | 01 |
| A session whose agent is not loaded answers -32002 before any wake. | [code://packages/sdk/src/host/sessionmethods.ts#L484-L486](../../../../packages/sdk/src/host/sessionmethods.ts#L484-L486) | 01 |
| A wake that fails fails the call with the resume's error, and the session stays asleep. | [code://docs/sdk/SESSIONS.md#L38](../../../../docs/sdk/SESSIONS.md#L38) | 01 |
| The end of a turn read back is its last `user` or `assistant` entry in the conversation chain. For a complete turn, that is the reference's last assistant entry. | [code://packages/agent-claude/src/session/query.ts#L650-L662](../../../../packages/agent-claude/src/session/query.ts#L650-L662); https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeReplayMapper.ts#L72-L112 | 02 |
| agent-claude names the ends when it reads a transcript, and keeps them by the conversation's id. | [code://packages/sdk/src/host/sleep.ts#L247-L378](../../../../packages/sdk/src/host/sleep.ts#L247-L378): the wake reads the transcript before it creates the session, and the contract asks for a point synchronously | 02 |
| A session that resumes a conversation starts with the ends that the read named. A fork starts without them. | [code://packages/agent-pi/src/session.ts#L229-L250](../../../../packages/agent-pi/src/session.ts#L229-L250); `(defaulted: a fork is a new conversation, and the CLI writes its entries)` | 02 |
| `turnsOf` takes the map that it fills as an optional argument. | `(defaulted: a caller that wants only the turns is unchanged, and the function is exported)` | 02 |
| The Session contract, the chats page and the sessions page say that a turn read back has a point when its backend named one, and that a new chat wakes a sleeping session. | [code://packages/sdk/src/types/session.ts#L450-L480](../../../../packages/sdk/src/types/session.ts#L450-L480); [code://docs/sdk/CHATS.md#L63](../../../../docs/sdk/CHATS.md#L63) | 03 |

## Proposed architecture

- **Data flow** - `transcript` names each read turn's last entry, and `create` gives these ends to a session that resumes the conversation.
- **Event flow** - `createChat` on a sleeping session holds it, wakes it, makes the call again on the live session, and releases it.
- **State flow** - agent-claude keeps one map of turn ends for each conversation it read, and each read replaces it. A session copies its map into `ends`.
- **Layer responsibilities** - sdk `host/sessionmethods.ts`: the wake · agent-claude `transcript.ts`, `claude.ts` and `session/query.ts`: the read ends · docs: the contract.
- **Source-of-truth files** - [`code://packages/agent-claude/src/transcript.ts`](../../../../packages/agent-claude/src/transcript.ts), [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A fork wakes a sleeping session](task-01-a-fork-wakes-a-sleeping-session.md) | todo | - |
| [02 - Claude names where a read turn ended](task-02-claude-names-where-a-read-turn-ended.md) | todo | - |
| [03 - The docs say where a read turn ends](task-03-the-docs-say-where-a-read-turn-ends.md) | todo | 01, 02 |

## Risks and tradeoffs

- A pi session reads its own file after `create` returns, so a fork asked at the same moment as its wake is refused as before. The read is pi's, and this plan leaves it.
- A cofold or ACP turn read back still has no point, because those backends name points only for the turns that they watch.
- The map of read ends grows by one entry per conversation read, as the host's history keeps the turns of every session it read.

## Resume state

- **Done so far:** drafted 2026-10-28 against main `4a7832af`.
- **Next action:** [task-01-a-fork-wakes-a-sleeping-session.md](task-01-a-fork-wakes-a-sleeping-session.md).
- **Open questions:** none.
- **Watch out for:** the ends of a lead chat come from the read that `past` keeps, which can be older than the wake.

## Final verification checklist

- [ ] A fork of a sleeping chat wakes the session and forks at the turn.
- [ ] A new chat in a sleeping session wakes it.
- [ ] A Claude session that resumes a conversation answers `forkPoint` and `endPoint` for each turn that was read back.
- [ ] A Claude fork starts with no read ends.
- [ ] With a real CLI, a fork at a `!` turn of a session asleep since a restart opens and answers a turn.
