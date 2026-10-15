---
title: A turn lets go of its sender at every end
domain: host
status: built
priority: medium
created: 2026-10-15
revalidated: 2026-10-15
refs:
  - "[code://packages/sdk/src/host/owners.ts#L96-L135](../../../../packages/sdk/src/host/owners.ts#L96-L135) - `senders` and `sentBy`, the two maps by turn id, and `forgetSender` and `forgetSendersIn`"
  - "[code://packages/sdk/src/host/spawn.ts#L774-L786](../../../../packages/sdk/src/host/spawn.ts#L774-L786) - a queued message's entry is copied to its turn, and the queued id is deleted"
  - "[code://packages/sdk/src/host/spawn.ts#L829-L834](../../../../packages/sdk/src/host/spawn.ts#L829-L834) - the release, on `chat/turnComplete`, `chat/turnCancelled` and `chat/error`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1228-L1251](../../../../packages/sdk/src/host/lifecycle.ts#L1228-L1251) - the entry is written before the command refusal, and the refusal deletes it"
  - "[code://packages/sdk/src/host/chatactions.ts#L1355-L1359](../../../../packages/sdk/src/host/chatactions.ts#L1355-L1359) - `chat/pendingMessageRemoved`, which unqueues and deletes the entry"
  - "[code://packages/sdk/src/host/wakes.ts#L110-L113](../../../../packages/sdk/src/host/wakes.ts#L110-L113) - a wake deletes its entry when the begin fails, the pattern to mirror"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - the chat reducer ends a turn on `chat/error` too"
---

## Goal

The host keeps no `senders` or `sentBy` entry after the turn or the queued message it names is gone.
Today the two maps grow for the life of the daemon, and each `sentBy` entry holds a closed connection.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "senders\.delete|sentBy\.delete" packages/sdk/src` - the turn end in `spawn.ts` and a failed wake in `wakes.ts` only.
- `rg -n "senders\.set|sentBy\.set" packages/sdk/src` - `lifecycle.ts`, `spawn.ts`, `tooling.ts` and `wakes.ts`.

### Runtime path

```
queued message -> senders.set(queuedId) -> chat/turnStarted { queuedMessageId } -> senders.set(turnId) -> turn end -> senders.delete(turnId) -> queuedId stays
```

### Gaps

- A queued message that becomes a turn leaves its entry under the queued id. This happens on every queued message.
- A turn that ends with `chat/error` keeps its entry.
- A queued message that a client removes keeps its entry.
- A `!` command that the backend cannot run keeps its entry.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The leak is fixed at each cause, not with a sweep by age | (defaulted: each cause has one place that knows the entry is done) | 01 |

## Proposed architecture

- **Data flow** - Each road that ends a turn or drops a queued message deletes the entry of that id from both maps.
- **Event flow** - No new event.
- **Layer responsibilities** - sdk only.
- **Source-of-truth files** - [`code://packages/sdk/src/host/owners.ts`](../../../../packages/sdk/src/host/owners.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Every end of a turn deletes its sender](task-01-every-end-of-a-turn-deletes-its-sender.md) | done | - |

## Risks and tradeoffs

- A turn id that a backend uses twice would lose its sender at the first end - The protocol gives each turn its own id.
- host/89 changes `spawn.ts` too - Build this task after host/89 merges.

## Resume state

- **Done so far:** built 2026-10-15, see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a closed backend sends no turn end. A dispose deletes the entries of the chat's running turn and queued messages before it closes the chat.

## Final verification checklist

- [x] Vitest on `packages/sdk` and `packages/server` passes.
- [x] `plans/index.md` updated.
