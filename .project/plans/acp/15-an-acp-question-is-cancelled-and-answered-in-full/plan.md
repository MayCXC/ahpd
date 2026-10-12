---
title: An ACP question is cancelled and answered in full
domain: acp
status: planned
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
refs:
  - "[code://packages/agent-acp/src/connection.ts#L236](../../../../packages/agent-acp/src/connection.ts#L236) - `elicitation/create`, which drops `context.signal`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L431-L468](../../../../packages/agent-acp/src/session/handlers.ts#L431-L468) - `askElicitation`, which puts a question on the chat"
  - "[code://packages/agent-acp/src/session/handlers.ts#L538-L544](../../../../packages/agent-acp/src/session/handlers.ts#L538-L544) - `settleElicitations`, which removes the entry and emits no `chat/inputCompleted`"
  - "[code://packages/agent-acp/src/mapping.ts#L591](../../../../packages/agent-acp/src/mapping.ts#L591) - `questionOf`, one form field as a question"
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs](../../../../packages/agent-acp/test/fixtures/acp-server.mjs) - the fake ACP server"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/codex/codexUserInputMapper.ts - VS Code sets `allowFreeformInput` from Codex's `isOther`
---

## Goal

A question that an ACP server withdraws leaves every client's screen, and the chat says how it ended.
A question that the server marks as open to other answers lets a person type one.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "inputCompleted" packages/agent-acp/src` - only an accepted URL question emits it.
- `rg "isOther" /github/externals/vscode/src` - VS Code reads it from Codex's own app server, not from ACP.

### Runtime path

```
elicitation/create -> askElicitation -> chat/inputRequested + session/inputNeededSet
  -> an answer, a stop or $/cancel_request -> session/inputNeededRemoved + chat/inputCompleted -> the server's request is answered
```

### Gaps

- `$/cancel_request` from the server leaves the question open on every client.
- A question that the bridge cancels on a stop gets no `chat/inputCompleted`.
- A question cannot allow free-form input.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| Free-form input from `_meta.codex.isOther` is in this plan | Softov, 2026-10-11, to "Should the ACP plan also read Codex's free-form flag?" - "Include it" | 02 |
| A question stays on the chat, not on the turn | [`code://packages/agent-acp/src/session/handlers.ts#L457-L460`](../../../../packages/agent-acp/src/session/handlers.ts#L457-L460) | 01 |

## Proposed architecture

- **Event flow** - an abort settles `cancel`, removes the entry and completes the request, as a stop does.
- **Layer responsibilities** - `packages/agent-acp`: the signal, the settle and the field; the host is not changed.
- **Source-of-truth files** - [`code://packages/agent-acp/src/session/handlers.ts`](../../../../packages/agent-acp/src/session/handlers.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A question the server withdraws is removed](task-01-a-withdrawn-question-is-removed.md) | todo | - |
| [02 - A question can take a typed answer](task-02-a-question-can-take-a-typed-answer.md) | todo | - |

## Risks and tradeoffs

- Codex's ACP adapter may not send `_meta.codex.isOther` - task 02 checks first, and is dropped if it does not.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-withdrawn-question-is-removed.md](task-01-a-withdrawn-question-is-removed.md).
- **Open questions:** none.
- **Watch out for:** a `chat/inputCompleted` for a request the reducer has already removed must be harmless.

## Final verification checklist

- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/agent-acp` pass.
- [ ] `plans/index.md` updated.
