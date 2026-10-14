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
| `callbackPrefix` | What every callback URL must start with: an `http` or `https` URL whose path ends in `/`. A `callback` endpoint needs one |
| `syncTimeoutSeconds` | How long a `sync` call waits, over the plugin option of the same name |

```md
---
id: ci
bot: bot://motion
secret: host:ci-hook
callbackPrefix: https://ci.example.com/hooks/
---
```

A record that fails the check is no endpoint. A call to it answers 404, and the plugin reports the problem.

## The call

An endpoint's URL is `/plugins/%40ahpd/webhook/<id>` on the daemon's port. A call is a `POST` with the endpoint's secret as a bearer token:

```bash
curl -X POST http://127.0.0.1:37537/plugins/%40ahpd/webhook/ci \
  -H "Authorization: Bearer $CI_HOOK_TOKEN" \
  -H 'content-type: application/json' \
  -d '{ "thread": "pr-42", "text": "Review this pull request.", "callback": "https://ci.example.com/hooks/pr-42" }'
```

Put the token in the vault under the name that `secret` gives, with `ahpd vault set host:ci-hook`.

| Answer | When |
| --- | --- |
| 401 | The call has no bearer token, the token is wrong, or the vault does not hold the secret. The last case is also a problem in the daemon's log |
| 404 | No endpoint has that id, or the path has more than one segment after the prefix |
| 405 | The method is not `POST` |

The plugin compares the token in constant time, and reads no body before the token passes.

### A public port

The webhooks can be on a public address while AHP and the API stay on loopback. The daemon key `routes` gives every plugin route a listener of its own, which serves nothing else:

```json
{
  "host": "127.0.0.1",
  "routes": { "port": 8443, "host": "0.0.0.0" },
  "origins": ["https://hooks.example.com"]
}
```

The routes listener checks the `Host` header like the daemon's port does. A caller that reaches it by a public name needs that name in `origins`. With `routes.port` set, `/plugins/*` answers 404 on the daemon's port. See [HOST.md](HOST.md#configuration-keys).

## A call to a bot

A call to a bot endpoint sends its text as a turn in one chat of the bot's session. The caller names a thread, and every call with the same thread goes to the same chat. The first call of a thread makes the chat.

The call is one of two shapes:

- A JSON body `{ "thread": "...", "text": "...", "callback": "..." }`.
- Any other body, which is the text as it came. The `thread` and `callback` come from the query: `/plugins/%40ahpd/webhook/ci?thread=pr-42`.

A JSON body that has no string `text` is the second shape, so the whole body is the text.

The plugin keeps each thread in the `webhook-threads` collection, as the endpoint, the thread id, the session and the chat.

### The reply

| `reply` | What the call answers |
| --- | --- |
| `callback` | 202 with `{ thread, turn }` once the turn is sent. At the turn's end, the plugin posts `{ thread, turn, status, text }` to the call's `callback` URL |
| `sync` | 200 with `{ thread, turn, status, text }` at the turn's end. When the turn runs longer than the timeout, 202 with `status: "running"`, and the turn goes on |
| `none` | 202 with `{ thread, turn }` once the turn is sent |

`text` is the bot's answer in that turn, and `status` is `complete` or `cancelled`.

A callback URL must start with the endpoint's `callbackPrefix`. The plugin compares the URL as `new URL` writes it, so `https://ci.example.com.evil.test/` does not pass the prefix `https://ci.example.com/`. Without this check, any caller could make the host post to any address.

A `sync` call waits for `syncTimeoutSeconds`: the endpoint's field, or the plugin option, which is 60 by default.

```json
{
  "plugins": [
    { "name": "@ahpd/webhook", "options": { "syncTimeoutSeconds": 30 }, "grants": ["bot:get", "session:read", "session:write"] }
  ]
}
```

| Answer | When |
| --- | --- |
| 400 | The call has no thread or no text, or its callback URL is missing or outside the prefix |
| 409 | The bot has no session, or the plugin may not read the bot |

### The grants

On a host with a users directory, the plugin acts as `plugin:@ahpd/webhook`, with the grants of its entry:

| Grant | What it is for |
| --- | --- |
| `bot:get` | Read the bot, to find its session |
| `session:read` | Load the session, and read the turn's text |
| `session:write` | Make the thread's chat, and send the turn |

The plugin opens its connection when the daemon listens, and hears each turn's end from the host.

## A call to an automation

A call to an automation endpoint fires the `webhook` trigger type, which the plugin offers. The type has one event, `call`, and its form asks for one `endpoint`. An automation runs on a call when its trigger's `config` names the endpoint the call came to.

```md
---
id: deploys
automation: true
secret: host:deploys-hook
---
```

```markdown
---
title: Check a deploy
enabled: true
session:
  provider: claude
triggers:
  - id: t1
    kind: event
    type: webhook
    title: A deploy finished
    events:
      - id: call
    config:
      endpoint: deploys
---

The deploy of {{event.repo}} at {{event.ref}} finished. Check that the service is up.
```

The body is a JSON object, and its fields are the data of the fire. The plugin sets `endpoint` in the data to the endpoint id, over any body field of that name, so a caller reaches only the automations of the endpoint it called. Any other field that the trigger's `config` names must also have the same value in the body.

A run's message names a field as `{{event.<field>}}`. A string is filled as it is, any other value as JSON, and a missing field as nothing. See [AUTOMATIONS.md](AUTOMATIONS.md) for the other placeholders.

| Answer | When |
| --- | --- |
| 202 | The trigger fired. The body is `{ "endpoint": "<id>" }`, because a fire has no answer |
| 400 | The body is not JSON, or not a JSON object |

The run's origin keeps the data of the fire, so the body must carry no secret. An automation call needs no grant.
