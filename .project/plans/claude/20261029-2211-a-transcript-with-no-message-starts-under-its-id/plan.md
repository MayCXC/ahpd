---
title: A transcript with no message starts under its id
domain: claude
status: active
priority: high
created: 2026-10-29
revalidated: 2026-10-29
changes:
  - specs/agent-backends.md
refs:
  - git://c26f1e96 - the commit of `main` the facts were checked at
  - "[code://packages/agent-claude/src/catalog.ts#L88-L91](../../../../packages/agent-claude/src/catalog.ts#L88-L91) - `holds`, which takes any transcript that is not empty for a conversation"
  - "[code://packages/agent-claude/src/catalog.ts#L121-L128](../../../../packages/agent-claude/src/catalog.ts#L121-L128) - `written`, the check `create` resumes by"
  - "[code://packages/agent-claude/src/claude.ts#L635-L639](../../../../packages/agent-claude/src/claude.ts#L635-L639) - `create` resumes a written conversation and names any other one by its id"
  - "[code://packages/agent-claude/src/session/query.ts#L207-L208](../../../../packages/agent-claude/src/session/query.ts#L207-L208) - `namedUnder`, the `sessionId` of a new conversation"
  - "[code://packages/agent-claude/src/session/logins.ts#L98-L107](../../../../packages/agent-claude/src/session/logins.ts#L98-L107) - a conversation that starts over is deleted, and a new one begins under its id"
  - .project/plans/claude/27-a-conversation-never-written-starts-under-its-id/plan.md - the plan this one completes
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1728-L1744 - the reference resumes a chat only when the SDK has a transcript for it
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeAgent.ts#L1141-L1168 - the reference deletes a transcript, then starts a conversation under the same id on a clean transcript
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - the SDK's test of a transcript that holds a conversation, an entry with a `parentUuid`
---

## Goal

A Claude session that the host resumes picks up a conversation only when its transcript holds an entry of one.
Any other id names a new conversation, as plan claude/27 says.
The new conversation starts on a clean transcript, so the CLI takes its id.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "written\(|hasTranscript\(|holds\(" packages/agent-claude/src` - `create` is the one caller of `written`.
- `rg -n "namedUnder\(" packages/agent-claude/src` - the first query, and a later query of a CLI that said no id, name the conversation with `namedUnder`.
- On one daemon, a session was created at 03:10:12 and disposed at 03:10:13.
  Its CLI ran for 270 ms.
  It left a transcript of three lines: `last-prompt`, `atis-latch` and `cost-state`.
  No line was an entry of the conversation.
- On CLI 2.1.301, `--resume` of that transcript ends with `No conversation found with session ID`.
  `--session-id` of the same id ends with `Session ID <id> is already in use.`.
  The same flags pass both checks for an id with no transcript, and for a transcript with one `user` entry.
- On CLI 2.1.301, a CLI closed before its prompt arrived writes no transcript.
  A CLI closed after its first frame has written the prompt's entry.

### Runtime path

```
cligma resumes the session -> create -> written: true for any file -> query({ resume }) -> CLI: No conversation found
written: false -> namedUnder -> query({ sessionId }) -> CLI: Session ID is already in use
```

### Gaps

- `written` takes a transcript that is not empty for a conversation.
- A new conversation under an id is refused while the folder's project holds any transcript for that id.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A transcript holds a conversation when it holds an entry, a line with `"parentUuid":` | The SDK's own test, read as it reads it: both ends, then the rest up to 16 MiB | 01 |
| `written` reads each transcript with that test | The CLI's resume needs an entry | 01 |
| A transcript with no entry in the folder's project is deleted before the CLI starts under its id | The reference deletes a transcript, then starts under the same id; `logins.ts` starts over the same way | 01 |
| A transcript with an entry is never deleted | A conversation is the person's | 01 |
| A session in a machine is left as it is | Its files are in the machine, as plan claude/27 says | 01 |

## Proposed architecture

- **Data flow** - `written` and `clearFor` read the first and the last 64 KiB of a transcript, then the rest up to 16 MiB.
- **Event flow** - unchanged.
- **State flow** - `namedUnder` deletes a transcript with no entry before the CLI starts.
- **Layer responsibilities** - agent-claude only.
- **Source-of-truth files** - [`code://packages/agent-claude/src/catalog.ts`](../../../../packages/agent-claude/src/catalog.ts), [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A transcript with no message starts under its id](task-01-a-transcript-with-no-message-starts-under-its-id.md) | pending | - |

## Risks and tradeoffs

- The check reads up to 128 KiB of a transcript to resume it, and more only when neither end holds an entry.
- A CLI that is still closing can write its last lines after the delete.
  The CLI that starts next then refuses the id, as it does without this plan.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-transcript-with-no-message-starts-under-its-id.md](task-01-a-transcript-with-no-message-starts-under-its-id.md).
- **Open questions:** none.
- **Watch out for:** the cases write the CLI's own lines, so a case shows what the CLI does with them.

## Final verification checklist

- [ ] A resume of a transcript with no entry starts a new conversation under its id, and the transcript is gone.
- [ ] A transcript with no entry under a new session's id is gone before its CLI starts.
- [ ] A transcript with an entry is never deleted.
- [ ] The cases that resume a conversation pass with the CLI's own first entry.
