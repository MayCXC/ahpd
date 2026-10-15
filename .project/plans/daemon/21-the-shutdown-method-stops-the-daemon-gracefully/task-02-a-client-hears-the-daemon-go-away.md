---
title: A client hears the daemon go away
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/listen.ts#L336-L339](../../../../packages/sdk/src/listen.ts#L336-L339) - the Node close, which terminates each client and so gives it 1006"
  - "[code://packages/sdk/src/listen.ts#L188-L191](../../../../packages/sdk/src/listen.ts#L188-L191) - the Bun close, which closes each socket with no code"
  - "[code://packages/sdk/src/listen.ts#L243-L246](../../../../packages/sdk/src/listen.ts#L243-L246) - the Deno close, the same"
  - "[code://packages/sdk/src/listen.ts#L397](../../../../packages/sdk/src/listen.ts#L397) - `CLOSE_GRACE_MS`, the wait the HTTP close already uses"
---

## Objective

When the daemon stops, each WebSocket client gets a close frame with code 1001 and a reason, instead of a dropped connection.
A client can then tell a stopped daemon from a lost network.

## Files

- `UPDATE: packages/sdk/src/listen.ts:336-339` - the Node close sends 1001 to each client, and terminates the ones still open after `CLOSE_GRACE_MS`.
- `UPDATE: packages/sdk/src/listen.ts:188-191` - the Bun close sends 1001 and the reason.
- `UPDATE: packages/sdk/src/listen.ts:243-246` - the Deno close sends 1001 and the reason.
- `UPDATE: packages/sdk/test/listen.test.ts` - the cases below.

## Steps

1. Declare one constant for the reason, `the host is stopping`, beside `CLOSE_GRACE_MS`.
2. In the Node close, call `client.close(1001, reason)` for each client.
3. Start a timer of `CLOSE_GRACE_MS` that terminates each client still open, and clear it when the server closes.
4. In the Bun and Deno closes, pass 1001 and the reason to each `close`.
5. Add the test cases below.

## Validation

- `listen.test.ts`: call `close()` with a client open; the client gets code 1001 and the reason.
- `listen.test.ts`: keep a client that ignores the close frame; the listener drops it after `CLOSE_GRACE_MS`, and `close()` settles.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.
