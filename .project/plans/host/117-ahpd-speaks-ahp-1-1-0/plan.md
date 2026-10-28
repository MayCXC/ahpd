---
title: ahpd speaks AHP 1.1.0
domain: host
status: draft
priority: medium
created: 2026-10-22
revalidated: 2026-10-22
requires:
  - plans/host/44-ahpd-speaks-ahp-1-0-0/plan.md
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L132-L176](../../../../packages/sdk/src/host/handshake.ts#L132-L176) - `initialize`, which negotiates with the package and adds the `0.10.0` alias"
  - "[code://packages/sdk/src/host/chatactions.ts#L680-L1058](../../../../packages/sdk/src/host/chatactions.ts#L680-L1058) - the `session/configChanged` case, with its refusals, `undo`, `remember` and the `scope` split"
  - "[code://packages/sdk/src/host/chatactions.ts#L1145-L1180](../../../../packages/sdk/src/host/chatactions.ts#L1145-L1180) - `chat/pendingMessageSet`, which hands a steering message to `session.steer`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1394-L1402](../../../../packages/sdk/src/host/chatactions.ts#L1394-L1402) - `chat/pendingMessageRemoved` and `chat/queuedMessagesReordered`"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L261-L377](../../../../packages/sdk/src/host/sessionconfig.ts#L261-L377) - `propertyOf`, `published` and `runningSchema`, where a schema key is read and published"
  - "[code://packages/sdk/src/host/snapshots.ts#L310-L335](../../../../packages/sdk/src/host/snapshots.ts#L310-L335) - the chat snapshot, where the host lays its own per-chat flags over the backend's state"
  - "[code://packages/sdk/src/sessions/sessions.ts#L166-L173](../../../../packages/sdk/src/sessions/sessions.ts#L166-L173) - `chatFlags`, the per-chat value the store already keeps"
  - "[code://packages/sdk/src/types/agent.ts#L625-L648](../../../../packages/sdk/src/types/agent.ts#L625-L648) - `schema()`, which documents `scope` as this library's own per-chat flag"
  - "[code://packages/agent-claude/src/session/turns.ts#L484-L503](../../../../packages/agent-claude/src/session/turns.ts#L484-L503) - `steer`, which holds one steering slot"
  - "[code://packages/agent-claude/src/session/query.ts#L186-L200](../../../../packages/agent-claude/src/session/query.ts#L186-L200) - the input loop, which clears the slot on each message it reads"
  - "[code://packages/sdk/src/host/catalogue.ts#L664-L686](../../../../packages/sdk/src/host/catalogue.ts#L664-L686) - `learnModels`, which compares model ids only"
  - "[code://UPSTREAM.md#L11-L16](../../../../UPSTREAM.md#L11-L16) - Pass 7, the three Protocol 1.1.0 boxes and the experimental note"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - the latest published version on 2026-10-22; 1.1.0 is not published"
  - "git://github.com/microsoft/agent-host-protocol@dbbd1217 - per-chat config: `ChatState.config`, `chat/configChanged` with `replace`, `chatMutable`"
  - "git://github.com/microsoft/agent-host-protocol@5d542f9e - steering and queued messages share `queuedMessages`, told apart by `PendingMessage.kind`"
  - "git://github.com/microsoft/agent-host-protocol@65114f22 - optional `SessionModelInfo.vendor`"
  - "git://github.com/microsoft/agent-host-protocol@1ef06429 - `CreateChatParams.title`, in 1.1.0 development and not in the VS Code pin"
  - "git://github.com/microsoft/vscode@e941aa12741 - per-chat configuration: the effective order, the chat-mutable keys, the refusals in `agentService.ts`"
  - "git://github.com/microsoft/vscode@0b4e0632b1f - several pending steering messages, read by `getPendingSteeringMessages`"
  - "git://github.com/microsoft/vscode@e646868227c - VS Code 1.143.1, pinned to AHP `5d542f9e`; the window offers `1.0.0`, `0.10.0` and `0.9.0`"
---

## Goal

ahpd speaks AHP 1.1.0 once the 1.1.0 package is on npm.
A chat can hold its own value for a config key and leave the rest to its session.
Several steering messages can wait at once, beside the queued ones, in one list.
A model can name its vendor.
The experimental windowed delivery and the TCP channel stay out of this plan.
A client-selected `CreateChatParams.title` stays out too, for the pass that takes the next VS Code pin.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `npm view @microsoft/agent-host-protocol versions` on 2026-10-22 - 0.2.0 to 0.9.0 and 1.0.0. The latest is 1.0.0, published 2026-10-03. 1.1.0 is not published.
- `git log 5f16d81b..1ef06429` in the AHP repository - the 1.1.0 changes after the 1.0.0 release. `CHANGELOG.md` has an empty `1.1.0 - Unreleased` section.
- `rg "chatMutable" common/ node/` in VS Code 1.143.1 - the platform keys `permissions`, `sandboxEnabled`, `autoApprove` and `mode`, Claude's `permissionMode`, eight Codex keys and Copilot's `effectiveApprovalMode`.
- `rg "scope" packages/sdk/src/host packages/agent-*/src` - ahpd's own per-chat flag. `effortLevel` is the only `scope: 'chat'` key in a backend.
- `rg "steeringMessage|queuedMessages" packages/*/src` - agent-claude holds one slot. `tooling.ts`, `wakes.ts`, `sleep.ts`, `owners.ts`, `spawn.ts` and `nested.ts` read or forward the two fields.
- `rg "vendor" packages/*/src` - no backend sets `SessionModelInfo.vendor`.

### Runtime path

```
1.143 window -> chat/configChanged on ahp-chat:// -> chatactions.ts -> chat session setConfig -> ChatState.config in the chat snapshot
1.143 window -> chat/pendingMessageSet kind steering -> session.steer -> queuedMessages entry with kind steering -> removed when the backend reads it
```

### Gaps

- The installed 1.0.0 package has no `ChatState.config`, no `chat/configChanged` and no `chatMutable`.
- A 1.143 window sends `chat/configChanged` for any `chatMutable` key, on any agreed version. It gates by schema, not by version.
- ahpd has a per-chat key (`scope: 'chat'`), but it publishes no `chatMutable` and drops `scope` on the wire.
- Two steers before the Claude CLI reads leave the first id in the list for good. The slot keeps the second id, and the read removes only that one.
- The Claude snapshot sends steering only in `steeringMessage`, with no `kind` entry in `queuedMessages`.
- An offer of `1.1.0` already gets `1.1.0` from the 1.0.0 package, by its caret rule, before ahpd serves 1.1.0.
- On AHP main, `SUPPORTED_PROTOCOL_VERSIONS` stays `1.0.0` and `0.9.0`, so the `-32005` refusal would not list `1.1.0`.
- `Not found: a VS Code agent that sets SessionModelInfo.vendor - searched "vendor" in src/vs/platform/agentHost/node.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| Plan protocol 1.1.0: per-chat config and the pending-message list; the plan waits for the published 1.1.0 package | Softov, 2026-10-22, chose "Protocol 1.1.0: per-chat config and the pending-message list; waits for the published 1.1.0 package." | 01 |
| Windowed delivery and the TCP channel stay out | Softov, 2026-10-22, the same answer (defaulted: Pass 7 says both are experimental and the window uses neither) | - |
| The ranges move to `^1.1.0` in the same files and the same way as 1.0.0 did | (defaulted: sibling [task 02 of 44-p1](../44-p1-ahpd-speaks-1-0-0-and-0-9-0/plan.md)) | 01 |
| The handshake keeps the package negotiation and the `0.10.0` alias; it adds no version of its own | (defaulted: [plan 88](../88-a-0-10-0-offer-gets-the-1-0-0-contract/plan.md) runs the package negotiation first) | 01 |
| A chat's overlay is the chat's own values over the session's config, as `ChatState.config.values` | (defaulted: AHP `dbbd1217` reducer) | 02 |
| `chat/configChanged` merges, and `replace` sets the whole overlay; a key left out of a replace takes the session's value | (defaulted: AHP `dbbd1217` reducer and its fixtures) | 02 |
| A key that is not `chatMutable` is refused with "cannot be set for a chat" | (defaulted: upstream `e941aa12741`, `validateChatConfigWrite`) | 02 |
| A subagent or worker chat refuses its own config, since it inherits from the chat that spawned it | (defaulted: upstream `e941aa12741`, `_prepareChatConfigAction`) | 02 |
| A refused write is undone with the same `undo` the session case uses | (defaulted: sibling `session/configChanged` case in `chatactions.ts`) | 02 |
| A `session/configChanged` for a chat-mutable key skips the chats whose overlay holds that key | (defaulted: upstream `e941aa12741`, effective order chat, then session, then host) | 02 |
| The overlay is kept per chat in the session store, beside `chatFlags` | (defaulted: sibling `chatFlags` in `sessions.ts`) | 02 |
| `chat/configChanged` needs the `session:configure` grant | (defaulted: sibling `session/configChanged` in `gate.ts`) | 02 |
| No connection filter for `chat/configChanged`; every subscriber gets it, as the window sends it on 1.0.0 too | (defaulted: upstream keeps no version filter; plan 88 keeps no version on the `Connection`) | 02 |
| Steering and queued entries share `queuedMessages`; `steeringMessage` mirrors the latest steering entry | (defaulted: AHP `5d542f9e` reducer, upstream `0b4e0632b1f`) | 04 |
| agent-claude holds a list of steering entries, and each read of the CLI input removes the oldest | (defaulted: upstream `0b4e0632b1f`; the input loop in `query.ts` is first in, first out) | 04 |
| A backend that submits a steer at once (cofold, pi, bot) emits no pending entry, as today | (defaulted: no pending state to show) | 04 |
| The chat-mutable keys are every `scope: 'chat'` key (`effortLevel` today), plus Claude's `permissionMode` and `permissions`, as VS Code marks them | Softov, 2026-10-22 | 03 |
| The `schema()` doc in `agent.ts` no longer says a permission mode is the session's | Softov, 2026-10-22 | 03 |
| `scope` stays: `scope: 'chat'` goes out as `chatMutable: true`, and a backend can also set `chatMutable` on a shared key, shared by default and changeable per chat | Softov, 2026-10-22 | 03 |
| A chat write that its backend cannot apply (no `setConfig`, or a key fixed at start such as pi's `projectTrust`) is refused with the reasons of the session case | Softov, 2026-10-22 | 02 |
| `CreateChatParams.title` is out of scope, left for the pass that takes the next VS Code pin | Softov, 2026-10-22 | - |
| No backend fills `vendor` yet; task 05 only passes it through | Softov, 2026-10-22 | 05 |
| `SessionModelInfo.vendor` passes through from `models()`, and a changed vendor is a changed list | (defaulted: Pass 7 lists it in the Protocol 1.1.0 section) | 05 |
| `docs/sdk/AHP.md`, the README badge and the Pass 7 boxes move with the package | (defaulted: sibling task 04 of 44-p1) | 06 |

## Proposed architecture

- **Data flow** - a chat write goes to that chat's backend session only. A session write goes to every chat that does not override the key.
- **Event flow** - the host dispatches `chat/configChanged` on the chat channel when the backend accepts. The pending list moves by the 1.1.0 reducer rules.
- **State flow** - the store keeps each chat's overlay. The chat snapshot lays it over the backend's state as `config`, the way it lays `chatFlags` over `status`.
- **Layer responsibilities** - sdk: the action, the validation, the store and the snapshot · agent-claude: the steering list and the snapshot shape · backends: which keys are chat-mutable.
- **Source-of-truth files** - [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts), [`code://packages/sdk/src/host/sessionconfig.ts`](../../../../packages/sdk/src/host/sessionconfig.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The 1.1.0 package is installed](task-01-the-1-1-0-package-is-installed.md) | blocked | - |
| [02 - A chat keeps its own config](task-02-a-chat-keeps-its-own-config.md) | todo | 01 |
| [03 - Backend keys are chat-mutable](task-03-backend-keys-are-chat-mutable.md) | todo | 02 |
| [04 - Steering messages share the list](task-04-steering-messages-share-the-list.md) | todo | 01 |
| [05 - A model names its vendor](task-05-a-model-names-its-vendor.md) | todo | 01 |
| [06 - The documents say 1.1.0](task-06-the-documents-say-1-1-0.md) | todo | 02, 03, 04, 05 |

## Risks and tradeoffs

- The published 1.1.0 can differ from AHP main. Task 01 compares the package with the refs above before any other task starts.
- The 1.0.0 package already answers an offer of `1.1.0` with `1.1.0`.
  ahpd serves the 1.0.0 wire to that client until this plan is built. The caret rule is the package's, and a refusal would answer a version the client did not offer.
- A window sends `chat/configChanged` on a 1.0.0 connection once a key is chat-mutable. Task 03 marks no key until task 02 handles the action.
- `scope: 'chat'` and `chatMutable` are two names for close ideas. A shared key with `chatMutable` is the one case where they differ.

## Resume state

- **Done so far:** the plan, 2026-10-22. Softov deferred the plan on 2026-10-28. AHP 1.1.0 is not on npm on that date, and the newest version is 1.0.0.
- **Next action:** none until Softov takes the plan back up. Then [task-01-the-1-1-0-package-is-installed.md](task-01-the-1-1-0-package-is-installed.md), when `npm view @microsoft/agent-host-protocol@1.1.0` answers.
- **Open questions:** none.
- **Watch out for:** `isActionKnownToVersion` says `chat/configChanged` is 1.1.0. Do not use it to hold the action back, since the window sends it on 1.0.0.

## Final verification checklist

- [ ] The ranges say `^1.1.0`, and the lockfile resolves 1.1.0.
- [ ] A test: `chat/configChanged` merges, replaces, and resets a key left out of a replace.
- [ ] A test: a key that is not chat-mutable and a subagent chat are both refused.
- [ ] A test: the chat snapshot carries `config`, and it survives a restart.
- [ ] A test: two steers before a read leave no stale entry.
- [ ] The conformance test replays the new actions through the 1.1.0 reducers.
- [ ] The gates pass: typecheck, boundary, schema and vitest.
- [ ] `plans/index.md` updated.
