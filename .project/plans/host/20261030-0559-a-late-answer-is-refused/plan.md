---
title: An answer or a confirmation nothing waits on is refused
domain: host
status: built
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1423-L1470](../../../../packages/sdk/src/host/chatactions.ts#L1423-L1470) - `chat/toolCallConfirmed` and `chat/inputCompleted`, handed to the session"
  - "[code://packages/sdk/src/types/session.ts#L638-L649](../../../../packages/sdk/src/types/session.ts#L638-L649) - `confirm`, which said nothing of whether a call was waiting"
  - "[code://packages/sdk/src/types/session.ts#L700-L715](../../../../packages/sdk/src/types/session.ts#L700-L715) - `answer`, false for a request nothing waits on"
  - "[https://github.com/microsoft/agent-host-protocol/blob/main/docs/specification/chat-channel.md#server-validation-of-client-actions](https://github.com/microsoft/agent-host-protocol/blob/main/docs/specification/chat-channel.md#server-validation-of-client-actions) - the protocol's table: a confirmation of a call not in `pending-confirmation` MUST be rejected, an answer to no waiting request SHOULD be"
---

## Goal

A client's `chat/toolCallConfirmed` for a call that waits on no confirmation, and its
`chat/inputCompleted` for a request nothing waits on, are refused with a reason, so the client lets
go of an action the host never applied.

## Reconnaissance

The files read are the `refs` in the frontmatter, each with its note.

### Gaps

- `chat/inputCompleted` breaks when `answer` is false, neither echoed nor refused, under a comment
  that reads the protocol as having nothing to say back. The protocol's validation table says the
  host SHOULD reject it.
- `chat/toolCallConfirmed` calls `confirm`, which answers nothing, so the host cannot tell a
  confirmation of a waiting call from one of a call that waits on none, and says nothing either way.
  The table says the host MUST reject the second.
- A client that keeps its own actions until the host echoes or rejects them, and sends the unechoed
  ones again after a reconnect, as VS Code's protocol client does, sends such an action again on every
  reconnect, since nothing ever answers it.
- `setAnswer` and `completeToolCall` already answer false for a request or a call nothing waits on,
  and the host refuses those: "a client out of step rather than a no-op".

## Answers

| What | Source | Task |
| --- | --- | --- |
| `confirm` answers whether a call was waiting on a confirmation, as `answer` and `completeToolCall` do | `answer`, `completeToolCall` | 01 |
| Each backend's `confirm` answers false where it returned without acting | each backend's own lookup | 01 |
| The host refuses a confirmation or an answer nothing waits on | the protocol's table; `no` as the other refusals use it | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host refuses a confirmation or an answer nothing waits on](task-01-the-host-refuses-a-confirmation-or-an-answer-nothing-waits-on.md) | done | - |

## Risks and tradeoffs

- An answer to a request nothing waits on was a no-op said to nobody; it is now refused to its
  sender. A client that relied on silence sees a refusal of an action that changed nothing, which is
  what the protocol's table has it see.

## Resume state

- **Done so far:** planned and built 2026-10-30. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the protocol's conformance cases that drive such an action through the host, which were no-ops and are refusals.

## Final verification checklist

- [x] A confirmation of a call that waits on none is refused to its sender.
- [x] An answer to a request nothing waits on is refused to its sender, and said to nobody else.
- [x] Every backend's `confirm` answers whether it took the confirmation.
