---
title: A client action always gets an answer
created: 2026-10-30
refs:
  - git://ea86d32c - the commit of ahpd the facts were checked at
  - git://2f3ff9eb - the commit that refuses a confirmation or an answer nothing waits on, the pattern to copy
  - "[code://packages/sdk/src/host/chatactions.ts#L1393-L1397](../../packages/sdk/src/host/chatactions.ts#L1393-L1397) - `chat/pendingMessageRemoved` calls `unqueue` and says nothing for an unknown id"
  - "[code://packages/sdk/src/host/chatactions.ts#L1403-L1415](../../packages/sdk/src/host/chatactions.ts#L1403-L1415) - `chat/toolCallConfirmed` is refused when `confirm` returns `false`"
  - "[code://packages/sdk/src/host/chatactions.ts#L1417-L1448](../../packages/sdk/src/host/chatactions.ts#L1417-L1448) - `chat/inputCompleted` is refused when `answer` returns `false`"
  - "[code://packages/sdk/src/host/chatactions.ts#L32-L41](../../packages/sdk/src/host/chatactions.ts#L32-L41) - `sessionFlag` returns `false` and dispatches nothing when the flag is already set"
  - "[code://packages/sdk/src/host/chatactions.ts#L91-L101](../../packages/sdk/src/host/chatactions.ts#L91-L101) - `chatFlag` has the same guard"
  - "[code://packages/sdk/src/host/chatactions.ts#L235-L241](../../packages/sdk/src/host/chatactions.ts#L235-L241) - the chat flag caller returns with no answer when the bit did not move"
  - "[code://packages/sdk/src/host/actions.ts#L739-L750](../../packages/sdk/src/host/actions.ts#L739-L750) - the caller of `sessionFlag`, which ignores its result"
  - "[code://packages/sdk/src/host/actions.ts#L708-L724](../../packages/sdk/src/host/actions.ts#L708-L724) - an `activeClient` that changed nothing is answered to its sender only with `echoTo`, the pattern to copy"
  - "[code://packages/sdk/src/host/actions.ts#L755-L765](../../packages/sdk/src/host/actions.ts#L755-L765) - `terminal/input` is side-effect only and not echoed"
  - "[code://packages/sdk/src/types/session.ts#L631](../../packages/sdk/src/types/session.ts#L631) - `Session.unqueue` returns `void`"
  - "[code://packages/sdk/src/types/session.ts#L653](../../packages/sdk/src/types/session.ts#L653) - `Session.confirm` returns whether it took the confirmation"
  - "[code://packages/agent-claude/src/session/turns.ts#L714-L720](../../packages/agent-claude/src/session/turns.ts#L714-L720) - the claude backend's `unqueue` looks only at its queued messages"
  - "[code://packages/sdk/src/sessions/nested.ts#L1232-L1234](../../packages/sdk/src/sessions/nested.ts#L1232-L1234) - the nested session's `unqueue` sends the removal on to the inner host and cannot tell whether the id is there"
  - "[code://packages/sdk/src/host/sleep.ts#L106](../../packages/sdk/src/host/sleep.ts#L106) - the host already reads `queuedMessages` from a chat's state"
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/specification/chat-channel.md - *Server Validation of Client Actions* and *Shared List Mutations and Ordering*, checked at 2c37a04f
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/specification/terminal-channel.md - `terminal/input` is side-effect only
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/guide/reconciliation.md - a client holds its own action as pending until the echo or the rejection comes
  - https://github.com/microsoft/vscode/blob/4f4f516a8b9/src/vs/platform/agentHost/node/agentHostStateManager.ts - `dispatchClientAction` and `rejectClientAction`, checked at 4f4f516a8b9
  - file:///github/ahpc/.project/plans/cli/20261030-0802-a-dispatch-waits-for-the-hosts-answer/plan.md - the ahpc plan that waits for this answer
---

# A client action always gets an answer

ahpd answers every action a client sends on a channel it has.
The answer is an echo when it applies the action, or a `rejectionReason` when it does not.
A command in ahpc now waits for that answer and exits with it.
Today an unknown queued message and a flag already set get no answer at all.
ahpc then waits 10 seconds and exits 0, so a typo reads as success.

## What others do

- The protocol, at 2c37a04f, rejects `chat/toolCallConfirmed` for a call not waiting on a confirmation with a MUST.
- It rejects `chat/pendingMessageRemoved` with a SHOULD when no pending message has the id and the effective kind. An absent kind means `queued`.
- It says a host MUST reject a client removal that it can no longer honor after handoff.
- It allows silence in two cases only: a channel the server does not have, and `terminal/input`, which is side-effect only.
- The reconciliation guide holds a client's own action as pending until its echo or its rejection arrives.
- VS Code, at 4f4f516a8b9, sends each accepted client action through `dispatchClientAction`, which applies it and emits it with the client's origin.
- VS Code refuses one through `rejectClientAction`, which emits the envelope with the origin and a `rejectionReason`.

## What ahpd has today

| Action | Condition | ahpd today | Spec |
| --- | --- | --- | --- |
| `chat/toolCallConfirmed` | no call waits under the id | refused, by 2f3ff9eb | MUST reject |
| `chat/inputCompleted` | no question waits under the id | refused, by 2f3ff9eb | SHOULD reject |
| `chat/pendingMessageRemoved` | no pending message has the id and kind | silent | SHOULD reject |
| `session/isReadChanged`, `session/isArchivedChanged` | the flag already has the value | silent | not covered |
| `chat/isReadChanged`, `chat/isArchivedChanged` | the flag already has the value | silent | not covered |
| `chat/turnCancelled` | no active turn | refused | MUST reject |
| `terminal/input` | any | silent | side-effect only |

- 2f3ff9eb made `Session.confirm` return a boolean, as `answer` does, and changed every backend to match.
- `Session.unqueue` still returns `void`, and it takes the id only, not the kind.
- The claude backend's `unqueue` looks only at its queued messages, so a steering removal there finds nothing.
- The nested session's `unqueue` sends the removal on to the inner host and does not know whether the id is there.
- The host can read a chat's `queuedMessages` itself, as `sleep.ts` does.
- `sessionFlag` and `chatFlag` dispatch nothing when the flag does not change, and their callers do not answer the sender.
- An `activeClient` that changes nothing is answered to its sender only, with `echoTo`. A flag can use the same answer.
- Eight implement `unqueue`: agent-claude, agent-acp, agent-cofold, agent-pi, bot, the nested session, and the echo and notes examples.

## Who writes

- No open PR changes `chatactions.ts`, `host/actions.ts` or `types/session.ts` at ea86d32c.
- PR #143, which changed `chatactions.ts` and `types/session.ts`, merged as 885ca71d.

## The change

- `chat/pendingMessageRemoved` for an id and kind that no pending message has is refused, with the id in the reason.
- A session flag set to the value it already has is answered to its sender with `echoTo`, as `activeClient` is.
- A chat flag set to the value it already has is answered the same way.
- `terminal/input` stays silent, as the spec says.
- An action on a channel ahpd does not have stays silent, as the spec says.

## Open points

- Where the host learns that a pending message is unknown. One way is `Session.unqueue` returning whether it took the id, as `confirm` does since 2f3ff9eb. That changes eight implementers, and the nested session cannot answer it.
- The other way is the host reading the chat's `queuedMessages` for the id and the kind before it calls the backend. That changes only `chatactions.ts`, and it checks the kind as the spec says.
- Not checked: whether a backend can say that the agent already has a queued message. The spec refuses a removal after that handoff.
