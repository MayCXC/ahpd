# @ahpd/webhook

[![npm](https://img.shields.io/npm/v/%40ahpd%2Fwebhook)](https://www.npmjs.com/package/@ahpd/webhook)
[![CI](https://github.com/softov/ahpd/actions/workflows/ci.yml/badge.svg)](https://github.com/softov/ahpd/actions/workflows/ci.yml)
![license MIT](https://img.shields.io/badge/license-MIT-blue)
![node >=22](https://img.shields.io/badge/node-%3E%3D22-5fa04e)
![Agent Host Protocol 0.9.0](https://img.shields.io/badge/AHP-0.9.0-0b7285)

Webhooks for the [`@ahpd/server`](https://www.npmjs.com/package/@ahpd/server) daemon. A program outside the host calls a URL, and the call talks to a bot or fires an automation.

Each endpoint is a record in the `webhooks` collection, and names its own vault secret. A call passes only with that secret as its bearer token.

Part of [ahpd](https://github.com/softov/ahpd). The source is in [`packages/webhook`](https://github.com/softov/ahpd/tree/main/packages/webhook).

## In the daemon

```bash
ahpd plugin install @ahpd/webhook
```

That installs it where the daemon looks for plugins and adds it to `plugins` in the configuration file.

## An endpoint

```md
---
id: ci
bot: bot://motion
secret: host:ci-hook
callbackPrefix: https://ci.example.com/hooks/
---
```

Kept as `<configDir>/webhooks/ci.md`, this endpoint answers `POST /plugins/webhook/ci` with `Authorization: Bearer <the value of host:ci-hook>`.

[WEBHOOKS.md](https://github.com/softov/ahpd/blob/main/docs/WEBHOOKS.md) describes the record, the call and the answers.

## License

MIT.
