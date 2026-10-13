---
title: A chat attachment gives the agent a pointer and an excerpt
status: todo
depends:
  - task-01-chat-completes-a-chat-of-the-session.md
layer: sdk
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L1179-L1183](../../../../packages/sdk/src/host/lifecycle.ts#L1179-L1183) - `messageAttachments`, used by begin, queue and steer"
  - "[code://packages/sdk/src/host/chatactions.ts#L331](../../../../packages/sdk/src/host/chatactions.ts#L331) - a turn begun, one of the four callers; the others are at :453, :1043 and :1066"
  - "[code://packages/sdk/src/attachments.ts#L100-L135](../../../../packages/sdk/src/attachments.ts#L100-L135) - `partsOf`, which gives a `simple` attachment's `modelRepresentation` to the model"
  - "[code://packages/sdk/src/tools/session.ts#L29](../../../../packages/sdk/src/tools/session.ts#L29) - `openLink`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1073](../../../../packages/sdk/src/host/lifecycle.ts#L1073) - `principalFor`, the grants of the sender"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/common/state/chatAttachmentContext.ts`: `boundChatTranscriptTurns`, `formatChatTranscript`, `buildChatAttachmentPointer`, `resolveChatAttachment`"
  - "git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/node/agentSideEffects.ts:2199-2240`: `_resolveChatAttachments`"
---

## Objective

Before a message reaches its backend, each `chat` attachment becomes a `simple` attachment with a pointer to that chat.
The pointer names the chat, gives its `openLink`, tells the model to call `get_session_context`, and holds the last 1000 characters of the transcript.
The turn keeps the `chat` attachment as the client sent it.

## Files

- `CREATE: packages/sdk/src/host/chatattachment.ts` - the bound, the format and the pointer, ported from VS Code's `chatAttachmentContext.ts`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1179-1183` - `messageAttachments` takes the channel and the sender, and resolves each `chat` attachment.
- `UPDATE: packages/sdk/src/host/chatactions.ts:331` - the four callers pass the channel and the connection.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:107` - the context type of `messageAttachments`.
- `CREATE: packages/sdk/test/host-chat-attachment.test.ts` - the cases below.
- `UPDATE: docs/HOST.md` - what an agent gets for a chat attachment.

## Steps

1. Read the plan's *Decisions locked in* rows for task 02.
2. Port `boundChatTranscriptTurns`, `formatChatTranscript` and `buildChatAttachmentPointer` into `chatattachment.ts`, with VS Code's English text.
3. Use `get_session_context` as the tool name in the pointer, and 1000 as `MAX_CHAT_ATTACHMENT_EXCERPT_CHARS`.
4. Give `messageAttachments` the channel and the sending connection, and pass them from the four callers in `chatactions.ts`.
5. Return the list unchanged when it holds no `chat` attachment.
6. For each `chat` attachment, find the chat by its `resource` and read its completed turns.
7. Build the `openLink` of that chat with `openLink` from `tools/session.ts`.
8. Under a users directory, treat the chat as unreadable when the sender may not `session:read` its session.
9. For an unreadable or unknown chat, give the pointer with no excerpt and no `endTurn`.
10. Refuse the message with VS Code's words when `endTurn` is the id of the running turn of that chat.
11. Replace each `chat` attachment with `{ type: 'simple', label, modelRepresentation }` in the list given to the backend.
12. Keep the `chat` attachment in the turn's own state, so a client still draws its label.
13. Do not resolve a `chat` attachment found inside the transcript.
14. Write in `docs/HOST.md` what an agent gets for a chat attachment.

## Validation

- `host-chat-attachment.test.ts`: the backend gets a `simple` attachment with the title, the link and the transcript.
- `host-chat-attachment.test.ts`: a transcript over 1000 characters gives only its last 1000 characters.
- `host-chat-attachment.test.ts`: `endTurn` cuts the transcript at that turn.
- `host-chat-attachment.test.ts`: an unknown chat gives the pointer with no excerpt, and the turn runs.
- `host-chat-attachment.test.ts`: under a users directory, a chat in a session the sender may not read gives no excerpt.
- `host-chat-attachment.test.ts`: an `endTurn` that is still running refuses the message.
- `host-chat-attachment.test.ts`: the turn's state still holds the `chat` attachment.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume
