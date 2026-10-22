# Webhooks

`@ahpd/webhook` gives a program outside the host a URL to call. A call to an endpoint either talks to a bot or fires an automation, and each endpoint has its own secret.

## The endpoint connector

An endpoint is a `webhook` connector: a JSON record in `<configDir>/connectors/<id>.json`, made from a client with `x-ahpd/connectors/put`. A hand-written `webhooks/<id>.md` file is no longer read.

| Field | What it is |
| --- | --- |
| `id` | The slug, and the last segment of the endpoint's URL |
| `title` | What a client prints for it. Optional |
| `owner` | `host`, `team:<team>` or `user:<id>`. The secret is kept under that owner's scope |
| `config.bot` | The bot a call talks to, as `bot://<slug>`. An endpoint names `bot` or `automation`, not both |
| `config.automation` | `true` on an endpoint whose calls fire the `webhook` trigger |
| `config.secret` | The value the caller sends as its bearer token. The field is `writeOnly`, so it is kept in the vault and never in the record |
| `config.reply` | How a call to a bot is answered: `callback`, `sync` or `none`. The default is `callback` |
| `config.callbackPrefix` | What every callback URL must start with: an `http` or `https` URL whose path ends in `/`. A `callback` endpoint needs one |
| `config.syncTimeoutSeconds` | How long a `sync` call waits, over the plugin option of the same name |

```json
{
  "id": "ci",
  "kind": "webhook",
  "owner": "host",
  "title": "CI",
  "config": {
    "bot": "bot://motion",
    "secret": "a-long-random-value",
    "callbackPrefix": "https://ci.example.com/hooks/"
  }
}
```

That object is the params of `x-ahpd/connectors/put`. A config that fails the kind's schema is refused with `-32602` and no connector is made. A `put` of an id that already exists closes the connector it had, writes the record and opens the new one.

The host writes `secret` to the vault as `host:connector/<id>/secret`, `team:<team>/connector/<id>/secret` or `user:<id>/connector/<id>/secret`, and the record holds `{ "$secret": "<name>" }` in its place. A client sending the config again sends an empty `secret` to keep the stored value. `ahpd vault list` shows the names.

A connector of a kind no loaded plugin registers stays on disk and shows as `unavailable`, and one whose config no longer fits shows as `invalid`. A call to either answers 404, and so does one to a connector that is not open yet.

## The call

An endpoint's URL is `/plugins/webhook/<id>` on the daemon's port. A call is a `POST` with the endpoint's secret as a bearer token:

```bash
curl -X POST http://127.0.0.1:37537/plugins/webhook/ci \
  -H "Authorization: Bearer $CI_HOOK_TOKEN" \
  -H 'content-type: application/json' \
  -d '{ "thread": "pr-42", "text": "Review this pull request.", "callback": "https://ci.example.com/hooks/pr-42" }'
```

The token is the connector's `secret`, which the host keeps in the vault, so nothing else has to be set.

| Answer | When |
| --- | --- |
| 401 | The call has no bearer token, or the token is not the connector's secret |
| 404 | No open connector answers for that id, or the path has more than one segment after the prefix |
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

The routes listener checks the `Host` header like the daemon's port does. A caller that reaches it by a public name needs that name in `origins`. With `routes.port` set, `/plugins/*` answers 404 on the daemon's port. See [HOST.md](../sdk/HOST.md#configuration-keys).

## A call to a bot

A call to a bot endpoint sends its text as a turn in the plugin's own chat with the bot. That is one chat for the endpoint: the caller names a thread, and every thread talks in it. The chat is the one a read of the bot answers the plugin, and the first call starts it.

A turn in that chat runs no model. It ends in the call that starts it, with no response part, so a call is answered with no `text` until the bot's own work can post into its chat.

The call is one of two shapes:

- A JSON body `{ "thread": "...", "text": "...", "callback": "..." }`.
- Any other body, which is the text as it came. The `thread` and `callback` come from the query: `/plugins/webhook/ci?thread=pr-42`.

A JSON body that has no string `text` is the second shape, so the whole body is the text.

The plugin keeps each thread in the `webhook-threads` collection, as the endpoint, the thread id, the session and the chat. Every thread of an endpoint holds the same session and chat, which is what a session started again under a new URI rewrites.

### The reply

| `reply` | What the call answers |
| --- | --- |
| `callback` | 202 with `{ thread, turn }` once the turn is sent. At the turn's end, the plugin posts `{ thread, turn, status, text, error }` to the call's `callback` URL |
| `sync` | 200 with `{ thread, turn, status, text, error }` at the turn's end, or 502 when the turn failed. When the turn runs longer than the timeout, 202 with `status: "running"`, and the turn goes on |
| `none` | 202 with `{ thread, turn }` once the turn is sent |

`text` is the turn's `markdown` response parts, joined: what the bot said in it. A turn in a `bot-chat` has none until the bot posts into its chat, so `text` is empty. `status` is `complete`, `cancelled` or `error`. A turn that failed has `status: "error"` and the message of its error in `error`, which no other answer holds. A `sync` call answers a failed turn with 502, so a caller that reads only the HTTP status sees the failure. A cancelled turn answers 200.

A callback URL must start with the endpoint's `callbackPrefix`. The plugin compares the URL as `new URL` writes it, so `https://ci.example.com.evil.test/` does not pass the prefix `https://ci.example.com/`. Without this check, any caller could make the host post to any address.

A callback that answers with a redirect is a failed callback. The plugin does not follow the redirect, and the daemon's log gets a problem line.

A `sync` call waits for `syncTimeoutSeconds`: the endpoint's field, or the plugin option, which is 60 by default.

```json
{
  "plugins": [
    { "name": "@ahpd/webhook", "options": { "syncTimeoutSeconds": 30 }, "grants": ["bot:get", "bot:chat", "session:read", "session:create", "session:write"] }
  ]
}
```

| Answer | When |
| --- | --- |
| 400 | The call has no thread or no text, or its callback URL is missing or outside the prefix |
| 409 | The plugin may not read the bot, the read answered no chat for it, or the host refused the turn. The answer's `message` is the host's reason. A turn that the host does not echo in 10 seconds is not refused: the call goes on, and the daemon's log gets a problem line. The first two are also a problem in the daemon's log, and the chat refusal names the grants `bot:chat` and `session:create` |

### The grants

On a host with a users directory, the plugin acts as `plugin:webhook`, with the grants of its entry:

| Grant | What it is for |
| --- | --- |
| `bot:get` | Read the bot |
| `bot:chat` | Be answered a chat by it, which the read starts |
| `session:read` | Read the session's state, which names the chat, and the turn's text |
| `session:create` | Start a session for an owner, which a read of the bot does |
| `session:write` | Send the turn |

The chat is the plugin's own, started as the owner `plugin:webhook`, so `session:create` is asked of nobody here: it is in the list because those two are the grants the plugin's problem line prints when a read is answered no chat.

The plugin opens its connection when the daemon listens, and hears each turn's end from the host.

## A call to an automation

A call to an automation endpoint fires the `webhook` trigger type, which the plugin offers. The type has one event, `call`, and its form asks for one `endpoint`. An automation runs on a call when its trigger's `config` names the endpoint the call came to.

```json
{
  "id": "deploys",
  "kind": "webhook",
  "owner": "host",
  "config": { "automation": true, "secret": "another-long-random-value" }
}
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

The body is a JSON object, and its fields are the data of the fire. The plugin sets `endpoint` in the data to the endpoint id, over any body field of that name, so a caller reaches only the automations of the endpoint it called. Any other field that the trigger's `config` names must have the same value in the body when the body holds it. A `config` field that the body does not hold does not stop the run.

A run's message names a field as `{{event.<field>}}`. A string is filled as it is, any other value as JSON, and a missing field as nothing. See [AUTOMATIONS.md](../sdk/AUTOMATIONS.md) for the other placeholders.

| Answer | When |
| --- | --- |
| 202 | The trigger fired. The body is `{ "endpoint": "<id>" }`, because a fire has no answer |
| 400 | The body is not JSON, or not a JSON object |

The run's origin keeps the data of the fire, so the body must carry no secret. An automation call needs no grant.
