---
title: A webhook talks to a bot by thread
status: implemented
depends: [task-01-the-webhook-plugin-keeps-endpoints-and-checks-the-caller.md]
layer: "packages/webhook"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L145](../../../../packages/sdk/src/types/plugin.ts#L145) - `PluginPeer`, the client connection that `connect()` gives"
  - "[code://packages/sdk/src/types/plugin.ts#L669](../../../../packages/sdk/src/types/plugin.ts#L669) - `connect()`, how the plugin creates a chat and sends a turn"
  - "[code://packages/bot/src/record.ts#L78-L79](../../../../packages/bot/src/record.ts#L78-L79) - the `session` field of a bot, read through `resourceRead` on `bot://<slug>`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1042-L1050](../../../../packages/sdk/src/host/sessionmethods.ts#L1042-L1050) - `createChat`, which needs a loaded session and a new chat URI"
  - "[code://packages/sdk/src/host/chatactions.ts#L300-L310](../../../../packages/sdk/src/host/chatactions.ts#L300-L310) - a `chat/turnStarted` wakes a sleeping session"
  - "[code://packages/push/src/plugin.ts#L179-L182](../../../../packages/push/src/plugin.ts#L179-L182) - `host.on('turn_end')`, how push hears a turn end"
  - "[code://packages/sdk/src/tools/session.ts#L176-L181](../../../../packages/sdk/src/tools/session.ts#L176-L181) - the response parts that a turn's text comes from"
  - "[code://packages/server/test/plugin-connect.test.ts](../../../../packages/server/test/plugin-connect.test.ts) - the shape of an end-to-end case over a loaded plugin"
---

## Objective

A call to a bot endpoint sends its text as a turn in one chat of the bot's session.
The next call with the same thread id continues that chat.
The endpoint's reply mode decides the answer: a callback at turn end by default, a synchronous answer, or none.

## Files

- `CREATE: packages/webhook/src/thread.ts` - the thread record in the `webhook-threads` collection, and the lookup by endpoint and thread id.
- `CREATE: packages/webhook/src/bot.ts` - the bot target: find or make the chat, send the turn, wait for its end, and reply.
- `UPDATE: packages/webhook/src/record.ts` - add `callbackPrefix` and `syncTimeoutSeconds` to the endpoint record.
- `UPDATE: packages/webhook/src/route.ts` - give the bot target its handler.
- `UPDATE: packages/webhook/src/plugin.ts` - add the `syncTimeoutSeconds` option with the default 60, open `webhook-threads`, connect once, listen to `turn_end`, and build the bot seams.
- `CREATE: packages/webhook/test/webhook-bot.test.ts` - cases for the thread map and the three reply modes, over stub seams.
- `UPDATE: packages/webhook/test/webhook-record.test.ts` - cases for `callbackPrefix` and `syncTimeoutSeconds`.
- `CREATE: packages/server/test/webhook-bot.test.ts` - one end-to-end case: a daemon loads `@ahpd/webhook` and a bot, and a call gets the turn's text back.
- `UPDATE: docs/WEBHOOKS.md` - the two call shapes, the thread, the three reply modes, the callback prefix, the timeout option, and the grants to give the plugin.

## Steps

1. Write `webhook-bot.test.ts` with the thread cases from Validation, and see it fail.
2. In `thread.ts`, keep `{ id, endpoint, thread, session, chat }`, with `id` as `t-<uuid>` because a caller's thread id need not be a slug.
3. Find a thread with `find({ endpoint, thread })`.
4. In `bot.ts`, read a body that parses as a JSON object with a string `text` as `{ thread, text, callback }`.
5. For any other body, use the raw body as the text, and read `thread` and `callback` from the query.
6. Answer 400 when the thread id or the text is missing.
7. Read the bot through `resourceRead` on the endpoint's `bot://<slug>`, and take its `session`.
8. Answer 409 when the bot has no session.
9. For a thread that has no record, subscribe to the session and call `createChat` with a new `ahp-chat:/<uuid>`.
10. Put the thread record after `createChat` answers, by the decision that keeps the thread map in the plugin's records.
11. Make two first calls of one thread wait on one another, so that they make one chat.
12. Send `chat/turnStarted` with a new turn id and the text, through `dispatchAction` on the plugin's connection.
13. Hear the turn end through `host.on('turn_end')`, matched by chat and turn id.
14. Join the `markdown` response parts of that turn as its text.
15. See the thread cases pass.
16. Add the reply cases from Validation to `webhook-bot.test.ts`, and see them fail.
17. For `reply: 'none'`, answer 202 after the plugin sends the turn.
18. For `reply: 'callback'`, answer 202 after the plugin sends the turn.
19. At turn end, POST `{ thread, turn, status, text }` to the callback URL.
20. Answer 400 when the callback URL does not start with the endpoint's `callbackPrefix`.
21. Answer 400 to a callback call when the endpoint has no `callbackPrefix`.
22. Compare the prefix with `new URL(callback).href`, so that a URL with a different host cannot pass.
23. Make the record check refuse a `callbackPrefix` that is not an `http` or `https` URL whose path ends in `/`.
24. For `reply: 'sync'`, answer 200 with `{ thread, turn, status, text }` at turn end.
25. Add the plugin option `syncTimeoutSeconds` with the default 60, in `defaults` and `optionsSchema`.
26. Add an optional endpoint field `syncTimeoutSeconds` that overrides the option for that endpoint.
27. Make the record check refuse a `syncTimeoutSeconds` that is not a positive number.
28. At that timeout, answer a `sync` call with 202 and `status: 'running'`.
29. Keep the turn running after that answer.
30. See the reply cases pass.
31. Write the end-to-end case in `packages/server/test/webhook-bot.test.ts`, and see it pass.
32. Write the bot section of `docs/WEBHOOKS.md`, with every grant the end-to-end case gives the plugin.
33. Run the gates.

## Validation

- `webhook-bot.test.ts` holds these thread cases:
  - A first call on a thread creates one chat in the bot's session and keeps one thread record.
  - A second call on the same thread sends its turn in the same chat and creates no chat.
  - A call on another thread creates another chat.
  - Two first calls on one thread at the same time create one chat.
  - A JSON body `{ thread, text, callback }` sends `text` in the chat of `thread`.
  - A plain text body sends the body as the text, in the chat of the `thread` query value.
  - A JSON body with no string `text` is the whole text, and the query gives the thread.
  - A call with no thread id, or with no text, answers 400.
  - A bot with no session answers 409.
- `webhook-bot.test.ts` holds these reply cases:
  - With `reply: 'none'`, the call answers 202 and posts nothing.
  - With `reply: 'callback'`, the call answers 202, and the turn end posts the turn's text to the callback URL.
  - A callback URL outside the endpoint's prefix answers 400 and sends no turn.
  - A callback URL on another host with the same leading text answers 400.
  - With `reply: 'sync'`, the call answers 200 with the turn's text.
  - With `reply: 'sync'`, a turn that outlives the timeout answers 202 with `status: 'running'`, and the turn is not cancelled.
  - An endpoint with no `syncTimeoutSeconds` waits for the plugin option, and the option defaults to 60.
  - An endpoint `syncTimeoutSeconds` overrides the plugin option.
- `webhook-record.test.ts` refuses a `callbackPrefix` that is not an `http` or `https` URL.
- `webhook-record.test.ts` refuses a `callbackPrefix` whose path does not end in `/`.
- `webhook-record.test.ts` refuses a `syncTimeoutSeconds` of 0, of a negative number, and of a string.
- `packages/server/test/webhook-bot.test.ts` loads the plugin on a daemon with a bot and a backend.
  A `sync` call in that test gets the turn's text back.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/webhook packages/server/test/webhook-bot.test.ts` passes.

## Resume

Built in `packages/webhook/src/bot.ts` and `thread.ts`, with the bot seams over the plugin's connection in `plugin.ts`. `record.ts` checks `callbackPrefix` and `syncTimeoutSeconds`. `packages/webhook/test/webhook-bot.test.ts` holds 20 cases, `webhook-record.test.ts` gained 4, and `packages/server/test/webhook-bot.test.ts` holds 2.

How the parts work:

- `botTarget(seams)` takes the seams `threads`, `session`, `chat`, `send`, `ended`, `post`, `syncTimeoutSeconds` and `problem`, so the unit cases stub the host.
- The lookups of one thread run one after another, so two first calls make one chat.
- The wait for a turn's end is made before the turn is sent, and `turnEnds()` matches each `turn_end` by chat and turn id.
- At the turn's end, the plugin subscribes to the chat and joins the turn's `markdown` parts from the snapshot.
- The end-to-end case runs with a users directory. It needs exactly `bot:get`, `session:read` and `session:write`, and `docs/WEBHOOKS.md` lists them.

Where the build departs from the plan:

- A thread record whose session is not the bot's current session gets a new chat, and the record keeps its id. The plan did not say what happens when a bot is linked to a new session.
- When the plugin may not read the bot, the call answers 409 and the plugin reports the problem. The plan named 409 only for a bot with no session.
- A `callback` call with no callback URL answers 400, as a URL outside the prefix does.
- The 202 answer of `callback` and `none` carries `{ thread, turn }`.

Open questions for Softov:

- A turn that ends in `chat/error` raises no `turn_end`. A `sync` call then waits to its timeout and answers 202 `running`, and a callback is never posted. Should the plugin also hear a turn that failed?
- When the plugin lacks `session:write`, `createChat` throws and the call answers 500. Should that be 409, like a bot the plugin may not read?

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/webhook packages/sdk packages/server` passes 3898 of 3899 tests. The one failure is `packages/sdk/test/nested-start.test.ts`, the same 5 s timeout under load as in task 01.
