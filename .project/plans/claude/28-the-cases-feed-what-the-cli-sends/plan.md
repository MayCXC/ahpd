---
title: The Claude cases feed what the CLI sends
domain: claude
status: planned
priority: low
created: 2026-10-28
revalidated: 2026-10-28
refs:
  - "[code://packages/sdk/test/host-chats.test.ts#L62-L82](../../../../packages/sdk/test/host-chats.test.ts#L62-L82) - `twice`, two turns that each feed an echo of the prompt"
  - "[code://packages/sdk/test/host-chats.test.ts#L218-L222](../../../../packages/sdk/test/host-chats.test.ts#L218-L222) - a fork case whose comment says that the CLI echoes the prompt back"
  - "[code://packages/sdk/test/host-chats.test.ts#L280-L293](../../../../packages/sdk/test/host-chats.test.ts#L280-L293) - `oneTurn`, a turn whose only entry is an echo, which a fork cuts at"
  - "[code://packages/sdk/test/host-files.test.ts#L403-L406](../../../../packages/sdk/test/host-files.test.ts#L403-L406) - \"What the CLI echoes\", before a turn's end"
  - "[code://packages/sdk/test/host-chat-attachment.test.ts#L80-L83](../../../../packages/sdk/test/host-chat-attachment.test.ts#L80-L83) - the same, for a chat's attachment"
  - "[code://packages/sdk/test/conformance.test.ts#L398-L407](../../../../packages/sdk/test/conformance.test.ts#L398-L407) - a turn in a peer chat, fed an echo so its backend has a session id"
  - "[code://packages/sdk/test/host-files.test.ts#L634-L635](../../../../packages/sdk/test/host-files.test.ts#L634-L635) - the frame that names the conversation, as the CLI sends it"
  - "[code://packages/agent-claude/src/session/query.ts#L622-L629](../../../../packages/agent-claude/src/session/query.ts#L622-L629) - a session takes its conversation id from any frame, and `init` is the CLI's first"
  - "[code://packages/agent-claude/src/session/query.ts#L664-L675](../../../../packages/agent-claude/src/session/query.ts#L664-L675) - a turn's last `user` or `assistant` frame is the entry a fork or a rewind cuts at"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - a streamed prompt is not echoed: the CLI sends `system`, `rate_limit_event`, `assistant` and `result` for a turn, each with the session id
---

## Goal

The sdk suite drives agent-claude through a fake SDK, and several cases feed the session an echo of each prompt.
The CLI sends no such frame for a streamed prompt.
Three comments in those cases say that it does, and one helper lets a fork cut at the echo.
With this plan, each case feeds the frames that the CLI sends, and its comments say what the CLI sends.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "type: 'user', session_id" packages/*/test` - seven echoes in four of upstream's files, and one in a file that upstream's main does not have.
- On SDK 0.3.301 with a streamed prompt, the CLI sends `system`, `rate_limit_event`, `assistant` and `result`.
  It sends no `user` frame for the prompt.
- `rg -n "subtype: 'init', session_id" packages/sdk/test` - two cases already name the conversation with the `init` frame.

### Runtime path

```
a case begins a turn -> the fake SDK yields the frames the case pushed -> query.ts takes the session id and the turn's last entry from them
```

### Gaps

- A case that feeds an echo models a frame that the CLI does not send, and three comments say that the CLI sends it.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each echo becomes the `init` frame, which names the conversation as the CLI does. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, measured; [code://packages/sdk/test/host-files.test.ts#L634-L635](../../../../packages/sdk/test/host-files.test.ts#L634-L635) | 01 |
| `oneTurn` gains an `assistant` frame, so the turn ends at an entry that the CLI writes. | [code://packages/agent-claude/src/session/query.ts#L664-L675](../../../../packages/agent-claude/src/session/query.ts#L664-L675) | 01 |
| The comments say what the CLI sends: the frame that names the conversation, an answer, and the end of the turn. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, measured | 01 |
| A file that upstream's main does not have keeps its frames, because no branch changes another branch's lines. | The fork's own rule | - |

## Proposed architecture

- **Data flow** - unchanged.
- **Event flow** - unchanged.
- **State flow** - unchanged.
- **Layer responsibilities** - the sdk suite only.
- **Source-of-truth files** - the four test files in the `refs`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Each case feeds the frames the CLI sends](task-01-each-case-feeds-the-frames-the-cli-sends.md) | todo | - |

## Risks and tradeoffs

- None.

## Resume state

- **Done so far:** planned 2026-10-28.
- **Next action:** task 01.
- **Open questions:** none.
- **Watch out for:** a case that fed an echo may depend on the echo's uuid, as the turn's last entry or as its transcript id.

## Final verification checklist

- [ ] No case in the sdk suite feeds a `user` frame for a lead turn's prompt.
- [ ] The sdk and agent-claude suites pass.
- [ ] `plans/index.md` updated.
