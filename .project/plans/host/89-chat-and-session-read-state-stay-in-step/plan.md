---
title: Chat and session read state stay in step
domain: host
status: built
priority: high
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L27-L45](../../../../packages/sdk/src/host/chatactions.ts#L27-L45) - `sessionFlag`, which changes the session bit and nothing below it"
  - "[code://packages/sdk/src/host/chatactions.ts#L119-L159](../../../../packages/sdk/src/host/chatactions.ts#L119-L159) - the chat bit handler, which changes the chat bit and nothing above it"
  - "[code://packages/sdk/src/host/actions.ts#L719-L731](../../../../packages/sdk/src/host/actions.ts#L719-L731) - `session/isReadChanged` and `session/isArchivedChanged`, both through `sessionFlag`"
  - "[code://packages/sdk/src/host/spawn.ts#L731-L957](../../../../packages/sdk/src/host/spawn.ts#L731-L957) - each chat's `emit`, where `chat/turnComplete`, `chat/turnCancelled` and `chat/error` end a turn"
  - "[code://packages/sdk/src/host/spawn.ts#L402-L418](../../../../packages/sdk/src/host/spawn.ts#L402-L418) - a worker chat's `end`, which sends the same three endings"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1032-L1050](../../../../packages/sdk/src/host/lifecycle.ts#L1032-L1050) - `beginOrRun`, where a `!` message becomes a command turn"
  - "[code://packages/sdk/src/host/chatrecord.ts#L101-L102](../../../../packages/sdk/src/host/chatrecord.ts#L101-L102) - `heldChats` and `recordedChats`, the chats of a session, open or all"
  - "[code://packages/sdk/src/host/catalogue.ts#L104-L120](../../../../packages/sdk/src/host/catalogue.ts#L104-L120) - `chatSummary`, which ORs the chat flags into `status`"
  - "[code://packages/sdk/src/host/snapshots.ts#L462-L510](../../../../packages/sdk/src/host/snapshots.ts#L462-L510) - a stored session and its chats read back as `Idle` plus the kept flags"
  - "git://github.com/microsoft/vscode@0817aaa8245 - `markUnreadContribution.ts` marks a chat unread at turn end; `chatArchiveContribution.ts` marks an archived chat read"
  - "git://github.com/microsoft/vscode@43ac7a4a236 - `agentHostStateManager.ts` keeps the session bit and the chat bits in step"
---

## Goal

A chat whose turn ends shows as new, and the session shows as new with it.
A session is read only when all its chats are read, and marking the session read marks its chats read.
An archived chat is read.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "setFlags|setChatFlags" packages/sdk/src` - only `chatactions.ts` L37 and L144 set a read or archived bit.
- `rg "chat/turnComplete" packages/sdk/src/host` - `spawn.ts` sees every ending of a lead chat and of a worker chat.
- `rg "BANG" packages/sdk/src` - `beginOrRun` runs a `!` message as a command turn, which upstream calls a local command.

### Runtime path

```
backend chat/turnComplete -> spawn.ts emit -> dispatch, summaryMoved -> (nothing touches IsRead)
client session/isReadChanged -> actions.ts -> sessionFlag -> session bit only
client chat/isReadChanged -> chatactions.ts chat bit handler -> chat bit only
```

### Gaps

- No turn end clears `IsRead`, so a finished chat never shows as new.
- `sessionFlag` changes the session bit only. The chat handler changes the chat bit only.
- Archiving a chat does not mark it read.
- A new session and a new chat start with flags `0`, which is unread. Upstream starts a new chat read.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A chat whose turn ends with `chat/turnComplete`, `chat/turnCancelled` or `chat/error` is marked unread | Softov, 2026-10-14, chose "Record and plan" for Pass 6 | 02 |
| A worker chat is marked unread at its end, and does not count toward the session | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 43ac7a4a236) | 01, 02 |
| A chat that becomes unread makes a read session unread | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 43ac7a4a236) | 01 |
| A chat that becomes read makes the session read when every counted chat is read | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 43ac7a4a236) | 01 |
| A session marked unread with one counted chat marks that chat unread | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 43ac7a4a236) | 01 |
| A session marked read marks every counted chat read | Softov, 2026-10-14, chose "Mark every chat read" for "What does `session/isReadChanged` true do to unread chats?" | 01 |
| A new session and a new chat start read | Softov, 2026-10-14, "Do a new chat and a new session start read?" (defaulted: upstream 7baac39ec3c) | 01 |
| Archiving a chat that is not the default chat marks it read | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 0817aaa8245) | 03 |
| The host clears a chat's read bit where the protocol chat reducer clears it, and a `!` command turn puts the bit back at its end | Softov, 2026-10-15, chose "Follow the protocol" for "the protocol's reducer marks a chat unread when a turn starts and on each response part; the host keeps the bit until the turn ends. What should the host do?" | 02 |

## Proposed architecture

- **Data flow** - one `chatFlag` helper sets a chat bit, dispatches on the chat, sends `session/chatUpdated` and moves the summary. The chat handler, the turn end and the archive all call it.
- **Event flow** - `chat/turnStarted`, `chat/turnResume` and `chat/inputRequested` send `chat/isReadChanged` false, as the protocol reducer does. A turn end sends it false again, and a `!` command turn's end puts back the bit it had at its start. `session/isReadChanged` follows each change of a counted chat.
- **State flow** - the kept flags stay the only state. A new session and a new chat get `IsRead` when they are made. The counted chats are the open chats from `recordedChats`, without a `tool` origin.
- **Layer responsibilities** - sdk: the helper and the sync in `chatactions.ts`, the turn end in `spawn.ts`, the command turn mark in `lifecycle.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Session and chat read bits move together](task-01-session-and-chat-read-bits-move-together.md) | done | - |
| [02 - A finished turn marks its chat unread](task-02-a-finished-turn-marks-its-chat-unread.md) | done | 01 |
| [03 - An archived chat is read](task-03-an-archived-chat-is-read.md) | done | 01 |

## Risks and tradeoffs

- The sync makes one client action produce more server actions. Each one must be a real change, or a loop starts between the two levels.
- A turn end on an archived session marks it unread, as upstream does. Upstream skips only rejected and local command turns.
- A `0.9.0` window keeps one read bit for the session. Because a session read marks every chat read, that window can clear a session with several chats. Upstream rewrites that action to unread instead.
- A session in the store from before this plan keeps flags `0`, so it stays unread until a client marks it.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are done, and the plan is built, 2026-10-15.
- **Next action:** none. The cases that wait are in [deferred.md](deferred.md).
- **Open questions:** none.
- **Watch out for:** the chat handler runs only for a loaded session (`sessions.has`). A sleeping session has no turn end, but a session read on it still needs the stored chat flags.

## Final verification checklist

- [x] A test: a turn end marks the chat unread and a read session unread.
- [x] A test: a `!` command turn ends with both bits as they were at its start.
- [x] A test: a worker end marks the worker chat unread and leaves the session read.
- [x] A test: the last unread chat marked read makes the session read.
- [x] A test: a session marked read marks every counted chat read.
- [x] A test: a new session and a new chat start read.
- [x] A test: archiving a peer chat marks it read.
- [x] The gates pass: typecheck, boundary, schema and vitest.
- [x] `plans/index.md` updated.
