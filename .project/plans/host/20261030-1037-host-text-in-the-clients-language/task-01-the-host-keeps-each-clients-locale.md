---
title: The host keeps each client's locale
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L148-L231](../../../../packages/sdk/src/host/handshake.ts#L148-L231) - `initialize`, where `clientId` and the agreed version are kept"
  - "[code://packages/sdk/src/host/handshake.ts#L370-L413](../../../../packages/sdk/src/host/handshake.ts#L370-L413) - `reconnect`"
  - "[code://packages/sdk/src/types/host.ts#L1161-L1176](../../../../packages/sdk/src/types/host.ts#L1161-L1176) - `Connection`"
---

## Objective

The host keeps the `locale` that a client sends, for each connection and for each client id.
A later answer for that client reads it.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:1161-1176` - `Connection.locale`, the BCP 47 tag the client sent, absent when it sent none.
- `UPDATE: packages/sdk/src/host/handshake.ts:148-231` - `initialize` keeps `params.locale` on the connection and by client id.
- `UPDATE: packages/sdk/src/host/handshake.ts:370-413` - `reconnect` replaces the locale when `params.locale` is a string.
- `UPDATE: packages/sdk/src/host/context.ts` - `localeOf(clientId)`, the last locale that client sent.
- `CREATE: packages/sdk/test/host-locale.test.ts` - the cases below.

## Steps

1. Add `locale?: string` to `Connection`, with a doc comment.
2. In `initialize`, keep `params.locale` when it is a non-empty string of at most 35 characters.
3. Keep the same value in a map by client id on the host context.
4. In `reconnect`, replace both when `params.locale` passes the same check, and keep them when it is absent.
5. Add `localeOf(clientId)` to the host context, which answers the map's value or `undefined`.
6. Write the tests.

## Validation

- `initialize` with `locale: 'pt-BR'` gives `connection.locale === 'pt-BR'` and `localeOf(id) === 'pt-BR'`.
- `initialize` with no `locale` leaves both `undefined`.
- `reconnect` with `locale: 'es'` replaces both, and `reconnect` with none keeps the old value.
- The host ignores a `locale` that is not a string, or that is longer than 35 characters.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
