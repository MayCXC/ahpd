---
title: A chat is attached to a message
domain: host
status: built
priority: low
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L443-L496](../../../../packages/sdk/src/host/sessionmethods.ts#L443-L496) - the completions command; `#chat:` answers no items today"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1179-L1183](../../../../packages/sdk/src/host/lifecycle.ts#L1179-L1183) - `messageAttachments`, which every way a message reaches a backend goes through"
  - "[code://packages/sdk/src/attachments.ts#L100-L135](../../../../packages/sdk/src/attachments.ts#L100-L135) - `partsOf`; a `simple` attachment reaches the model as its `modelRepresentation`, and a `chat` only as a reference line"
  - "[code://packages/sdk/src/tools/session.ts#L29](../../../../packages/sdk/src/tools/session.ts#L29) - `openLink`, the link `get_session_context` reads"
  - "[code://packages/sdk/src/host/catalogue.ts#L338-L344](../../../../packages/sdk/src/host/catalogue.ts#L338-L344) - a chat's `title`, `origin` and `interactivity`"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/node/agentHostChatCompletionProvider.ts`: `extractChatToken`, `sanitizeChatTitle`, the filter at :133-158"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/common/state/chatAttachmentContext.ts`: the bound, the format, the pointer and `MAX_CHAT_ATTACHMENT_EXCERPT_CHARS`"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/node/agentSideEffects.ts:2199-2240`: `_resolveChatAttachments`"
---

## Goal

`#chat:` completes another chat's title, and a message that attaches a chat gives the agent that chat's transcript.

## Reconnaissance

### Gaps

- `#chat:` answers no items, so a client cannot pick a chat.
- A `chat` attachment reaches the agent only as a reference line, with no transcript and no link.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| `#chat:` is built after p1 to p3 | Softov, 2026-10-11, to "When should #chat: be built?" - "After p1 to p3" | - |
| `#chat:` offers the other chats of the same session, and leaves out the current chat, chats a tool started, and hidden chats | VS Code `agentHostChatCompletionProvider.ts:133-158` | 01 |
| A completed item pins `endTurn` to the last completed turn of that chat, and a chat with none has no `endTurn` | VS Code `agentHostChatCompletionProvider.ts:160-175` | 01 |
| The agent gets a pointer: the chat's title, its `openLink`, a hint to call `get_session_context`, and the last 1000 characters of its transcript up to `endTurn` | VS Code `chatAttachmentContext.ts` | 02 |
| The transcript holds only the user text and the assistant markdown of each turn, and a chat attachment in it is not resolved again | VS Code `formatChatTranscript` | 02 |
| A chat that cannot be read gives the pointer with no excerpt, and never fails the turn | VS Code `_resolveChatAttachments` | 02 |
| An `endTurn` that is the running turn refuses the message | VS Code `_resolveChatAttachments` | 02 |
| Under a users directory, a chat in a session the sender may not `session:read` is a chat that cannot be read | (defaulted: no excerpt leaks, and the turn still runs, as for a stale chat) | 02 |
| The turn keeps the `chat` attachment as the client sent it; only the backend gets the pointer | VS Code passes the resolved list to the agent only | 02 |

## Tasks

| Task | Status | Depends |
| --- | --- | --- |
| [01 - `#chat:` completes a chat of the session](task-01-chat-completes-a-chat-of-the-session.md) | done | - |
| [02 - A chat attachment gives the agent a pointer and an excerpt](task-02-a-chat-attachment-gives-a-pointer-and-an-excerpt.md) | done | 01 |

## Resume state

- **Done so far:** built in `302a95b0` and `ee1570c4`, and checked on a second daemon 2026-10-13, see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a client may send a chat of another session; task 02 asks the sender's `session:read` on it. The text the model reads is English and is not localized, as in VS Code.
