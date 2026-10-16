---
title: An unchanged client set is echoed back
domain: host
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/host/actions.ts#L664-L726](../../../../packages/sdk/src/host/actions.ts#L664-L726) - the `session/activeClientSet` handler, with the silence guard at line 713"
  - "[code://packages/sdk/src/host/actions.ts#L81](../../../../packages/sdk/src/host/actions.ts#L81) - `no`, the refusal of the handler"
  - "[code://packages/sdk/src/host/actions.ts#L283-L286](../../../../packages/sdk/src/host/actions.ts#L283-L286) - a `root/configChanged` refused after a promise, to the sender only"
  - "[code://packages/sdk/src/host.ts#L746-L757](../../../../packages/sdk/src/host.ts#L746-L757) - `refuse`: to the sender only, at the current `serverSeq`, not buffered"
  - "[code://packages/sdk/src/host.ts#L1346-L1360](../../../../packages/sdk/src/host.ts#L1346-L1360) - `dispatchAction`, which sets `origin` and waits on `behind`"
  - "[code://packages/sdk/src/host/tooling.ts#L1087-L1100](../../../../packages/sdk/src/host/tooling.ts#L1087-L1100) - `retool`: `setTools` runs after the dispatch, and a failure is only logged"
  - "[code://packages/sdk/src/host/chatactions.ts#L1096-L1099](../../../../packages/sdk/src/host/chatactions.ts#L1096-L1099) - a lead chat's `chat/turnCancelled` says nothing when no turn runs"
  - "[code://docs/sdk/AHP.md#L651-L659](../../../../docs/sdk/AHP.md#L651-L659) - \"An action that changes nothing is not a change\", and the loop of 300 round trips"
  - "[code://packages/sdk/test/presence.test.ts#L121-L142](../../../../packages/sdk/test/presence.test.ts#L121-L142) - the tests of the silence and of a changed set"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostStateManager.ts#L2029-L2052 - VS Code echoes every client action and moves `serverSeq`, a rejection too"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/state/agentSubscription.ts#L313-L383 - VS Code's client keeps a pending action until its echo or its rejection"
  - "file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts#L1145-L1160 - VS Code's client does not send an unchanged set"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentSideEffects.ts#L514-L533 - `_fanOutActiveClient`, which never refuses a set"
  - "file:///github/agent-host-protocol/docs/specification/session-channel.md#L160-L167 - an invalid action MUST be echoed with a `rejectionReason`"
  - "file:///github/agent-host-protocol/docs/guide/reconciliation.md#L15-L30 - the client's reconciliation algorithm"
---

## Goal

A client that sends `session/activeClientSet` or `chat/turnCancelled` always gets an answer to its `clientSeq`.
An announcement that changes nothing gets an echo to its sender only, so the client drops its pending action.
The other clients hear nothing, so the loop of 300 round trips cannot come back.

## Reconnaissance

### Searches performed

- `rg -n "activeClientSet" packages/sdk/src` - one handler in `actions.ts`, and the gate row at `gate.ts:146`.
- `rg -n "rejectionReason" packages/sdk/src` - `refuse` in `host.ts` is the one place that sends it.
- `rg -n "_pendingActions|_reconcile" /github/externals/vscode/src/vs/platform/agentHost/common/state` - VS Code's client reconciliation.
- `rg -n "equalsActiveClientState" /github/externals/vscode/src/vs/workbench` - VS Code's client guard before it sends a set.

### Runtime path

- A client sends `dispatchAction` with `session/activeClientSet` -> the handler compares the set with the one it holds -> an equal set returns with no answer.
- A changed set -> `held.set` -> `dispatch` to every client with `origin` -> `retool` calls `setTools` on each chat after the dispatch.
- VS Code's client applies the action at once and keeps it pending -> the echo with its `clientSeq`, or a rejection, removes it.

### Gaps

- An unchanged set leaves a pending action in a client that follows the protocol, until the client reconnects.
- VS Code's own client does not hit this, because it does not send an unchanged set.
- A set that the backend cannot take is echoed before `setTools` runs, so the host cannot refuse it without a wait.
- VS Code never refuses a set, so a refusal is ahpd's own behaviour.

## Answers

| What | Source | Task |
| --- | --- | --- |
| An echo of an unchanged set goes to its sender only, and never to the other clients | (defaulted: the idea says so, and the loop of 300 round trips was between the other clients) | 01 |
| The silence for the other clients and the test of it stay | (defaulted: `presence.test.ts:121` is the guard against the loop) | 01 |
| An unchanged set gets an echo to its sender only | Softov, 2026-10-16, chose "to the sender only" for "Echo an unchanged set?" | 01, 02 |
| The echo keeps the current `serverSeq` and does not move it | Softov, 2026-10-16, chose "the current one without moving it" for "The echo's `serverSeq`?" | 01 |
| A `setTools` that fails is only logged, as now | Softov, 2026-10-16, chose "only log it" for "A `setTools` that fails?" | 01 |
| The echo is always sent, with no capability flag | Softov, 2026-10-16, chose "always send it" for "Gate it?" | 01, 02 |
| A `chat/turnCancelled` that changes nothing gets the same echo to its sender, at the current `serverSeq` | Softov, 2026-10-16, chose "Fold into plans" | 03 |

## Proposed architecture

- **Data flow:** an unchanged set -> the handler -> an envelope with the sender's `origin` to the sender only -> the client drops its pending action.
- **Layer responsibilities:** sdk: the handler in `actions.ts` sends the echo through a helper beside `refuse` in `host.ts`. docs: `AHP.md` says when a set is echoed.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The sender hears its unchanged set](task-01-the-sender-hears-its-unchanged-set.md) | done | - |
| [02 - The docs say when a set is echoed](task-02-the-docs-say-when-a-set-is-echoed.md) | done | 01, 03 |
| [03 - An idle cancel is echoed to its sender](task-03-an-idle-cancel-is-echoed-to-its-sender.md) | done | 01 |

## Risks and tradeoffs

- An echo that does not move `serverSeq` is not buffered, so a client that reconnects does not get it again. Its replay then has no echo for that `clientSeq`.
- A backend that does not take its tools is only logged. The client then thinks the set applies, and the model keeps the old tools.

## Resume state

- **Done so far:** planned 2026-10-16. All three tasks built and reviewed 2026-10-16, merged in `c5b4e7b6`.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:**
  - Never send the echo to the other clients. The loop of 300 round trips came from that.
  - The echo is not buffered, so a client that reconnects does not get it again.
  - A cancel that names no turn still stops the running turn. Only a name that differs from the running turn gets the echo.
  - `usage-meter.test.ts`'s `metered` fake had to grow a `chatState`, because the cancel handler now reads `activeTurn` and that fake starts turns behind the backend's back.

## Final verification checklist

- [x] A test: an unchanged set gets an echo with its `clientSeq` to the sender, and the other client gets nothing.
- [x] A test: a cancel with no turn running gets an echo to its sender only.
- [x] `presence.test.ts:142` still passes: a changed set reaches every client.
- [x] The gates pass: build, typecheck, boundary, schema and vitest.
- [x] `plans/index.md` updated.
