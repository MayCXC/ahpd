---
title: The host serves x- commands, and a plugin registers one - implemented
date: 2026-10-11
refs:
  - git://796ac45 - the last review fix; the build is da923f3, and the review fixes are 02a6f20, 5f85e17 and 796ac45
  - "[code://packages/sdk/src/types/plugin.ts](../../../../packages/sdk/src/types/plugin.ts) - `PluginMethod`, `ServedMethod` and `registerMethod`"
  - "[code://packages/sdk/src/plugins.ts](../../../../packages/sdk/src/plugins.ts) - `registerMethod`, and the fold of `methods`"
  - "[code://packages/sdk/src/host.ts](../../../../packages/sdk/src/host.ts) - the dispatch to a served method"
  - "[code://packages/sdk/src/host/admission.ts](../../../../packages/sdk/src/host/admission.ts) - the grant and `authorize` of a served method"
  - "[code://packages/sdk/src/host/root.ts](../../../../packages/sdk/src/host/root.ts) - `advertisedMethods`"
---

The host answers a command that starts with `x-` when the daemon or a plugin serves it.
A plugin serves one with `registerMethod`, and the daemon with `HostOptions.methods`.
A client finds each served command in `_meta['ahpd.methods']`.

## What was built

- [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts) - `PluginMethod`, `ServedMethod`, and `registerMethod` on `PluginHost`.
- [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts) - `HostOptions.methods`, beside `channels`.
- [`code://packages/sdk/src/validate.ts`](../../../../packages/sdk/src/validate.ts) - `checkMethod`, which refuses a name without `x-`, a bad grant and a missing `handle`.
- [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts) - `registerMethod`, and a fold that seeds `methods` from `base.methods` and refuses a name that is already served.
- [`code://packages/sdk/src/host/channels.ts`](../../../../packages/sdk/src/host/channels.ts) - `methodIn`, which finds a served method by name.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) - a served method is the handler when no protocol handler holds the name, so it passes the same handshake check and gate.
- [`code://packages/sdk/src/host/admission.ts`](../../../../packages/sdk/src/host/admission.ts) - a served method needs its grant, or a yes from its `authorize`.
- [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts) - `advertisedMethods`, which the handshake and the root state send as `ahpd.methods`.
- [`code://packages/sdk/src/host/gate.ts`](../../../../packages/sdk/src/host/gate.ts) - `ownIn`, which reads a table by its own keys only.
- `docs/PLUGINS.md` has a section "A command of your own", and `00-plugin.md` marks `registerMethod` as built.

## Verified

- `packages/sdk/test/plugin-method.test.ts` has the registration cases, and `plugin-validate.test.ts` has the `checkMethod` cases.
- `packages/sdk/test/host-methods.test.ts` has the dispatch, gate and advertisement cases, and a case for a method named like an Object built-in.
- `pnpm exec vitest run packages/sdk` passes.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Task 01 - the registration cases are in a new file, `plugin-method.test.ts`, because `plugins.test.ts` does not exist.
- Review fix 02a6f20 - `handle` takes a fourth argument, the owner, which is whose work the request is, as a resource write records it.
- Review fix 02a6f20 - `handle.subscribers(uri)` lists one entry for each client id and person, because several people can share one client id.
- Review fixes 5f85e17 and 796ac45 - a method named like an Object built-in answers `-32601`, and the host reads its action tables by own key only.

## Left for later

- none.
