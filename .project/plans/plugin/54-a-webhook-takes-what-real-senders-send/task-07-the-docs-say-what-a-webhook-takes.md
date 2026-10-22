---
title: The docs say what a webhook takes
status: todo
depends: [task-04-a-webhook-checks-each-senders-proof.md, task-05-a-webhook-answers-handshakes.md, task-06-a-bot-connector-works-by-default.md]
layer: "docs"
refs:
  - "[code://docs/plugins/WEBHOOKS.md](../../../../docs/plugins/WEBHOOKS.md) - the endpoint, the call and the answers"
  - "[code://packages/webhook/README.md#L35-L51](../../../../packages/webhook/README.md#L35-L51) - the old `webhooks/ci.md` format"
  - "[code://docs/sdk/AUTOMATIONS.md](../../../../docs/sdk/AUTOMATIONS.md) - what a plugin trigger is, and when a save is refused"
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - `fireTrigger`, and the place for `runAutomation` and the schema references"
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - the unreleased section"
---

## Objective

A person sets up a webhook for a real sender from the docs alone.
The README and the docs page agree.

## Files

- `UPDATE: docs/plugins/WEBHOOKS.md` - the targets, each scheme, the handshakes, the bodies, `match` and the event data.
- `UPDATE: packages/webhook/README.md` - one connector example in the current format, and a link to WEBHOOKS.md.
- `UPDATE: docs/sdk/AUTOMATIONS.md` - a plugin trigger is checked on save, and a reference must pass the owner rule.
- `UPDATE: docs/plugins/PLUGINS.md` - `runAutomation`, the `owner` of `fireTrigger`, `x-ahpd-connector` and `x-ahpd-automation`.
- `UPDATE: CHANGELOG.md` - the new schemes and bodies, and the breaks.

## Steps

1. Write one connector example for each sender in WEBHOOKS.md: GitHub, Stripe, Slack, GitLab, Shopify, Standard Webhooks, Meta and Microsoft Graph.
2. Write the event data a run reads, with one GitHub example.
3. Write `match`, with the GitHub `push` example.
4. Write the three targets and the owner rule.
5. Say that a token in the URL can be in a proxy log.
6. Replace the README's endpoint section with one current example.
7. Add the save check and the owner rule to AUTOMATIONS.md.
8. Add `runAutomation`, the `owner` argument and the two schema keys to PLUGINS.md.
9. List the breaks in the changelog: `automation: true`, the trigger field `endpoint`, `{{event.<field>}}` and the default `reply`.
10. Run `pnpm -s docs:build`, and set this task and the plan row to `implemented`.

## Validation

- `rg -n "webhooks/ci.md|secret: host:" packages/webhook/README.md docs` finds nothing.
- WEBHOOKS.md has one example for each of the eight senders.
- The changelog names each break of plan 54.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** WEBHOOKS.md is not hard-wrapped; keep one paragraph on one line.
