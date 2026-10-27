---
title: A plugin names a brand mark the host ships - implemented
date: 2026-10-26
refs:
  - git://1751f629
  - "[code://packages/server/src/icons.ts](../../../../packages/server/src/icons.ts)"
  - "[code://packages/sdk/src/connectors/adapters.ts](../../../../packages/sdk/src/connectors/adapters.ts)"
  - "[code://packages/activepieces/src/logos.ts](../../../../packages/activepieces/src/logos.ts)"
  - "[code://packages/agent-acp/src/presets.ts](../../../../packages/agent-acp/src/presets.ts)"
  - "[code://packages/sdk/src/agents/channel.ts](../../../../packages/sdk/src/agents/channel.ts)"
---

The host ships a set of brand marks, and any plugin names one with `{ "src": "mark:<name>" }` instead of shipping a file. The Jira, Linear, Resend and WhatsApp pieces show their marks without a CDN fetch. An adapter with no icon shows its plugin's icon. Each ACP agent with a known vendor shows that vendor's mark, and an existing record gets it with no edit.

## What was built

- [`code://packages/server/src/icons.ts`](../../../../packages/server/src/icons.ts) - `resolveIcons` resolves a `mark:` source against `packages/server/icons/`. It also sends `<name>-dark.svg` with `theme: "dark"` where that file exists. An unknown or malformed name is one problem line.
- `packages/server/icons/` - the Jira, Linear, Resend, WhatsApp, Gemini, Qwen, Copilot, OpenCode, Cursor and Cline marks, with a dark file for Copilot, OpenCode, Cursor and Cline.
- [`code://packages/server/src/plugins.ts`](../../../../packages/server/src/plugins.ts) - the loader resolves the icon of each engine template.
- [`code://packages/sdk/src/connectors/adapters.ts`](../../../../packages/sdk/src/connectors/adapters.ts) - an adapter with no icon is sent with its plugin's icons.
- [`code://packages/activepieces/src/logos.ts`](../../../../packages/activepieces/src/logos.ts) - a table from piece to mark, read before the cache and the CDN.
- [`code://packages/agent-acp/src/presets.ts`](../../../../packages/agent-acp/src/presets.ts) - each template with a known vendor names its `mark:` icon.
- [`code://packages/sdk/src/agents/channel.ts`](../../../../packages/sdk/src/agents/channel.ts) - the agents row carries `icons`: the record's own icon, or the icons of the template whose `command` matches.
- `docs/plugins/PLUGINS.md` and `docs/plugins/activepieces.md` describe the `mark:` source and the fallbacks.

## Verified

- `packages/server/test/plugin-icons.test.ts`, `packages/sdk/test/adapters-channel.test.ts`, `packages/sdk/test/agents-channel.test.ts` and `packages/activepieces/test/logos.test.ts` cover the new paths.
- The full gate passed, except for a timeout in `computer-plugin.test.ts` that fails on main too.
- CI passed on #102, with all 8 checks, `check-windows` and `install-windows` included.

## Departures from the plan

- none.

## Left for later

- The dsh mark, six agents with no mark, a Resend dark file and the ahpw change - see [deferred.md](deferred.md).
- The by-hand checks - see `.project/pending/plugin-69-mark-checks.md`.
