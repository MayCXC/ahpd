---
title: A webhook checks each sender's proof
status: todo
depends: [task-03-a-webhook-reads-any-body.md]
layer: "webhook"
refs:
  - "[code://packages/webhook/src/route.ts#L29-L78](../../../../packages/webhook/src/route.ts#L29-L78) - `bearerOf` and `same`, the bearer check and the constant-time compare"
  - "[code://packages/webhook/src/adapter.ts#L27-L126](../../../../packages/webhook/src/adapter.ts#L27-L126) - the adapter's schema"
  - https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries - `X-Hub-Signature-256: sha256=<hex>` over the body
  - https://docs.stripe.com/webhooks#verify-manually - `Stripe-Signature: t=<unix>,v1=<hex>` over `<t>.<body>`
  - https://api.slack.com/authentication/verifying-requests-from-slack - `X-Slack-Signature: v0=<hex>` over `v0:<ts>:<body>`
  - https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md - `webhook-signature: v1,<base64>` over `<id>.<ts>.<body>`, with a `whsec_` key
---

## Objective

Each connector names its auth scheme in `auth`, and the route checks the call's proof by that scheme.
A call without a valid proof answers 401, and nothing fires.

## Files

- `CREATE: packages/webhook/src/auth.ts` - one check for each scheme.
- `UPDATE: packages/webhook/src/route.ts:29-78` - call the connector's check in place of the bearer check.
- `UPDATE: packages/webhook/src/adapter.ts` - `auth`, `header`, `algorithm`, `encoding` and `prefix`.
- `UPDATE: packages/webhook/src/record.ts` - the same fields in `checkEndpoint`.
- `CREATE: packages/webhook/test/auth.test.ts` - the cases below.

## Steps

1. Add `auth` to the schema with the values `bearer`, `header`, `query`, `hmac`, `github`, `stripe`, `slack` and `standard`.
2. Make `bearer` the default, which checks `Authorization: Bearer <secret>` as today.
3. Check the header the connector names in `header` against `secret` for `header`.
4. Check the query parameter `token` against `secret` for `query`.
5. Compute an HMAC of the raw body for `hmac` with `algorithm`, `encoding` and the optional `prefix`.
6. Compare the `hmac` result with the value in the header that `header` names.
7. Check `X-Hub-Signature-256` for `github`.
8. Check the `v1` values of `Stripe-Signature` for `stripe`, and ignore every other scheme in it.
9. Check `X-Slack-Signature` and `X-Slack-Request-Timestamp` for `slack`.
10. Check `webhook-id`, `webhook-timestamp` and `webhook-signature` for `standard`, with the key after `whsec_` decoded from base64.
11. Refuse a timestamped call more than 300 seconds from the host's clock.
12. Compare every value in constant time.
13. Require `header` for `header` and `hmac`, and `algorithm` and `encoding` for `hmac`, in the schema.
14. Run the webhook tests, and set this task and the plan row to `implemented`.

## Validation

- `auth.test.ts`: each scheme passes a call signed as its sender's docs show.
- `auth.test.ts`: each scheme passes the docs' own example where one exists.
- `auth.test.ts`: each scheme answers 401 to a wrong signature, a missing header and a changed body byte.
- `auth.test.ts`: a Stripe, Slack or Standard Webhooks call 301 seconds old answers 401.
- `auth.test.ts`: `header` with `X-Gitlab-Token` passes a GitLab call.
- `auth.test.ts`: `hmac` with `X-Shopify-Hmac-Sha256`, `sha256` and `base64` passes a Shopify call.
- `auth.test.ts`: a stored connector with no `auth` still takes a bearer token.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a signature is over the raw bytes, never over the parsed body.
  Use `node:crypto` only; the plugin takes no new dependency.
