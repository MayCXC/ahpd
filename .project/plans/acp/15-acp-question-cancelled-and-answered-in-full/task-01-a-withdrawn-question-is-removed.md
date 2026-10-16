---
title: A question the server withdraws is removed
status: done
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

- `UPDATE: packages/agent-acp/src/types.ts` - the elicitation option's handler takes the request's own `signal`.
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

Implemented 2026-10-11, in three source files and the fixture.

The signal is the request's own, which is the SDK's. `app.onRequest` hands its callback a `context` carrying both the params and the incoming request's `AbortSignal`, and `$/cancel_request` naming that request is what aborts it - so `connection.ts` passes `context.signal` straight through as the handler's second argument, and `types.ts` declares it on `AcpConnectionOptions.elicitation`. `types.ts` is a file this task's Files line did not name; the option's handler signature is its contract, and leaving it at one argument is a type error at the call site.

`handlers.ts` is where the question is. The already-aborted case answers `{ action: 'cancel' }` before anything is computed, which is step 3 and is not only an optimisation: an abort listener added to a signal that has already aborted never fires, so a request that was given up on before the handler ran would otherwise be put on the chat and left there for ever. The live case registers the listener after both emits, so the question is on the chat when the withdrawal arrives: it deletes the entry, emits `session/inputNeededRemoved`, emits `chat/inputCompleted` with `response: 'cancel'`, settles the handler with `{ action: 'cancel' }` - which is what the SDK sends back to the server, because `registerAppRequest` responds with the handler's resolved value whether or not the request was aborted - and puts the chat back to `Thinking`. It does nothing when the entry is no longer held, which is step 4.

`settleElicitations` gained the same `chat/inputCompleted`, so a stop now completes the chat request it removes. That is step 7, and it is why the existing stop case grew an assertion rather than a case of its own.

The fixture needed a way to name a request it has to withdraw, so `ask` became `askNamed(method, params).answered` and the pair with the server's own request id is what `askNamed` returns. Two scripts were added. `elicitwithdraw` asks and withdraws a turn of the event loop later, which is a server whose own deadline passes while the person is reading - the question is drawn before it is taken back. `elicitaborted` withdraws in the same breath as the ask, so the request is over before the client's handler runs; that is the step-3 path, and without it the only case any test would touch is the live one.

Files changed, uncommitted:

- `UPDATE: packages/agent-acp/src/types.ts` - `signal?: AbortSignal` on the `elicitation` handler in `AcpConnectionOptions`.
- `UPDATE: packages/agent-acp/src/connection.ts` - `elicitation(context.params, context.signal)`.
- `UPDATE: packages/agent-acp/src/session/handlers.ts` - `askElicitation(request, signal)` with the already-aborted answer and the abort listener, and `chat/inputCompleted` in `settleElicitations`.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - `askNamed`, `withdraw`, and the `elicitwithdraw` and `elicitaborted` scripts.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - `takes a question the server withdrew off the chat, and completes the request`, `answers a withdrawal that beats the question, and draws nothing`, and the `chat/inputCompleted` assertions on the stop case.

`pnpm -s typecheck` and `pnpm -s boundary` pass. `pnpm exec vitest run packages/agent-acp` was run both ways: **243 of 243 cases pass** with the repair below applied to `packages/agent-acp/src/session/queue.ts`, and **71 of 243 fail** without it. That repair is not part of this task and was reverted; the file is as it was.

**Open question - another plan's regression blocks this plan's own validation.** `packages/agent-acp` cannot be green on this branch at all, and the cause is not in this plan. Commit `58463c78` (host/83 p3 t03) added a sixth argument to the `Session` contract - `begin(turnId, text, model?, from?, attachments?, options?: TurnOptions)` in `packages/sdk/src/types/session.ts` - and the host now passes it positionally at `packages/sdk/src/host/lifecycle.ts:1018`, `packages/sdk/src/host/tooling.ts:1096` and `packages/sdk/src/host/automations.ts:628`. `packages/agent-acp/src/session/queue.ts` already used that slot for its own `queuedMessageId`, so the turn options land in it: `openTurn` writes an object holding a function into the turn envelope, and `replayable.push({ ...envelope, action: structuredClone(action) })` at `packages/sdk/src/host.ts:638` throws `DataCloneError`. Every turn in this bridge therefore dies at `openTurn`. It is not a type error - a sixth optional parameter is invisible to a caller passing six arguments - which is why `pnpm -s typecheck` never caught it. host/83 p3's own `deferred.md` records that this bridge takes no per-turn instruction, so the repair is to take the argument and ignore it:

```diff
--- a/packages/agent-acp/src/session/queue.ts
+++ b/packages/agent-acp/src/session/queue.ts
@@
-import type { Bag, Chosen, MessageAttachment, MessageFrom, Ran, Session } from '@ahpd/sdk';
+import type { Bag, Chosen, MessageAttachment, MessageFrom, Ran, Session, TurnOptions } from '@ahpd/sdk';
@@
-  begin(turnId: string, text: string, model?: Chosen, from?: MessageFrom, attachments?: MessageAttachment[]): void;
+  begin(turnId: string, text: string, model?: Chosen, from?: MessageFrom, attachments?: MessageAttachment[], options?: TurnOptions): void;
@@
     attachments: MessageAttachment[] | undefined,
+    _options?: TurnOptions,
     queuedMessageId?: string,
@@
       Array.isArray(message.attachments) ? message.attachments as MessageAttachment[] : undefined,
+      undefined,
       String(next.id),
```

`packages/agent-pi/src/session.ts` and `packages/agent-cofold/src/session.ts` are not affected: both declare five parameters, so a sixth is dropped harmlessly. `packages/agent-claude` was updated in the same commit. The question for Softov is whose work this is: fold the four-line repair into this task, give it to host/83 p3, or plan it. It is left out here so that each task's commit is only its own files.

Two smaller notes on running the suite. `tools/ahp.strict.schema.json` is generated by `node tools/schema.mjs` and is gitignored, so three `checker()` cases in this file fail with `ENOENT` unless `pnpm -s schema` has been run first - `pnpm test` does that, `pnpm exec vitest run <path>` does not. And the `queue.ts` revert above was made by hand rather than with `git checkout -- <path>`, which this session's permission mode denies; nothing else was restored.
