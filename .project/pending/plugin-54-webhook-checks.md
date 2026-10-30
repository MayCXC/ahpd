---
title: Check a webhook against real senders
plans:
  - plans/plugin/54-a-webhook-takes-what-real-senders-send/plan.md
---

# Check a webhook against real senders

plugin/54 is merged in PR 67, and its tests pass. These checks need a daemon on this build, and a GitHub repository and a Slack app that can reach it. `docs/plugins/WEBHOOKS.md` gives each connector's fields.

## Before the checks

1. Rewrite the stored `hook-test` connector to the new form, as the plan's resume state says.
2. Make the daemon's webhook port reachable from GitHub and Slack, as "A public port" in `docs/plugins/WEBHOOKS.md` says.

## GitHub

1. Make a connector with the `github` scheme, a secret, and an automation as its target.
2. Add a webhook to the GitHub repository with the same secret and the connector's URL.
3. Push a commit, and check that the automation runs.
4. Change the secret in GitHub, push again, and check that the delivery answers 401 in GitHub's delivery list.
5. Set the connector's `match` to `headers.x-github-event: push`.
6. Open a pull request, and check that the delivery is skipped and nothing runs.

## Slack

1. Make a connector with the `slack` scheme and its signing secret.
2. Set the connector's URL as the Slack app's request URL.
3. Check that Slack accepts the URL, and that no automation runs.

## A form body

1. Make an automation whose prompt reads `{{event.body.<field>}}`.
2. Send a form-encoded call: `curl -X POST <connector URL> -d '<field>=hello'` with the connector's token.
3. Check that the run reads `hello`.

## Owners

1. As `user:alice`, make a connector.
2. As `user:bob`, save an automation that names that connector.
3. Check that the save is refused.

## A bot connector

1. Make a connector with only `bot` and `secret`.
2. Send a call to it with that secret.
3. Check that it answers 202.

## Reply

Write "pass", or what you saw. A pass ticks the matching line in the plan.
