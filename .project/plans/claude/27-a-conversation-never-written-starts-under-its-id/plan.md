---
title: A conversation the CLI never wrote starts under its id
domain: claude
status: built
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/agent-claude/src/claude.ts#L594-L595](../../../../packages/agent-claude/src/claude.ts#L594-L595) - `create` gives the session its chat's id and its folder"
  - "[code://packages/agent-claude/src/claude.ts#L655-L657](../../../../packages/agent-claude/src/claude.ts#L655-L657) - `create` hands the host's `resume`, `forkAt` and `rewindAt` to the session as they are"
  - "[code://packages/agent-claude/src/session/query.ts#L486-L510](../../../../packages/agent-claude/src/session/query.ts#L486-L510) - the first query resumes a conversation, or names a new one with `namedUnder`"
  - "[code://packages/agent-claude/src/catalog.ts#L81-L99](../../../../packages/agent-claude/src/catalog.ts#L81-L99) - `hasTranscript`, the project folder of a folder, spelled as the SDK spells it"
  - "[code://packages/sdk/src/host/sleep.ts#L336](../../../../packages/sdk/src/host/sleep.ts#L336) - after a restart, the host resumes a session's first chat by its backend id"
  - "[code://packages/sdk/src/host/sleep.ts#L364](../../../../packages/sdk/src/host/sleep.ts#L364) - and every other chat it recorded, by each one's backend id"
  - "[code://packages/sdk/src/host/lifecycle.ts#L837](../../../../packages/sdk/src/host/lifecycle.ts#L837) - a session restarted in place resumes each chat by the id its backend answered with"
  - "[code://packages/sdk/src/types/agent.ts#L870](../../../../packages/sdk/src/types/agent.ts#L870) - `create` is synchronous"
  - "[code://packages/agent-claude/test/agent-claude-trust.test.ts#L60-L85](../../../../packages/agent-claude/test/agent-claude-trust.test.ts#L60-L85) - a case that reads the `query()` options of a session that `create` built"
  - "[code://packages/agent-claude/test/agent-claude-find.test.ts#L123-L138](../../../../packages/agent-claude/test/agent-claude-find.test.ts#L123-L138) - a projects folder under a temporary `CLAUDE_CONFIG_DIR`, with a transcript written in it"
  - decisions/subagent-chats-are-restored-from-the-cli-meta-file.md - agent-claude already reads the CLI's own files where the SDK gives no answer it can use
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1728-L1744 - the reference resumes a chat only when the SDK has a transcript for it, and starts any other fresh
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeSdkOptions.ts - the reference's options: `resume` for a resume, `sessionId` for a new conversation
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - a `resume` of an id with no file ends the CLI at startup with `No conversation found with session ID`, and a `resume` finds a conversation under any project folder
---

## Goal

After a restart, the host resumes each chat it recorded by the id that the chat's backend holds its conversation under.
The Claude CLI writes a conversation when its first message reaches it.
So a chat that nobody spoke to, or one whose CLI could not sign in, has an id with no conversation behind it.
The CLI refuses to resume that id, and the chat fails before its first turn.
With this plan, agent-claude resumes only a conversation that the CLI wrote, and it starts any other one under its id.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "resume:" packages/sdk/src/host` - the host resumes a recorded chat after a restart, on a restart in place, and when a chat moves.
- On SDK 0.3.301, `query()` with a `resume` that no file holds ends the CLI 3.8 s after it starts.
  The result is `error_during_execution` with `No conversation found with session ID: <id>`, and no message was sent.
- On SDK 0.3.301, a conversation written under the project folder of one folder resumes from another folder.
  So the CLI's resume looks in every project folder.
- `create(start: Start): Session` is synchronous, and agent-claude starts the CLI in it.

### Runtime path

```
restart -> sleep.ts resume -> create(start with resume) -> query({ resume }) -> CLI: No conversation found -> the chat fails
```

### Gaps

- agent-claude resumes any id that the host names, and the CLI resumes only an id that it has a file for.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `create` resumes an id only when a project folder holds a transcript for it: the folder's own project first, then every other project. | The reference's `isResume: !!sdkInfo` from `getSessionInfo` with no folder, and the CLI's resume, which looks in every project folder | 01 |
| An id with no transcript names a new conversation: `create` gives it as the chat's id, and `namedUnder` gives it to the SDK as `sessionId`. | [code://packages/agent-claude/src/session/query.ts#L486-L510](../../../../packages/agent-claude/src/session/query.ts#L486-L510), and the reference's `{ sessionId }` | 01 |
| A chat that has an id of its own keeps it for the new conversation. | [code://packages/agent-claude/src/claude.ts#L594](../../../../packages/agent-claude/src/claude.ts#L594) | 01 |
| A `forkAt` or a `rewindAt` goes only with a resume, because each names an entry of a written conversation. | [code://packages/agent-claude/src/session/query.ts#L499-L510](../../../../packages/agent-claude/src/session/query.ts#L499-L510) | 01 |
| The check reads the files, because `create` is synchronous and the CLI starts in it. | [code://packages/sdk/src/types/agent.ts#L870](../../../../packages/sdk/src/types/agent.ts#L870), and decisions/subagent-chats-are-restored-from-the-cli-meta-file.md | 01 |
| The check is in agent-claude, the provider, as in the reference, so it holds on every road the host resumes by. | The reference's claudeAgent.ts | 01 |

## Proposed architecture

- **Data flow** - the host's `resume` meets the CLI's project folders before the first query is built.
- **Event flow** - unchanged.
- **State flow** - a chat started under its id is written under that id by its first turn, and the next restart resumes it.
- **Layer responsibilities** - agent-claude only.
- **Source-of-truth files** - [`code://packages/agent-claude/src/claude.ts`](../../../../packages/agent-claude/src/claude.ts), [`code://packages/agent-claude/src/catalog.ts`](../../../../packages/agent-claude/src/catalog.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A conversation the CLI never wrote starts under its id](task-01-a-conversation-never-written-starts-under-its-id.md) | done | - |

## Risks and tradeoffs

- The check reads the projects folder once for each session that the host resumes, and one file for each project in it.

## Resume state

- **Done so far:** planned and built 2026-10-28; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a CLI that names its own project folder writes every session there.
  A check by hand in such a shell reads that one folder for every session.

## Final verification checklist

- [x] The first case fails on the code before this plan.
- [x] The agent-claude suite passes.
- [x] `plans/index.md` updated.
