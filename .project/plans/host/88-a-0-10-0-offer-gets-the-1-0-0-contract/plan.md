---
title: A 0.10.0 offer gets the 1.0.0 contract
domain: host
status: active
priority: high
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L134-L153](../../../../packages/sdk/src/host/handshake.ts#L134-L153) - `initialize`, which negotiates with `negotiateProtocolVersion` and refuses with `SUPPORTED_PROTOCOL_VERSIONS`"
  - "[code://packages/sdk/src/host/handshake.ts#L205-L207](../../../../packages/sdk/src/host/handshake.ts#L205-L207) - the log line and the `protocolVersion` answer"
  - "[code://packages/sdk/src/host.ts#L533-L570](../../../../packages/sdk/src/host.ts#L533-L570) - `seenBy`, the one place an envelope is rewritten for a connection"
  - "[code://packages/sdk/test/host-handshake.test.ts#L14-L40](../../../../packages/sdk/test/host-handshake.test.ts#L14-L40) - the negotiation tests to extend"
  - "[code://packages/sdk/test/conformance.test.ts#L436-L460](../../../../packages/sdk/test/conformance.test.ts#L436-L460) - the one place ahpd uses `isActionKnownToVersion` today"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - `SUPPORTED_PROTOCOL_VERSIONS` is `1.0.0` and `0.9.0`; for `0.x` the minor must match, so `0.10.0` is not accepted"
  - "git://github.com/microsoft/vscode@51ec2ee42fd - `agentHostProtocolCompatibility.ts` maps an offer of `0.10.0` to the 1.0.0 contract (main, not in 1.141.1)"
  - "git://github.com/microsoft/vscode@0c9eb8e027b - `baseAgentHostSessionsProvider.ts` uses per-chat read state only when the answer knows `chat/isReadChanged` at `0.10.0`"
  - "git://github.com/microsoft/vscode@35787c9cb26 - upstream registers `chat/isReadChanged` and the canvas actions at `0.10.0`"
---

## Goal

A VS Code 1.141 window that offers `0.10.0` gets `0.10.0` back, and it uses per-chat read state.
Today ahpd answers `0.9.0`, and the window keeps one read bit for the whole session.
No canvas action reaches the window after the change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "negotiateProtocolVersion|SUPPORTED_PROTOCOL_VERSIONS" packages/*/src` - `handshake.ts` negotiates. `nested.ts` offers the list as a client, so a nested host does not change.
- `rg -i canvas packages/*/src` - only `canvasesEnabled` in `vscoderootconfig.ts`. ahpd sends no canvas action.
- `rg isActionKnownToVersion packages` - only the conformance test.

### Runtime path

```
1.141 window initialize ['0.10.0','0.9.0'] -> handshake.ts negotiateProtocolVersion -> '0.9.0' -> window: no chat/isReadChanged at 0.9.0 in its registry -> legacy session read bit
```

### Gaps

- `negotiateProtocolVersion` accepts `0.x` only on the same minor, so `0.10.0` never matches `0.9.0` or `1.0.0`.
- The `-32005` refusal lists `1.0.0` and `0.9.0`. Upstream main also lists `0.10.0`.
- `isActionKnownToVersion` cannot gate canvas for this client. The 1.0.0 package registers the canvas actions at `0.10.0`, so they are known to a `0.10.0` client.

## Answers

| What | Source | Task |
| --- | --- | --- |
| An offer that holds `0.10.0` and agrees on nothing above it gets `0.10.0`, with the 1.0.0 wire | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 51ec2ee42fd) | 01 |
| An offer that holds `1.0.0` still gets `1.0.0`, and a malformed entry is still `-32602` | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 51ec2ee42fd) | 01 |
| The `-32005` refusal lists `1.0.0`, `0.10.0` and `0.9.0` | Softov, 2026-10-14, chose "Record and plan" for Pass 6 (defaulted: upstream 51ec2ee42fd) | 01 |
| The version table of the protocol package runs against the package's `negotiateProtocolVersion`, as VS Code does; the host answers each row that does not offer `0.10.0` the same way, and its refusal lists `1.0.0`, `0.10.0` and `0.9.0` | Softov, 2026-10-14, to "Accepting 0.10.0 breaks three rows of the protocol package's version table, which our test runs against ahpd's handshake. How should that test change?" - "Do what VS Code does" | 01 |
| No canvas action reaches a client that agreed on `0.10.0` | Softov, 2026-10-14, chose "Record and plan" for Pass 6 | 01 |
| The host sends no canvas action, a test proves it, and `seenBy` gets no filter | Softov, 2026-10-14, "How does canvas stay off the wire for a `0.10.0` client?" (defaulted: proposed, ahpd has no canvas sender) | 01 |

## Proposed architecture

- **Data flow** - `initialize` runs the package negotiation first. When the offer holds `0.10.0` and the result is below it or empty, the answer is `0.10.0`.
- **Event flow** - nothing new. The connection gets the same actions as a `1.0.0` connection.
- **State flow** - none. The agreed version is not kept on the `Connection`.
- **Layer responsibilities** - sdk: the negotiation, the refusal list and the tests.
- **Source-of-truth files** - [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A 0.10.0 offer is answered with 0.10.0](task-01-a-0-10-0-offer-is-answered-with-0-10-0.md) | implemented | - |

## Risks and tradeoffs

- The alias says the 1.141 window reads the 1.0.0 wire. Upstream main makes the same claim, and the 1.141.1 registry differs from 1.0.0 only in the `chat/isReadChanged` version.
- A window that agrees on `0.10.0` sends per-chat read actions. ahpd already handles `chat/isReadChanged` (`chatactions.ts` L119-159).
- The canvas guard is a test of a silence. A later plan that adds canvas must decide the gate for real.

## Resume state

- **Done so far:** the plan, 2026-10-14; task 01 implemented, 2026-10-14.
- **Next action:** Softov reviews [task-01-a-0-10-0-offer-is-answered-with-0-10-0.md](task-01-a-0-10-0-offer-is-answered-with-0-10-0.md).
- **Open questions:** none.
- **Watch out for:** `isActionKnownToVersion` answers true for canvas at `0.10.0`. Do not use it as the canvas gate.

## Final verification checklist

- [ ] A test: an offer of `0.10.0` and `0.9.0` gets `0.10.0`.
- [ ] A test: an offer of `1.0.0` and `0.10.0` gets `1.0.0`.
- [ ] A test: the refusal lists `1.0.0`, `0.10.0` and `0.9.0`.
- [ ] A test: a `0.10.0` client gets no canvas action.
- [ ] The gates pass: typecheck, boundary, schema and vitest.
- [ ] `plans/index.md` updated.
