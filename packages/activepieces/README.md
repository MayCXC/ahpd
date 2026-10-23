# @ahpd/activepieces

[![npm](https://img.shields.io/npm/v/%40ahpd%2Factivepieces)](https://www.npmjs.com/package/@ahpd/activepieces)
[![CI](https://github.com/softov/ahpd/actions/workflows/ci.yml/badge.svg)](https://github.com/softov/ahpd/actions/workflows/ci.yml)
![license MIT](https://img.shields.io/badge/license-MIT-blue)
![node >=22](https://img.shields.io/badge/node-%3E%3D22-5fa04e)
![Agent Host Protocol 0.9.0](https://img.shields.io/badge/AHP-0.9.0-0b7285)

Activepieces pieces as connectors for the [`@ahpd/server`](https://www.npmjs.com/package/@ahpd/server) daemon. Each piece is an adapter. Each of its actions is a tool that the host offers to a session or a bot that binds a connector of it.

A connector of a piece is one account: a Resend connector is one Resend key, and two Slack connectors are two Slack workspaces. The host keeps each key in the vault, because every secret field is `writeOnly`.

The pieces run in a child process, with no Activepieces server and no Docker. A piece bundles an HTTP client that turns off TLS checks for the process it runs in. The daemon starts one child for the pieces and pins that setting there.

Part of [ahpd](https://github.com/softov/ahpd). The source is in [`packages/activepieces`](https://github.com/softov/ahpd/tree/main/packages/activepieces).

## Install

```bash
ahpd plugin install @ahpd/activepieces
ahpd restart
```

The pieces in the table below are dependencies of this package, so they arrive with it. Another piece arrives the same way, as a dependency of the plugin, and its package is named in `pieces`. There is no separate command that installs one.

Update, remove and one-run flags are in [Plugins](https://github.com/softov/ahpd/blob/main/docs/server/PLUGINS.md).

## Options

In the configuration file, with three of the pieces named:

```json
{ "plugins": [{ "name": "@ahpd/activepieces", "options": { "pieces": ["@activepieces/piece-resend", "@activepieces/piece-telegram-bot", "@activepieces/piece-slack"] } }] }
```

| Option | Default | What it does |
| --- | --- | --- |
| `pieces` | - | The package of each piece the daemon offers, such as `@activepieces/piece-resend`. Required, and at least one |

An adapter is named `ap-` and the piece's own name: `ap-resend`, `ap-telegram-bot` and `ap-slack`. The plugin declares the contract `ap-*`, so a client sees every adapter it loads.

## The pieces this package ships

| Piece | Package | Version | Auth | License |
| --- | --- | --- | --- | --- |
| Resend | `@activepieces/piece-resend` | 0.6.1 | `SECRET_TEXT`, one key | MIT |
| Telegram Bot | `@activepieces/piece-telegram-bot` | 0.9.1 | `SECRET_TEXT`, one bot token | MIT |
| Slack | `@activepieces/piece-slack` | 0.23.1 | `CUSTOM_AUTH`, a bot token and an optional user token | MIT |
| GitHub | `@activepieces/piece-github` | 0.11.0 | `CUSTOM_AUTH`, a GitHub App: app id, installation id and private key | MIT |
| Linear | `@activepieces/piece-linear` | 0.9.1 | `SECRET_TEXT`, one API key | MIT |
| Jira Cloud | `@activepieces/piece-jira-cloud` | 0.6.1 | `CUSTOM_AUTH`, the site URL, an email and an API token | MIT |
| Discord | `@activepieces/piece-discord` | 0.8.0 | `SECRET_TEXT`, one bot token | MIT |
| WhatsApp Business | `@activepieces/piece-whatsapp` | 1.0.1 | `CUSTOM_AUTH`, an access token, the business account id and an optional app secret | MIT |
| Notion | `@activepieces/piece-notion` | 0.8.1 | `CUSTOM_AUTH`, an internal integration token | MIT |
| Airtable | `@activepieces/piece-airtable` | 0.9.2 | `SECRET_TEXT`, one personal access token | MIT |
| SMTP | `@activepieces/piece-smtp` | 0.5.0 | `CUSTOM_AUTH`, the host, port, TLS, and an optional email and password | MIT |
| SendGrid | `@activepieces/piece-sendgrid` | 0.6.3 | `SECRET_TEXT`, one API key | MIT |
| Stripe | `@activepieces/piece-stripe` | 0.9.0 | `SECRET_TEXT`, one secret key | MIT |
| HubSpot | `@activepieces/piece-hubspot` | 0.13.1 | `CUSTOM_AUTH`, a private app access token | MIT |

The versions are exact, and the versions `@activepieces/pieces-framework` at `0.32.0` describes. Each piece is in `packages/pieces/community/` or `packages/pieces/core/` of [github.com/activepieces/activepieces](https://github.com/activepieces/activepieces), which is MIT outside its `ee` folders. Slack, GitHub, Notion and HubSpot declare an OAuth2 connection beside the auth in the table, and this plugin offers only the auth in the table. Actions that need a file are left out: Airtable's file upload, HubSpot's file upload, Jira's two attachment uploads, Slack's file upload and WhatsApp's media upload.

## A connector

```json
{
  "id": "mail",
  "adapter": "ap-resend",
  "owner": "host",
  "config": {
    "secret_text": "re_the_resend_key"
  }
}
```

Sent as the params of `x-ahpd/connectors/put`, that connector writes the key to the vault and keeps `{ "$secret": "<name>" }` in the record. A bot, or a session config key, that binds `mail` gets the tool `ap_resend_send_email`, and a call sends one email through the piece. A Slack connector with `botToken` and `userToken` gets `ap_slack_send_channel_message` and the rest of the piece's actions.

## What a piece runs

- An action runs in the child process with the connector's auth and the call's input.
  The result comes back as the tool's answer, and a thrown error comes back as its message only.
- A call that takes longer than 60 seconds fails, and the child stays up for the next one.
  A child that exits starts again on the next call.
- An action may keep a value in `store`, and the child keeps it in memory for that connector alone until it exits.
- `files`, `connections` and `server` are not offered.
  An action that needs a required file is left out, and the plugin reports it once.
- Triggers, OAuth2 and file props wait for a later plan.

## Documentation

| | |
| --- | --- |
| [PLUGINS.md](https://github.com/softov/ahpd/blob/main/docs/server/PLUGINS.md) | What a plugin is, and how a daemon loads one |

## License

MIT.
