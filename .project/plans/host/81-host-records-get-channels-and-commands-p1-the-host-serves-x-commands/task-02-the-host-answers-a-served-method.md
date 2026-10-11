---
title: The host answers a served method, gates it and advertises it
status: implemented
depends: [task-01-a-plugin-registers-a-method.md]
layer: "packages/sdk host"
refs:
  - "[code://packages/sdk/src/host.ts#L1330-L1347](../../../../packages/sdk/src/host.ts#L1330-L1347) - the request dispatch"
  - "[code://packages/sdk/src/host/admission.ts](../../../../packages/sdk/src/host/admission.ts) - the grant check and a channel's `authorize`"
  - "[code://packages/sdk/src/host/handshake.ts#L282](../../../../packages/sdk/src/host/handshake.ts#L282) - `ahpd.channels` in the handshake"
  - "[code://packages/sdk/src/host/root.ts#L415](../../../../packages/sdk/src/host/root.ts#L415) - `ahpd.channels` in the root state"
---

## Objective

A request whose method a served method holds reaches its `handle` after the grant check, and `_meta['ahpd.methods']` lists it.

## Files

- `UPDATE: packages/sdk/src/host.ts:1341-1347` - look up `options.methods` before `-32601`.
- `UPDATE: packages/sdk/src/host/admission.ts` - a served method needs its grant, or its `authorize` says yes.
- `UPDATE: packages/sdk/src/host/handshake.ts:282` - `ahpd.methods` beside `ahpd.channels`.
- `UPDATE: packages/sdk/src/host/root.ts:415` - `ahpd.methods` beside `ahpd.channels`.
- `CREATE: packages/sdk/test/host-methods.test.ts` - cases for dispatch, gate and advertisement.

## Steps

1. When no protocol handler holds the method, look it up in `options.methods`.
2. Call `handle` with the params, the connection's principal and its client id.
3. Answer `-32601` for a served method before `initialize`, as for any other command.
4. In admission, require the method's grant, and ask `authorize` only when the grant refuses.
5. Let a host with no users directory call every served method, as it reads every channel.
6. Add `ahpd.methods` to the handshake `_meta` and the root state, one entry for each served method.
7. Leave out `ahpd.methods` when no plugin and no daemon code serves a method.

## Validation

- `host-methods.test.ts` calls `x-test/echo` and gets the answer `handle` gave.
- The host refuses a caller without the grant.
- The host lets in the same caller when `authorize` answers `true`.
- A method nobody serves is still `-32601`.
- `_meta['ahpd.methods']` lists `x-test/echo` with its grant and title.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

Implemented 2026-10-11. `methodIn` in `host/channels.ts` finds a served method by name. `host.ts` uses it as the handler when no protocol handler holds the name, so a served method passes the same handshake check and gate. `admission.ts` asks for the method's grant and its `authorize`. `root.ts` builds `advertisedMethods`, which the handshake and the root state send as `ahpd.methods`.
