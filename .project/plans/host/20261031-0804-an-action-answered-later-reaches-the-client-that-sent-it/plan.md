---
title: An action answered later reaches the client that sent it
domain: host
status: built
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
refs:
  - git://fff9c888 - the commit of ahpd this plan was checked at
  - git://764effd7 - only the echo carries the origin, whose plan names the nested session in its "watch out for"
  - "[code://packages/sdk/src/sessions/nested.ts#L492-L500](../../../../packages/sdk/src/sessions/nested.ts#L492-L500) - `deliver` dispatches to the host inside and drops what the dispatch answers"
  - "[code://packages/sdk/src/sessions/nested.ts#L870-L924](../../../../packages/sdk/src/sessions/nested.ts#L870-L924) - `pump` reduces and emits every inner action, a rejection included, with no origin"
  - "[code://packages/sdk/src/sessions/nested.ts#L1190-L1321](../../../../packages/sdk/src/sessions/nested.ts#L1190-L1321) - the session methods each client action reaches, each a `deliver`"
  - "[code://packages/sdk/src/host.ts#L747](../../../../packages/sdk/src/host.ts#L747) - `applying`, the dispatch being applied, held across its synchronous apply"
  - "[code://packages/sdk/src/host.ts#L748-L784](../../../../packages/sdk/src/host.ts#L748-L784) - `owed`, the origin a backend owes a turn begun or stopped, and `originOf`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1420-L1458](../../../../packages/sdk/src/host/lifecycle.ts#L1420-L1458) - `beginOrRun` begins a turn in a machine after the machine is followed, and any turn or queued message after the turn's check"
  - "[code://packages/sdk/src/host/chatactions.ts#L1150-L1210](../../../../packages/sdk/src/host/chatactions.ts#L1150-L1210) - a queued message is handed to `beginOrRun` and owed nothing"
  - "[code://packages/sdk/src/host/spawn.ts#L1196-L1265](../../../../packages/sdk/src/host/spawn.ts#L1196-L1265) - every action a backend emits reaches `dispatch` here, with no origin named"
  - "[code://packages/sdk/src/host/spawn.ts#L1616-L1647](../../../../packages/sdk/src/host/spawn.ts#L1616-L1647) - the turn end held behind a plan update, and what the backend says after it"
  - "[code://packages/sdk/src/types/session.ts#L19](../../../../packages/sdk/src/types/session.ts#L19) - `Emit`, a channel and an action"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/actions.md#L12-L19 - `origin` identifies the client that dispatched an action"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30 - a client holds its action until an envelope with its own origin, or a rejection, answers it"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-chat/actions.ts - `chat/toolCallConfirmed` carries the `turnId` of the call it confirms"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-chat/reducer.ts - `updateToolCallInParts` changes a call only in the active turn the action names"
---

## Goal

A client's action that a backend answers after the host has applied it reaches the client that sent it, as its echo with its origin or as a rejection.
On a nested session, the host inside answers each action the proxy carries in, and its answer is the answer to the client outside: an echo with that client's origin, or a refusal with the inside's reason that changes nothing.
A turn begun on a nested session reaches the proxy after the host has followed the machine, and is answered the same way.
A message queued while the turn's check is asked comes back with its origin, on every backend.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "deliver\(" packages/sdk/src/sessions/nested.ts` - every client action the proxy carries inside goes through one function.
- `rg "client.dispatch" packages/sdk/src/sessions/nested.ts` - the `DispatchHandle` it returns, and the `clientSeq` in it, is dropped.
- `rg "rejectionReason" packages/sdk/src/sessions` - nothing in the proxy reads a rejection.
- `rg ": Start = \{" packages/sdk/src` - the host builds a backend's `Start` in one place.
- `rg "\.owe\(" packages/sdk/src` - a turn begun or stopped is owed; a queued message is not.
- `rg "enteredIn" packages/sdk/src` - every nested session is in a machine, so every turn on one is begun after `followOf`.

### Runtime path

```
dispatchAction -> applyNow (applying) -> chatAction -> Session.setDraft (the proxy) -> deliver -> client.dispatch (clientSeq n)
  ... the host inside answers in a later turn: an envelope with origin { ahpd-nested-<id>, n }, or a rejection
  -> pump -> start.emit (no origin, applying cleared) -> dispatch

dispatchAction -> applyNow -> chatAction (owe turnStarted) -> beginOrRun -> followOf(machine).then(run)
  -> Session.begin (the proxy, applying cleared) -> deliver
```

### Gaps

- A draft, a queued or steering message, a removal, a reorder, a resume, a confirmation, an answer's change and an MCP start or stop on a nested session come back without the origin of the client that sent them.
- An inner rejection is reduced into the mirror and emitted as state, so every client outside applies a change the host inside refused.
- A turn the host inside refuses is never answered outside: the proxy is handed it after the machine is followed, with nothing to answer through.
- An action handed to the proxy before the host inside was up, or still unanswered when it went, is never answered.
- A message queued under the turn's check is said back after the check answers, with no origin, on every backend.
- The proxy's confirmation carries no `turnId`, which the protocol's `chat/toolCallConfirmed` names and its reducer matches the active turn on.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A backend that answers a client's action later holds it through `Start.handed(action)`, with the action it will say back, and answers by emitting with it or by refusing through it | the audit's decision for E22, "a backend emits as the dispatch it was handed" | 01 |
| `Start.handed(action)` finds the dispatch as an echo's origin is found: the one being applied, when `action` is of its kind and about its turn, or one owed under what `action` names | `originOf`, [code://packages/sdk/src/host.ts#L748-L784](../../../../packages/sdk/src/host.ts#L748-L784) | 01 |
| `owed` holds the whole dispatch, so what a backend answers after a wait can be refused as well as echoed | [reconciliation.md](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30) | 01 |
| A queued message is owed under its own id, the id `senders` already follows it by | [code://packages/sdk/src/host/lifecycle.ts#L1362](../../../../packages/sdk/src/host/lifecycle.ts#L1362) | 01 |
| The proxy pairs each answer with the action by the `clientSeq` its client sent it under, which the envelope's origin names | [reconciliation.md](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30) | 01 |
| The proxy's confirmation names the turn of the call it confirms, from the running inner turn it checked the call in | [actions.ts](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-chat/actions.ts) | 01 |
| An inner rejection is a rejection outside, and neither the mirror nor any other client takes it | [reconciliation.md](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30) | 01 |
| An action the host inside will not answer (it ended, it went, it was never reached, the session closed) is refused with the sentence that says why | (defaulted: a client holds its action until it is answered) | 01 |
| A turn or a queued message refused through a `Handed` lets its sender and keys go, as a command refused in `beginOrRun` does | [code://packages/sdk/src/host/lifecycle.ts#L1383-L1387](../../../../packages/sdk/src/host/lifecycle.ts#L1383-L1387) | 01 |
| `chat/inputCompleted` keeps its echo from the host outside, which says it once `answer` has taken it | [code://packages/sdk/src/host/chatactions.ts#L1479](../../../../packages/sdk/src/host/chatactions.ts#L1479) | - |
| A toggle and a config change are not in this plan, and a background start is answered as it is | the audit's fix group 6 and its config group rework the first two; a background start is answered with nothing on every backend ([AHP.md](../../../../docs/sdk/AHP.md)) | - |

## Proposed architecture

- **Data flow** - `applying` and `owed` hold the client's dispatch (`Dispatched`: the sender, the channel, the action and the origin); `ctx.answering(action)` finds the one an action says back; `Start.handed(action)` gives a backend a `Handed` for it, whose origin the host keeps beside it.
- **Event flow** - `Emit` takes an optional `Handed`: an action emitted with one goes out with that client's origin; `Handed.refuse` is a rejection to that client alone.
- **State flow** - the proxy's `answering` maps a `clientSeq` to a `Handed` until the host inside answers it, and `unsent` holds those waiting for the host inside to be up.
- **Layer responsibilities** - host: `applying`, `owed`, `answering`, `owe` · chatactions: a queued message owed · spawn: `Start.handed`, the emit and its held turn end carrying the `Handed` · proxy: `deliver`, `carry`, `pump`, `unanswered`.
- **Source-of-truth files** - [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts), [`code://packages/sdk/src/sessions/nested.ts`](../../../../packages/sdk/src/sessions/nested.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An action answered later reaches the client that sent it](task-01-an-action-answered-later-reaches-the-client-that-sent-it.md) | done | - |

## Risks and tradeoffs

- An action the host inside takes and never says back (a backend call that drops, the audit's fix group 5) is held until the session ends, and refused then.
  Its client held it as pending meanwhile, as it did before.
- An inner echo the host inside sends to its sender alone, an action that changed nothing there, goes out to every client outside: the envelope does not say which of the two it was.

## Resume state

- **Done so far:** planned and built 2026-10-31. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a toggle and a config change on a nested session still come back without their origin, with the groups that rework them.

## Final verification checklist

- [x] Each new case fails on `fff9c888` for the reason it names, and passes after the change.
- [x] The touched suites pass.
- [x] `pnpm run typecheck` and `pnpm run boundary` report no errors.
