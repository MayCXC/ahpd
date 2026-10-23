---
title: A connector plugin runs Activepieces pieces as tools - deferred
date: 2026-10-23
---

These wait for a later plan, or for a piece that needs them.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| Telegram receives messages, through the piece's trigger | Softov, 2026-10-23, "telegram with a later fit for receiving messages is a good approach". A trigger needs a `receive` capability and a webhook path. | a later plugin plan |
| OAuth2 auth, for Slack's "Connection" and for Instagram | The host has no OAuth flow for a connector. | the [connectors idea](../../../ideas/connectors-come-from-activepieces-pieces.md) |
| `BASIC_AUTH` and `OIDC` auth | No first piece uses them. | unplanned |
| `FILE` props, and the context's `files` | A tool input has no file shape yet. | unplanned |
| The options of a `DROPDOWN` prop, read with the connector's auth | Each list is a call to the account, and the model can give an id. | unplanned |
| The context's `server` and `connections` | No first action needs them. | unplanned |
| A command that installs a piece | The `pieces` option and a package install are enough for now. | unplanned |
