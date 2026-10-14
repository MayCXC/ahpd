# Webhooks

`@ahpd/webhook` gives a program outside the host a URL to call. A call to an endpoint either talks to a bot or fires an automation, and each endpoint has its own secret.

## The endpoint record

An endpoint is a record in the `webhooks` collection. The daemon's record store keeps each one as a file a person writes by hand, `<configDir>/webhooks/<id>.md`.

| Field | What it is |
| --- | --- |
| `id` | The slug, and the last segment of the endpoint's URL |
| `bot` | The bot a call talks to, as `bot://<slug>`. An endpoint names `bot` or `automation`, not both |
| `automation` | `true` on an endpoint whose calls fire the `webhook` trigger |
| `secret` | The name of the vault secret that the caller sends as its bearer token, such as `host:ci-hook` |
| `reply` | How a call to a bot is answered: `callback`, `sync` or `none`. The default is `callback` |

```md
---
id: ci
bot: bot://motion
secret: host:ci-hook
---
```

A record that fails the check is no endpoint. A call to it answers 404, and the plugin reports the problem.

## The call

An endpoint's URL is `/plugins/%40ahpd/webhook/<id>` on the daemon's port. A call is a `POST` with the endpoint's secret as a bearer token:

```bash
curl -X POST http://127.0.0.1:37537/plugins/%40ahpd/webhook/ci \
  -H "Authorization: Bearer $CI_HOOK_TOKEN" \
  -H 'content-type: application/json' \
  -d '{ "thread": "pr-42", "text": "Review this pull request." }'
```

Put the token in the vault under the name that `secret` gives, with `ahpd vault set host:ci-hook`.

| Answer | When |
| --- | --- |
| 401 | The call has no bearer token, the token is wrong, or the vault does not hold the secret. The last case is also a problem in the daemon's log |
| 404 | No endpoint has that id, or the path has more than one segment after the prefix |
| 405 | The method is not `POST` |

The plugin compares the token in constant time, and reads no body before the token passes.
