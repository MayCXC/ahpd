---
title: A plugin opens a canvas on a chat - implemented
date: 2026-10-28
refs:
  - git://59744bb8 - the last commit on the branch, which holds task 01; tasks 02 to 04 are uncommitted in the worktree
  - "[code://packages/sdk/src/host/canvases.ts](../../../../packages/sdk/src/host/canvases.ts) - the canvas store"
  - "[code://packages/sdk/src/plugins/plugins.ts](../../../../packages/sdk/src/plugins/plugins.ts) - the three calls a plugin makes"
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the plugin API, under *Showing a canvas on a chat*"
---

A plugin can show a canvas on a chat.
`openCanvas`, `updateCanvas` and `closeCanvas` are on every `PluginHost`, and the host keeps what each plugin opened.
A chat's state lists its canvases, and each canvas is an `ahp-canvas:/<base64url(chat)>/<uuid>` channel of its own.
A connection at `0.10.0` or later is sent the two canvas actions.
A client cannot open or close one.

## What was built

- [`code://packages/sdk/src/host/canvases.ts`](../../../../packages/sdk/src/host/canvases.ts) - the store: `open`, `update`, `close`, `closeAll`, `snapshot`, `listOf`, `chatOf` and `forgetChat`.
  It refuses a call while `canvasesEnabled` is off, and a chat this host does not hold.
  It also refuses a state with no instance, extension or canvas id, and a `url` that is not absolute http(s) with a host.
  A plugin that did not open the canvas is refused too.
- [`code://packages/sdk/src/host/channels.ts`](../../../../packages/sdk/src/host/channels.ts) - `canvasResource` builds the channel, and `chatOfCanvas` reads the chat back.
- [`code://packages/sdk/src/host/snapshots.ts`](../../../../packages/sdk/src/host/snapshots.ts) - a subscribe to an `ahp-canvas:` channel answers the store or `-32008` "Canvas is no longer available".
  A chat snapshot carries `canvases` when it holds any.
- [`code://packages/sdk/src/host/routing.ts`](../../../../packages/sdk/src/host/routing.ts) - a canvas channel is read as its chat's session, so the users gate asks the chat's session.
- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) and [`code://packages/sdk/src/host/lifecycle.ts`](../../../../packages/sdk/src/host/lifecycle.ts) - a moved chat, a removed chat and a closed session forget their canvases.
- [`code://packages/sdk/src/plugins/plugins.ts`](../../../../packages/sdk/src/plugins/plugins.ts) - the three calls, the sentence a plugin gets before a host is built, and the unload closer the first open puts on the plugin.
- [`code://packages/sdk/src/host/facts.ts`](../../../../packages/sdk/src/host/facts.ts) - `wireCanvases` sets `open`, `update`, `close` and `closeAll` on every entry at start and again from `replace`.
- [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts) and [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) - `ServedCanvases`, `Contribution.canvases`, the three `PluginHost` calls and `HostOptions.pluginCanvases`.
- [`code://packages/sdk/src/vscoderootconfig.ts`](../../../../packages/sdk/src/vscoderootconfig.ts) - `canvasesEnabled` named as a key this host reads.
- [`code://packages/sdk/test/host-canvases.test.ts`](../../../../packages/sdk/test/host-canvases.test.ts) and [`code://packages/sdk/test/plugin-canvases.test.ts`](../../../../packages/sdk/test/plugin-canvases.test.ts) - thirteen cases on the store and twelve on the plugin calls.
- [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md), [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md), [`code://docs/sdk/CHATS.md`](../../../../docs/sdk/CHATS.md), [`code://docs/sdk/HOST.md`](../../../../docs/sdk/HOST.md) and [`code://UPSTREAM.md`](../../../../UPSTREAM.md) - the plugin API, the two actions, the chat's canvases, the root key, and the Pass 7 box.

## Verified

- `pnpm exec tsc -p tsconfig.json --noEmit` is clean.
- `pnpm -s schema && pnpm exec vitest run` passed: 450 files, 7466 tests, one file skipped, 29 tests skipped, exit 0, 277s.
- The five files nearest this work pass on their own: `host-canvases.test.ts` 13, `plugin-canvases.test.ts` 12, `plugins-close.test.ts` 4, `plugin-fold.test.ts` 30 and `plugin-host.test.ts` 31, 90 tests in all.
- `pnpm docs:build` completed in 17.53s with no dead link.
- `lint-prose.mjs` on the new prose reports nothing except the em dash in the `canvas/*` heading, which its siblings carry.
- The store reads `state.url` only to parse it; no error, action or log line carries the url.

## Departures from the plan

- The unload road is not gated by `canvasesEnabled`. `closeAll(by)` is the host taking back what a plugin drew, not the plugin's call. An unloaded plugin therefore leaves no canvas on a chat with nothing behind it. The three plugin calls stay refused while the key is off.
- The unload closer is pushed at the first successful `openCanvas`, not when the plugin is folded. `HostOptions.closers` carries one entry per registration, and `plugins-close.test.ts` holds that a plugin which registers nothing contributes none.
- `Contribution.canvases` and `HostOptions.pluginCanvases` are not in task 03's *Files*: the fold has no other way to carry the store to the host. `Contribution` gained a required member, so `plugin-host.test.ts` and `plugin-fold.test.ts` build it.
- The keys this host reads are listed in HOST.md *Root config*, not in AHP.md as task 04's step 6 asked; AHP.md links there.
- The three calls are not `register*` methods, so their rows are a table in the new PLUGINS.md section rather than in the register table.
- Task 03 named `https:///board` as a refused url, but WHATWG parses it with `board` as the host; the case is `https://`.
- The tests turn the key on by pushing `root/configChanged` on `ahp-root://`, because `HostOptions.rootConfig` is the daemon's port and not the record a client's push fills. That push needs `config:write`, so the users case names the grant.

## Left for later

- ahpw and ahpapp draw no canvas; the plan leaves client work out.
- The host caps no chat's canvases, as the plan's defaulted answer says, so a plugin decides its own cap.
- The Final verification checklist in the plan is Softov's to close at review.
