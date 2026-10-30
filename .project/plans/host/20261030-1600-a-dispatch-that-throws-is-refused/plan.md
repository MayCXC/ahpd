---
title: A dispatch that throws is refused
domain: host
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/sdk/src/host.ts#L1764-L1775](../../../../packages/sdk/src/host.ts#L1764-L1775) - `dispatchAction` applies a dispatch at once when nothing waits, and nothing there catches a throw"
  - "[code://packages/sdk/src/host.ts#L1703-L1708](../../../../packages/sdk/src/host.ts#L1703-L1708) - `applyNow` holds the origin across the apply and lets a throw through"
  - "[code://packages/sdk/src/host.ts#L1709-L1728](../../../../packages/sdk/src/host.ts#L1709-L1728) - `behind` logs a dispatch that failed and refuses it to its sender, the pattern to copy"
  - "[code://packages/sdk/src/host.ts#L892-L927](../../../../packages/sdk/src/host.ts#L892-L927) - `refuse`, the envelope with the client's origin and a `rejectionReason`, sent to the sender alone"
  - "[code://packages/sdk/src/host.ts#L1784-L1794](../../../../packages/sdk/src/host.ts#L1784-L1794) - `handle` runs a notification's handler, so a throw there rejects `handle`"
  - "[code://packages/sdk/src/rpc.ts#L325-L343](../../../../packages/sdk/src/rpc.ts#L325-L343) - `receive` writes nothing for a notification whose handler threw, and logs nothing"
  - "[code://packages/sdk/src/rpc.ts#L169-L186](../../../../packages/sdk/src/rpc.ts#L169-L186) - the one log line in `rpc.ts`, through the bound a host sets on a peer"
  - "[code://packages/sdk/src/host/actions.ts#L583-L591](../../../../packages/sdk/src/host/actions.ts#L583-L591) - an automation write whose template says nothing of plugins, or on a host that loads none, calls the store at once"
  - "[code://packages/sdk/src/automations/automations.ts#L356-L441](../../../../packages/sdk/src/automations/automations.ts#L356-L441) - the store's checks, which refuse a write by throwing"
  - "[code://packages/sdk/src/host/actions.ts#L766-L768](../../../../packages/sdk/src/host/actions.ts#L766-L768) - `terminal/resized` calls the terminal's `resize`, which node-pty 1.1.0 refuses by throwing for a size that is not positive"
  - "[code://packages/webhook/src/plugin.ts#L41-L93](../../../../packages/webhook/src/plugin.ts#L41-L93) - a plugin's dispatcher waits for an echo or a refusal, and goes on as taken when it hears nothing"
  - "[code://packages/sdk/test/session-fixed-key.test.ts#L454-L465](../../../../packages/sdk/test/session-fixed-key.test.ts#L454-L465) - a throw in a dispatch that waited, refused to its sender"
  - "[code://packages/sdk/test/automations.test.ts#L1699-L1735](../../../../packages/sdk/test/automations.test.ts#L1699-L1735) - the store's refusal, asserted as the in-process `handle` rejecting"
  - "https://github.com/microsoft/agent-host-protocol/blob/5f16d81bb7045b66d7bc768d244feab75002d943/docs/specification/chat-channel.md#L345-L347 - invalid actions MUST be echoed back with a `rejectionReason`"
  - "https://github.com/microsoft/agent-host-protocol/blob/5f16d81bb7045b66d7bc768d244feab75002d943/docs/specification/automation-channel.md#L68-L79 - a rejected request carries `rejectionReason`, and the host MUST reject an unauthorized or invalid one"
  - "https://github.com/microsoft/agent-host-protocol/blob/5f16d81bb7045b66d7bc768d244feab75002d943/docs/guide/reconciliation.md#L29-L30 - a client removes a rejected action from its pending ones"
  - "https://github.com/microsoft/vscode/blob/4f4f516a8b9d902421d4ab01320fd2b70cb5de1d/src/vs/platform/agentHost/node/agentService.ts - `dispatchAction` logs an automation action that failed and rejects it with the error's message"
---

## Goal

A client action whose apply throws is refused to the client that sent it, with the error's message as its `rejectionReason`.
The client then lets go of a change the host never made, and the daemon's log says why.
A dispatch that fails while it waits is answered this way already, and one applied at once is answered the same.

## Reconnaissance

The files read are the `refs` in the frontmatter, each with its note.

### Runtime path

```
receive -> handle -> dispatchAction -> applyNow -> applyDispatch -> the store throws
  nothing waits: the throw leaves dispatchAction, handle rejects, and receive returns on a notification
  a dispatch waits: behind catches the throw -> a log line and refuse -> the sender's rejectionReason
```

### Gaps

- `dispatchAction` applies a dispatch at once when nothing waits on the connection, through `applyNow`, which has a `finally` and no `catch`.
- A throw there leaves `dispatchAction`, and `handle` rejects.
- A dispatch is a notification, so `receive` returns on the rejection without a frame or a log line.
- The client holds its action as pending, and nothing ever tells it the host did not apply it.
- The same throw in a dispatch that waits behind another is caught by `behind`, logged and refused to the sender with the error's message.
- So whether a client hears the refusal depends on whether another of its dispatches was waiting.
- The automation store refuses a write by throwing; its own comment says "that is how a write is refused on this host".
- An `automation/createRequested` or `automation/updateRequested` whose template says nothing of plugins calls the store at once, so the store's refusal is lost on the wire.
- A `terminal/resized` with a size that is not positive throws in node-pty 1.1.0's `resize` and is lost the same way.
- The webhook plugin's dispatcher hears nothing for 10 seconds, reports that the host did not echo, and goes on as though the action was taken.
- `automations.test.ts` asserts the store's refusal as the in-process `handle` rejecting, which a client on a socket never sees.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A dispatch whose apply throws is refused to its sender, with the error's message as the reason | the protocol's validation rule; `behind`; VS Code's `dispatchAction`, which rejects an automation action that failed with its message | 01 |
| The throw is logged and refused by the code that `behind` uses, written once for both | [code://packages/sdk/src/host.ts#L1719-L1725](../../../../packages/sdk/src/host.ts#L1719-L1725) | 01 |
| A dispatch applied at once still applies in the tick it arrived in, and a throw leaves `waiting` as it was | [code://packages/sdk/src/host.ts#L1752-L1763](../../../../packages/sdk/src/host.ts#L1752-L1763) | 01 |
| `receive` keeps returning on a notification's throw without a log line: `rpc.ts` logs only through the bound a host sets on a peer | [code://packages/sdk/src/rpc.ts#L169-L186](../../../../packages/sdk/src/rpc.ts#L169-L186) | 01 |
| A test sends the dispatch through `receive`, as a socket does, and reads the refusal off the frames the wire carried | [code://packages/sdk/src/listen.ts#L48-L51](../../../../packages/sdk/src/listen.ts#L48-L51) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host refuses a dispatch that throws](task-01-the-host-refuses-a-dispatch-that-throws.md) | todo | - |

## Risks and tradeoffs

- A throw that is a defect of the host rather than a refusal reaches the client as its reason, as it does from `behind`.
  The log line holds the same message for the operator.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-host-refuses-a-dispatch-that-throws.md](task-01-the-host-refuses-a-dispatch-that-throws.md).
- **Open questions:** none.
- **Watch out for:** a dispatch sent through the in-process `handle` shows the refusal on the test's peer.
  Only a frame sent through `receive` shows what a client on a socket hears.
