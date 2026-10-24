---
title: Move config-dev.json from providers to connectors
plans:
  - plans/proxy/04-providers-are-connectors/plan.md
---

# Move config-dev.json from providers to connectors

Softov's `config-dev.json` writes `modelProxy.providers`, which this build no longer reads.
The daemon refuses that file at start with `modelProxy.providers is no longer read: add each provider as a connector, see docs/server/PROXY.md`.
These steps move each entry to a connector before the restart.
Do them while the old daemon still runs, because a put is answered by it.

## Steps

1. Remove `modelProxy.providers` from `config-dev.json`, and keep `modelProxy.models` as it is.
2. For each model entry, keep its `provider` name. The connector that serves the entry gets that name as its `id`, so the table does not change.
3. Put a `local` connector for the `openai-compatible` endpoint at `http://127.0.0.1:1234/v1`, with no key unless that server asks for one.
4. Put one host connector for each vendor key, with `{ "fromEnv": "<NAME>" }` so the key stays in the daemon's variable.
5. Restart, then call `ahpd proxy list`: the model names are there, and each one's entries name the connectors you made.
6. Call one model through `/v1` and check that the usage record names the connector that answered.

## The put

Send each object as the params of `x-ahpd/connectors/put`, or write it to `<configDir>/connectors/<id>.json` and restart.
Only the put writes the vault, so a `key` written straight into the file is not a secret. It is read as the key itself.
The form below is the put's.

```json
{ "id": "local", "adapter": "openai-compatible", "owner": "host", "config": { "endpoint": "http://127.0.0.1:1234/v1" } }
```

```json
{ "id": "openrouter", "adapter": "openrouter", "owner": "host", "config": { "key": { "fromEnv": "OPENROUTER_API_KEY" } } }
```

```json
{ "id": "anthropic", "adapter": "anthropic", "owner": "host", "config": { "key": { "fromEnv": "ANTHROPIC_API_KEY" } } }
```

```json
{ "id": "openai", "adapter": "openai", "owner": "host", "config": { "key": { "fromEnv": "OPENAI_API_KEY" } } }
```

Drop a row for a key the file does not use, and add one for each other provider the file names.
A key that was written in the file goes to the vault as the put's `key` value, with no `fromEnv`.

## Reply

Write "done" when the daemon starts and one call works, or what stopped it.
