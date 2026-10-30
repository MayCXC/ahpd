---
title: A client action always gets an answer
created: 2026-10-30
refs:
  - git://8b2f963e - the commit of ahpd the facts were checked at
  - "[code://packages/sdk/src/host/chatactions.ts#L1413-L1429](../../packages/sdk/src/host/chatactions.ts#L1413-L1429) - `chat/pendingMessageRemoved` and `chat/toolCallConfirmed` call the session and say nothing for an unknown id"
  - "[code://packages/sdk/src/host/chatactions.ts#L1450-L1456](../../packages/sdk/src/host/chatactions.ts#L1450-L1456) - `chat/inputCompleted` for an unknown request is a no-op, and the comment says the protocol has it so"
  - "[code://packages/sdk/src/host/chatactions.ts#L1145-L1150](../../packages/sdk/src/host/chatactions.ts#L1145-L1150) - `chat/turnCancelled` with no active turn is refused, the pattern to copy"
  - "[code://packages/sdk/src/host/chatactions.ts#L33-L42](../../packages/sdk/src/host/chatactions.ts#L33-L42) - `sessionFlag` returns `false` and dispatches nothing when the flag is already set"
  - "[code://packages/sdk/src/host/actions.ts#L739-L751](../../packages/sdk/src/host/actions.ts#L739-L751) - the caller of `sessionFlag`, which ignores its result"
  - "[code://packages/sdk/src/host/actions.ts#L708-L724](../../packages/sdk/src/host/actions.ts#L708-L724) - an `activeClient` that changed nothing is answered to its sender only with `echoTo`, the pattern to copy"
  - "[code://packages/sdk/src/host/actions.ts#L755-L765](../../packages/sdk/src/host/actions.ts#L755-L765) - `terminal/input` is side-effect only and not echoed"
  - "[code://packages/sdk/src/types/session.ts#L627](../../packages/sdk/src/types/session.ts#L627) - `Session.unqueue` returns `void`"
  - "[code://packages/sdk/src/types/session.ts#L645](../../packages/sdk/src/types/session.ts#L645) - `Session.confirm` returns `void`"
  - "[code://packages/sdk/src/types/session.ts#L711](../../packages/sdk/src/types/session.ts#L711) - `Session.answer` returns whether it took the answer"
  - "[code://packages/agent-claude/src/session/turns.ts#L714-L720](../../packages/agent-claude/src/session/turns.ts#L714-L720) - the claude backend's `unqueue` returns when the id is not queued"
  - "[code://packages/agent-claude/src/session/asking.ts#L638-L646](../../packages/agent-claude/src/session/asking.ts#L638-L646) - the claude backend's `confirm` returns when no call waits under the id"
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/specification/chat-channel.md - *Server Validation of Client Actions*, checked at 2c37a04f
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/specification/terminal-channel.md - `terminal/input` is side-effect only
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/guide/reconciliation.md - a client holds its own action as pending until the echo or the rejection comes
  - https://github.com/microsoft/vscode/blob/4f4f516a8b9/src/vs/platform/agentHost/node/agentHostStateManager.ts - `dispatchClientAction` and `rejectClientAction`, checked at 4f4f516a8b9
  - file:///github/ahpc/.project/plans/cli/20261030-0802-a-dispatch-waits-for-the-hosts-answer/plan.md - the ahpc plan that waits for this answer
---

# A client action always gets an answer

ahpd answers every action a client sends on a channel it has.
The answer is an echo when it applies the action, or a `rejectionReason` when it does not.
A command in ahpc now waits for that answer and exits with it.
Today an unknown tool call, an unknown queued message, an unknown question and a flag already set get no answer at all.
ahpc then waits 10 seconds and exits 0, so a typo reads as success.

## What others do

- The protocol, at 2c37a04f, rejects `chat/toolCallConfirmed` for a call not waiting on a confirmation with a MUST.
- It rejects `chat/pendingMessageRemoved` for an unknown id and `chat/inputCompleted` for an unknown request with a SHOULD.
- It allows silence in two cases only: a channel the server does not have, and `terminal/input`, which is side-effect only.
- The reconciliation guide holds a client's own action as pending until its echo or its rejection arrives.
- VS Code, at 4f4f516a8b9, sends each accepted client action through `dispatchClientAction`, which applies it and emits it with the client's origin.
- VS Code refuses one through `rejectClientAction`, which emits the envelope with the origin and a `rejectionReason`.

## What ahpd has today

| Action | Condition | ahpd today | Spec |
| --- | --- | --- | --- |
| `chat/toolCallConfirmed` | no call waits under the id | silent | MUST reject |
| `chat/pendingMessageRemoved` | no queued message has the id | silent | SHOULD reject |
| `chat/inputCompleted` | no question waits under the id | silent | SHOULD reject |
| `session/isReadChanged`, `session/isArchivedChanged` | the flag already has the value | silent | not covered |
| `chat/turnCancelled` | no active turn | refused | MUST reject |
| `terminal/input` | any | silent | side-effect only |

- `Session.unqueue` and `Session.confirm` return `void`, so the host cannot tell whether the backend took the id.
- `Session.answer` returns a boolean, and the host already reads it, but it treats `false` as a no-op.
- The comment on `chat/inputCompleted` says the protocol makes an unknown request a no-op; the spec table says the server SHOULD reject it.
- `sessionFlag` dispatches nothing when the flag does not change, and its caller does not answer the sender.
- An `activeClient` that changes nothing is answered to its sender only, with `echoTo`; a flag can use the same answer.
- Six backends implement `unqueue` and `confirm`: agent-claude, agent-acp, agent-cofold, agent-pi, bot and the nested session.

## Who writes

- `plugin/56-a-steered-bot-message-is-its-own-turn` (PR #143, open) changes `chatactions.ts` at line 1185 and `types/session.ts`. Those lines are in `chat/pendingMessageSet` and do not overlap this change.
  The two files are the same, so this change waits for #143 or rebases on it.
- The worktrees `build-agents-b003dc25` and `build-agents-fda88f4a` do not change these files.
- `maycxc/main` does not change these files.

## The change

- `chat/toolCallConfirmed` for a call that does not wait on a confirmation is refused, with the call id in the reason.
- `chat/pendingMessageRemoved` for an id that is not queued is refused.
- `chat/inputCompleted` for a request the chat does not wait on is refused, and the comment that calls it a no-op goes.
- A session flag set to the value it already has is answered to its sender with `echoTo`, as `activeClient` is.
- `terminal/input` stays silent, as the spec says.
- An action on a channel ahpd does not have stays silent, as the spec says.

## Open points

- Where the host learns that an id is unknown. One way is `Session.unqueue` and `Session.confirm` returning whether they took it, as `answer` does, which changes six backends. The other is the host reading the chat state before it calls the backend, which changes only `chatactions.ts`.
- Whether VS Code rejects an unknown tool call or queued message was not checked; only its general accept and reject paths were read.
