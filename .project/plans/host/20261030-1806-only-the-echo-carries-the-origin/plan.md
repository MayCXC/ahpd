---
title: Only the echo carries the origin
domain: host
status: planned
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/sdk/src/host.ts#L719-L739](../../../../packages/sdk/src/host.ts#L719-L739) - `applying`, the origin of the dispatch being applied, held across its synchronous apply"
  - "[code://packages/sdk/src/host.ts#L804](../../../../packages/sdk/src/host.ts#L804) - `dispatch` gives every action it sends during an apply that dispatch's origin by default"
  - "[code://packages/sdk/src/host.ts#L1704-L1708](../../../../packages/sdk/src/host.ts#L1704-L1708) - `applyNow` sets `applying` and clears it once the apply returns"
  - "[code://packages/sdk/src/host.ts#L918-L953](../../../../packages/sdk/src/host.ts#L918-L953) - `refuse` and `echoTo`, which answer a dispatch with its origin named"
  - "[code://packages/sdk/src/host/context.ts#L322-L330](../../../../packages/sdk/src/host/context.ts#L322-L330) - the documented default of `dispatch`, and the sites that pass an origin themselves"
  - "[code://packages/sdk/src/host/chatactions.ts#L383-L431](../../../../packages/sdk/src/host/chatactions.ts#L383-L431) - a turn on a sleeping session, begun after `wake` on a road of its own"
  - "[code://packages/sdk/src/host/chatactions.ts#L478-L500](../../../../packages/sdk/src/host/chatactions.ts#L478-L500) - any other action on a sleeping session, applied again through `conn.applyNow` after the wake, the pattern to reuse"
  - "[code://packages/sdk/src/host/chatactions.ts#L517-L560](../../../../packages/sdk/src/host/chatactions.ts#L517-L560) - a turn handed to its backend through `beginOrRun`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1115-L1152](../../../../packages/sdk/src/host/chatactions.ts#L1115-L1152) - a stop handed to its backend through `Session.cancel`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1519-L1534](../../../../packages/sdk/src/host/chatactions.ts#L1519-L1534) - a chat started over says its truncation once the delete has worked"
  - "[code://packages/sdk/src/host/actions.ts#L394-L417](../../../../packages/sdk/src/host/actions.ts#L394-L417) - the echo of a daemon key goes out once the port has answered the write"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1294-L1460](../../../../packages/sdk/src/host/lifecycle.ts#L1294-L1460) - `beginOrRun` begins a turn after a policy check or after its machine is followed"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1362-L1365](../../../../packages/sdk/src/host/lifecycle.ts#L1362-L1365) - who sent a turn, kept by its turn id, the precedent for an origin kept the same way"
  - "[code://packages/sdk/src/host/machines.ts#L312](../../../../packages/sdk/src/host/machines.ts#L312) - `followOf` waits on the port before every turn in a machine"
  - "[code://packages/sdk/src/host/spawn.ts#L1196-L1265](../../../../packages/sdk/src/host/spawn.ts#L1196-L1265) - every action a backend emits reaches `dispatch` here, with no origin named"
  - "[code://packages/agent-claude/src/session/turns.ts#L269-L285](../../../../packages/agent-claude/src/session/turns.ts#L269-L285) - Claude says a turn began only after the CLI has the model the turn names"
  - "[code://packages/sdk/src/sessions/nested.ts#L870-L916](../../../../packages/sdk/src/sessions/nested.ts#L870-L916) - the proxy emits what the host inside says, after the dispatch outside was applied"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/actions.md#L12-L19 - `origin` identifies the client that dispatched an action, and its absence means the server produced it"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30 - a client pops its pending action on an envelope with its own origin and treats every other as foreign"
---

## Goal

A client's own action comes back to it carrying its origin, whenever the host says it.
Nothing else the host says carries that origin.
The client then reconciles its pending actions as the protocol describes, and never takes a host action for its own.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "applying|applyNow|origin = applying" packages/sdk/src` - one variable decides the origin of every action sent during an apply.
- `rg "dispatch\([^;]*, origin\)" packages/sdk/src` - eight sites name the origin themselves.
- `rg "origin.*clientSeq" packages/sdk/test` - the suites assert the echo's origin, and that an agent's reply carries none.

### Runtime path

```
dispatchAction -> applyNow (applying = origin) -> applyDispatch -> a handler or Session.begin -> dispatch (origin = applying) -> emit
  after an await: wake, a policy check, a machine, a model switch, a cancelled prompt, the host inside a machine -> dispatch with applying cleared
```

### Gaps

- Every action sent while a dispatch is applied carries its origin: a first turn's title, a chat's row, a read flag, an agent's reply part.
- An echo said after an await carries none.
  That is a turn on a sleeping session, after a policy check, in a machine, after a model switch, or through the proxy.
- A stop a backend says once its prompt has let go carries none, on cofold, pi and ACP.
- A chat started over, and a daemon key written through the port, say their echo after an await and name no origin.
- `context.ts` documents the first gap as intended.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Only the echo of the dispatch carries its origin: the one action of its type, and of its turn when it names one | [actions.md](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/actions.md#L12-L19), [reconciliation.md](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30) | 01 |
| A turn on a sleeping session is applied again through `conn.applyNow` once it is awake | [code://packages/sdk/src/host/chatactions.ts#L478-L500](../../../../packages/sdk/src/host/chatactions.ts#L478-L500) | 01 |
| A turn begun or stopped through a backend is owed its origin under its turn id until the backend says it | the audit's fix group 1; [code://packages/sdk/src/host/lifecycle.ts#L1362-L1365](../../../../packages/sdk/src/host/lifecycle.ts#L1362-L1365) | 01 |
| A stop that names no turn is owed under the turn it stops | (defaulted: the backend names the turn it stopped) | 01 |
| A site that says its echo after an await of its own passes the origin it was given | [code://packages/sdk/src/host/context.ts#L322-L330](../../../../packages/sdk/src/host/context.ts#L322-L330) | 01 |
| A turn that ends lets go of what it still owes | (defaulted: nothing is said under a turn after its end) | 01 |
| `pendingMessageRemoved` for an unknown id and the session flags of `isRead` and `isArchived` stay as they are | the maintainer's brief claims them | - |

## Proposed architecture

- **Data flow** - `applying` holds the origin, the type and the turn of the dispatch being applied, and whether its echo went out.
- **Event flow** - an action with no origin named gets one only as the dispatch's echo, or as an echo a backend owes.
- **State flow** - `owed` maps a type and a turn id to an origin, set by `owe` and cleared when said, refused or ended.
- **Layer responsibilities** - host: `applying` and `owed` · chat actions: the wake, a turn, a stop, the start over · actions: the daemon key.
- **Source-of-truth files** - [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Only the echo carries the origin](task-01-only-the-echo-carries-the-origin.md) | todo | - |

## Risks and tradeoffs

- An echo whose type differs from the action the client sent loses the origin it carried by accident.
  The existing suites hold each echo they assert, and every one is of the dispatched type.
- An action a backend drops, such as a stop that came too late, still leaves its client waiting.
  The audit's fix group 5 answers those, and this plan lets go of the record at the turn's end.

## Resume state

- **Done so far:** planned 2026-10-30.
- **Next action:** [task-01-only-the-echo-carries-the-origin.md](task-01-only-the-echo-carries-the-origin.md).
- **Open questions:** none.
- **Watch out for:** a client action other than a turn or a stop, sent to a nested session, still comes back without its origin.

## Final verification checklist

- [ ] Each new case fails on `920d154a` for the reason it names, and passes after the change.
- [ ] The touched suites and the suites that assert an origin pass.
- [ ] `pnpm run typecheck` reports no errors.
