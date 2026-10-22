---
title: A webhook answers the senders' handshakes
status: todo
depends: [task-04-a-webhook-checks-each-senders-proof.md]
layer: "webhook"
refs:
  - "[code://packages/webhook/src/route.ts#L58](../../../../packages/webhook/src/route.ts#L58) - the route answers every method but `POST` with 405"
  - https://api.slack.com/events/url_verification - Slack's `url_verification` call and its `challenge`
  - https://developers.facebook.com/docs/graph-api/webhooks/getting-started - Meta's `GET` with `hub.mode`, `hub.verify_token` and `hub.challenge`, and `X-Hub-Signature-256` on each event
  - https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks - Microsoft Graph's `validationToken`, and `clientState` on each notification
---

## Objective

A connector whose sender checks the URL first answers that check, and nothing fires.
Meta and Microsoft Graph become named schemes, because their handshakes need them.

## Files

- `UPDATE: packages/webhook/src/auth.ts` - the `meta` and `graph` schemes, and a handshake for `slack`, `meta` and `graph`.
- `UPDATE: packages/webhook/src/route.ts` - answer a handshake before the target, and take `GET` for `meta`.
- `UPDATE: packages/webhook/src/adapter.ts` - the values `meta` and `graph`, and the `writeOnly` field `verifyToken`.
- `UPDATE: packages/webhook/src/record.ts` - the same in `checkEndpoint`.
- `CREATE: packages/webhook/test/handshake.test.ts` - the cases below.

## Steps

1. Answer a `slack` call whose body has `type: url_verification` with its `challenge`, after its signature passes.
2. Take `GET` on a `meta` connector, and answer `hub.challenge` when `hub.verify_token` equals `verifyToken`.
3. Answer 403 to a `meta` `GET` with a wrong `hub.verify_token`.
4. Check `X-Hub-Signature-256` with `secret` on a `meta` `POST`.
5. Answer a `graph` call that has the query `validationToken` with that token, as `text/plain`.
6. Check that every `clientState` in a `graph` notification equals `secret`.
7. Require `verifyToken` for `meta` in the schema.
8. Answer `GET` with 405 on every other scheme, as today.
9. Run the webhook tests, and set this task and the plan row to `implemented`.

## Validation

- `handshake.test.ts`: a signed Slack `url_verification` call answers 200 with its challenge, and nothing fires.
- `handshake.test.ts`: a Meta `GET` with the right token answers its challenge, and a wrong token answers 403.
- `handshake.test.ts`: a Graph call with `validationToken` answers it as `text/plain` within the call.
- `handshake.test.ts`: a Graph notification with a wrong `clientState` answers 401.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** Graph sends `validationToken` with no proof, so the answer echoes it and does nothing else.
