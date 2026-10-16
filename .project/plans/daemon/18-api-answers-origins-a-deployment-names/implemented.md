---
title: The API answers to the origins a deployment names - implemented
refs:
  - git://8d7f781 - the build
  - "[code://packages/server/src/commands/run.ts#L75-L95](../../../../packages/server/src/commands/run.ts#L75-L95) - `apiOrigins`, which adds each configured origin"
  - "[code://packages/server/src/commands/options.ts](../../../../packages/server/src/commands/options.ts) - `originOf`, which checks each entry at start"
---

## What exists now

The key `origins` and the repeatable flag `--origin` list the extra origins the daemon answers to.
`originOf` refuses an entry that is not an `http:` or `https:` origin, and the message names the entry.
`apiOrigins` takes the list as its fourth argument and adds the origin and the `host` of each entry.
The API listener, the proxy and the plugin routes pass `options.origins`.
DAEMON.md, HOST.md and the server README list the key and the flag.

## Verified

- `pnpm -s typecheck` and `pnpm -s boundary` pass.
- `config-check`, `server-http`, `plugin-route`, `server-restart`, `vault-command`, `server-root-config`, `server-cli` and `server-commands` pass.
- `plugin-route.test.ts` starts a daemon with `http://203.0.113.5:37537`, which answers that `Host` and refuses another port or no port.

## Departures from the plan

- `server-commands.test.ts` lists the repeatable flags, so it now names `--origin` too.
- The `ahpd config` line in the checklist was not checked by hand.
