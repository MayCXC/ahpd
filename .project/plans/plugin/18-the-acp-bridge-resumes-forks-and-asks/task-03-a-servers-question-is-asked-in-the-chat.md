---
title: A server's question is asked in the chat
status: implemented
depends: []
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/connection.ts#L162-L214](../../../../packages/agent-acp/src/connection.ts#L162-L214) - the client handlers and the capabilities the bridge advertises"
  - "[code://packages/agent-acp/src/session.ts#L806](../../../../packages/agent-acp/src/session.ts#L806) - `askPermission`, the pattern for a request the person answers"
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs](../../../../packages/agent-acp/test/fixtures/acp-server.mjs) - the scripted server"
  - "[code://packages/agent-acp/test/agent-acp-ports.test.ts](../../../../packages/agent-acp/test/agent-acp-ports.test.ts) - a real host, so a client's answer can be carried to the backend"
  - https://github.com/microsoft/agent-host-protocol/blob/main/docs/guide/elicitation.md - `chat/inputRequested`, `chat/inputAnswerChanged` and `chat/inputCompleted`, and completing an `elicitation/create` from them
---

## Objective

An `elicitation/create` from an ACP server appears to the person as an input request in the chat, and their answer, decline or cancel is what the server receives.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:162-214` - advertise `elicitation` and wire `createElicitation` and the `elicitation/complete` notification.
- `UPDATE: packages/agent-acp/src/session.ts` - the handler, beside `askPermission`.
- `UPDATE: packages/agent-acp/src/session/handlers.ts` - `askElicitation`, `heardElicitationComplete`, `answerElicitation` and `settleElicitations`, and what the session answers a `chat/inputCompleted` with.
- `UPDATE: packages/agent-acp/src/session/context.ts` - the open questions, by request id.
- `UPDATE: packages/agent-acp/src/session/opening.ts` - the two handlers the connection is given.
- `UPDATE: packages/agent-acp/src/mapping.ts` - an elicitation's form fields to the input request's questions, and the answers back.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - a form, a page and a question a stopped turn cancels, and the answers in its log.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - the cases below, which need a host to carry a client's answer.

## Steps

1. Advertise `elicitation` in the client capabilities the bridge sends at `initialize`.
2. On `elicitation/create`, emit `chat/inputRequested` with a stable request id and one question per form field, and `session/inputNeededSet` as a permission does.
3. When the chat's `chat/inputCompleted` arrives, answer the elicitation with the same `accept`, `decline` or `cancel` and the answers as its content.
4. A URL elicitation carries its `url` on the request, and `elicitation/complete` from the server completes it.
5. A turn cancelled while an elicitation is open answers it `cancel`.

## Validation

- `packages/agent-acp/test/agent-acp-ports.test.ts`: a form elicitation is answered from a client and the server receives the content; a decline and a cancel are passed through; a cancelled turn cancels the elicitation.
- `pnpm test`, `pnpm typecheck` green.

## Resume

- **The cases went into `packages/agent-acp/test/agent-acp-ports.test.ts`, not `test/agent-acp.test.ts`**, and not the catalog file task 01's Resume named: an answer is a client's `chat/inputCompleted` and needs the host to carry it, which is what that file's real `createHost` is for. The four cases are a form answered with content, a form declined, a page completed by the server, and a question a stopped turn cancels. The capability case in the same file now expects `elicitation: { form: {}, url: {} }` for both a host with every port and one with none.
- The handlers are `askElicitation`, `heardElicitationComplete`, `answerElicitation` and `settleElicitations` in `src/session/handlers.ts`, held in `ctx.elicitations` by the request id the question was raised under. `Session.answer` is `ctx.answerElicitation`, replacing the `() => false` that said ACP asks no questions. `cancel` and `close` settle every open question `cancel`, beside the permissions.
- The request id names what the question is about: a page is held under the server's own `elicitationId`, because that is the name `elicitation/complete` arrives with, a form about a tool call under `<toolCallId>:elicitation` as its permission is, and a form about nothing in particular under `elicitation:<n>`.
- Questions are built as a `Bag` rather than importing `@microsoft/agent-host-protocol` from `src/`, which `pnpm boundary` refuses: the package does not declare it.
- The one departure from step 3: a client's `cancel` and `decline` are the same answer here, because the host collapses them before the backend sees them - `chat/inputCompleted` is reduced to `accepted` by `session.answer(requestId, accepted, answers)` in `packages/sdk/src/host/chatactions.ts`. Both are sent to the server as a decline. The `cancel` a server receives is the one this bridge raises itself, when the turn is stopped or the session closed. See the plan's Resume state.
- A second departure: a form field whose `type` is not one of the shapes ACP names is asked as a text question rather than left out, since a form drawn with a field missing is one nobody can fill in.
- `setAnswer` is deliberately not implemented: `chat/inputAnswerChanged` is refused by the host with "This backend keeps no draft answers", so a half-typed answer is not synced into the session. The answers arrive whole on `chat/inputCompleted`, which is what step 3 asks for.
- The fixture grew three scripts - `elicitform`, `eliciturl`, `elicitcancel` - and its log now writes a response as the id and the result rather than nothing, so a test can read what the server was handed for a question nobody answers on a chat.
- The multi-select a form asks for keeps its choices on the field's `items`, which `choicesOf` reads; an earlier cut read only the field itself and asked an array field as text.
