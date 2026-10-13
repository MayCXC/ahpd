---
title: A chat attachment gives the agent a pointer and an excerpt
status: done
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

Built. A `chat` attachment becomes a pointer before it reaches a backend, and the turn a client reads still carries the reference it sent.

### What changed, file by file

- `packages/sdk/src/host/chatattachment.ts` (created) - VS Code's `chatAttachmentContext.ts`, ported: `MAX_CHAT_ATTACHMENT_EXCERPT_CHARS` (1000), `boundChatTranscriptTurns`, `formatChatTranscript`, `buildChatAttachmentPointer` and `resolveChatAttachment`. The wording, the 1000-character tail and the two refusals are VS Code's own English, hard-coded, because it is the same model reading the same kind of attachment and no client shows the text. `formatChatTranscript` reads the user text and the `markdown` response parts only, and never expands a `chat` attachment found inside the transcript (step 13). The file also carries the pair the rest of the host needs: `keepChatAttachment(pointer, was)` and `asSentAttachment(one)`, over a module-private `WeakMap<MessageAttachment, MessageAttachment>`.
- `packages/sdk/src/host/lifecycle.ts` - `messageAttachments(message, sender?)` returns a new `Attached` shape, `{ attachments }` or `{ refusal }`, because a refusal here is answered rather than thrown: this runs on the path that applies an action, and a throw there escapes with the client's optimistic turn still standing. A list with no `chat` attachment in it is returned untouched, as the same array (step 5). Each `chat` attachment is looked up through `chatOf` (so every spelling of a chat URI is the same chat here as everywhere else), its session through `byChat`, and its link through `openLink` with `chatIdFor(live.uri, named)` - a session's own chat has no id, so its link is the session's. `mayRead(sender)` is `true` with no user directory, `true` on the deployment's own token, and otherwise the sender's `principal.can('session:read')`; where it is false, or the chat is not one this host holds, the attachment becomes the pointer with the raw resource, no link, no excerpt and no `endTurn` (step 9, decision 41 and 43). The running-turn check reads the chat's own `chatState().activeTurn` rather than what the completion offered, because the case is exactly a chat attached while it is still answering. A pin not in the retained transcript is `resolveChatAttachment`'s throw, turned into the same refusal.
- `packages/sdk/src/host/chatactions.ts` - the four callers, each reading the attachments before anything is started so a refusal is a refusal of the message and not of a turn that has already begun: the not-yet-loaded session's `chat/turnStarted` (`:333`), the held session's `chat/turnStarted` (`:465`), `chat/pendingMessageSet` steering (`:1061`) and the queued path (`:1082`). The last two read the attachments when the action arrives rather than when the turn comes round, so a chat that is gone by then is still answered for.
- `packages/sdk/src/host/spawn.ts` - `asSentChat(state)` and its three helpers, and `asSent(action)` on the emitter (`:180`, `:197`, `:217`, called at the two dispatch sites). This is step 12, and it is the `_meta`/`withSender` split again: a fact the host added is put back on both roads out, once for the wire and once for a read.
- `packages/sdk/src/host/snapshots.ts:334` - the live chat state is served through `ctx.asSentChat(state)`, so a subscriber reads the message it sent rather than the pointer.
- `packages/sdk/test/host-chat-attachment.test.ts` (created) - the seven bullets below plus one more (a pin that is not in the transcript), eight cases. `opened()` builds a host, creates `ahp-session:/live`, reads the session's own chat out of the snapshot rather than writing its URI down, subscribes to that chat and then creates a second chat to attach. `sent()` dispatches a message and returns the blocks the backend was handed, with the turn left running.
- `docs/CHATS.md` - one paragraph in **Attachments**, "what an agent gets for a chat attachment" (step 14).

### Decisions, as read from the plan

- The pointer is the title, the `openLink`, the hint to call `get_session_context` and the last 1000 characters of the transcript up to `endTurn` (row 39); the transcript is the user text and the assistant markdown only, and a nested `chat` attachment is not resolved again (row 40); a chat that cannot be read gives the pointer with no excerpt and never fails the turn (row 41); an `endTurn` that is the running turn refuses the message (row 42); under a users directory a session the sender may not `session:read` is a chat that cannot be read (row 43); the turn keeps the `chat` attachment and only the backend gets the pointer (row 44).
- The refusal wording is VS Code's, verbatim, because a client that shows the reason shows the same one either host sends: `Chat attachment endTurn must reference a completed turn: <resource>#<endTurn>` and `Chat attachment endTurn <endTurn> was not found in the retained transcript.`
- A chat this host is not running is not a refusal: the reference outlives the session it names, a message that arrives with it is still a message, and the pointer identifies it by the raw resource instead of a link (VS Code's own degradation when it cannot build one).
- Row 42's check is against the chat's live `activeTurn`, not against the completion: the person attaches the chat they are looking at, which may have started answering since the completion was offered.

### Where the plan and the code disagree

Reported rather than guessed, as task 01 did:

- **`messageAttachments` takes only the sender, not the channel.** Step 4 and the Files row say "the channel and the sending connection"; the channel is not needed. The chat is found from the attachment's own `resource` through `chatOf`/`byChat`, the link needs only the session and its provider, and the read grant is asked by subject, not by session - so a channel parameter would have been carried and never read. Not written rather than written dead.
- **The documentation went into `docs/CHATS.md`, not `docs/HOST.md`.** Step 14 and the Files row name HOST.md, which is the page for the host process - what it announces, what it serves, and every setting it reads - and has no prose about messages at all. Attachments are documented in CHATS.md's **Attachments** section, beside the four kinds that are carried rather than resolved, and that is where the paragraph went. Nothing was written in HOST.md.

### Seen, and not this task's

- `createChat`'s `initialMessage` (`sessionmethods.ts:1160`) drops every attachment, of every kind: it calls `beginOrRun(...)` with no attachments argument at all. Pre-existing, and untouched here.
- A worker chat is not resolved. Worker chats live in `subagents` and not in `byChat`, so an attachment naming one takes the unknown-chat road: the pointer with the raw resource, no link and no excerpt. Worker chats are not in this task's bullets, and reading one would need a link and a source-turns read this host does not have.
- A refusal on a chat channel the client never named goes out under the host's canonical spelling. `refuse` respells a channel only through the connection's aliases, which are set when a client names a channel in a request and never by a dispatch. So the test subscribes to the chat it dispatches on, which is what a client showing a chat does; changing the spelling behaviour of `refuse` is a change to every refusal in this host and is not this task's.

### Validation

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` all exit 0. The schema is byte-identical (508 definitions from 506 exported types) and is not in the diff.
- vitest, `--maxWorkers=2 --testTimeout=10000`, over the four packages in one run: 4322 passed in 241 files - 8 of them the new file, which covers all seven bullets and the second refusal.

### Left

- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by this run too, 33 lines, and the restore command is still denied in this session: it needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` from somebody who can run one. As in task 01, none of the churn is this task's - it is the fixture catching up with work already on the branch.
- Nothing is committed. Task 02's own files are the six above.
