---
title: A turn lets go of its sender at every end
domain: host
status: planned
priority: medium
created: 2026-10-15
revalidated: 2026-10-15
refs:
  - "[code://packages/sdk/src/host/owners.ts#L96-L114](../../../../packages/sdk/src/host/owners.ts#L96-L114) - `senders` and `sentBy`, the two maps by turn id"
  - "[code://packages/sdk/src/host/spawn.ts#L759-L766](../../../../packages/sdk/src/host/spawn.ts#L759-L766) - a queued message's entry is copied to its turn, and the queued id stays"
  - "[code://packages/sdk/src/host/spawn.ts#L810-L815](../../../../packages/sdk/src/host/spawn.ts#L810-L815) - the release, on `chat/turnComplete` and `chat/turnCancelled` only"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1041-L1058](../../../../packages/sdk/src/host/lifecycle.ts#L1041-L1058) - the entry is written before the command refusal returns"
  - "[code://packages/sdk/src/host/chatactions.ts#L1272-L1274](../../../../packages/sdk/src/host/chatactions.ts#L1272-L1274) - `chat/pendingMessageRemoved`, which unqueues and keeps the entry"
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
| [01 - Every end of a turn deletes its sender](task-01-every-end-of-a-turn-deletes-its-sender.md) | todo | - |

## Risks and tradeoffs

- A turn id that a backend uses twice would lose its sender at the first end - The protocol gives each turn its own id.
- host/89 changes `spawn.ts` too - Build this task after host/89 merges.

## Resume state

- **Done so far:** the plan, 2026-10-15, from the handoff's small fixes.
- **Next action:** build task 01 after host/89 merges.
- **Open questions:** none.
- **Watch out for:** a session disposed with a turn running. Check that the backend sends a turn end, and add the delete to the dispose if it does not.

## Final verification checklist

- [ ] Vitest on `packages/sdk` and `packages/server` passes.
- [ ] `plans/index.md` updated.
