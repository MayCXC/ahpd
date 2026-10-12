---
title: A question the server withdraws is removed
status: todo
depends: []
layer: "packages/agent-acp"
refs:
  - "[code://packages/agent-acp/src/connection.ts#L236](../../../../packages/agent-acp/src/connection.ts#L236) - the handler that drops `context.signal`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L431-L468](../../../../packages/agent-acp/src/session/handlers.ts#L431-L468) - `askElicitation`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L538-L544](../../../../packages/agent-acp/src/session/handlers.ts#L538-L544) - `settleElicitations`"
  - "[code://packages/agent-acp/test/agent-acp-ports.test.ts](../../../../packages/agent-acp/test/agent-acp-ports.test.ts) - the elicitation tests"
---

## Objective

`$/cancel_request` on an open question settles it `cancel`, removes its input-needed entry, and completes the request on the chat.
A stop does the same, with `chat/inputCompleted` as well.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:236` - pass `context.signal` to the elicitation handler.
- `UPDATE: packages/agent-acp/src/session/handlers.ts:431-468` - take the signal, and settle the question on abort.
- `UPDATE: packages/agent-acp/src/session/handlers.ts:538-544` - emit `chat/inputCompleted` with `response: 'cancel'` for each question.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - a way to send `$/cancel_request` for an open elicitation.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - the cases below.

## Steps

1. Read what the host reducer does on `session/inputNeededRemoved` and on `chat/inputCompleted` for a `chatInput` request.
2. Add the signal as a second argument of the elicitation handler, and pass `context.signal` to it.
3. Answer `cancel` at once when the signal is already aborted, and put nothing on the chat.
4. On abort, do nothing if the question is no longer in `elicitations`.
5. On abort, delete the question, emit `session/inputNeededRemoved`, and emit `chat/inputCompleted` with `response: 'cancel'`.
6. Settle the question with `{ action: 'cancel' }`.
7. Emit `chat/inputCompleted` with `response: 'cancel'` for each question in `settleElicitations`.

## Validation

- The fake server sends `$/cancel_request`, and the bridge removes the entry and completes the chat request.
- A stop with an open question emits `chat/inputCompleted` with `cancel`.
- An answer, then `$/cancel_request`, emits nothing more.
- `pnpm exec vitest run packages/agent-acp` passes.

## Resume
