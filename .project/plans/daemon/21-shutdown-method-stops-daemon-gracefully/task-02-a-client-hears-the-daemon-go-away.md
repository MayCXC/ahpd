---
title: A client hears the daemon go away
status: done
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

## Resume

Implemented and reviewed 2026-10-15.

### Built

- `packages/sdk/src/listen.ts`: `GOING_AWAY` (1001) and `STOPPING` (`the host is stopping`) are declared beside `CLOSE_GRACE_MS`.
- `packages/sdk/src/listen.ts`: the Node close calls `client.close(GOING_AWAY, STOPPING)` for each client.
- `packages/sdk/src/listen.ts`: a `CLOSE_GRACE_MS` timer then terminates each client still open, and the `ws` server close clears it.
- The `ws` server close fires only when every client is gone, so `close()` still settles after the HTTP close.
- `packages/sdk/src/listen.ts`: the Bun and Deno closes pass `GOING_AWAY` and `STOPPING` to each socket.
- `packages/sdk/src/listen.ts`: the `BunSocket`, `DenoSocket` and `NodeServer` shapes take the code and the reason.
- `packages/sdk/test/listen.test.ts`: a `ws` client open at `close()` gets 1001 and the reason.
- `packages/sdk/test/listen.test.ts`: a raw socket does the handshake by hand and never answers the close frame.
- That test reads 1001 and the reason from the frame, and finds the socket still open at 1900 ms on fake timers.
- At 2100 ms the listener drops it, and `close()` settles.

### Validation

- Against the old source, both new tests fail.
- The first sees code 1006 with an empty reason.
- The second times out, because no close frame comes.
- With the change, `listen.test.ts` passes 17 of 17.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`: 248 files and 4493 tests pass.
- No doc describes how the listener closes a WebSocket, so no doc changed.

### Seen and not done

- The Bun and Deno closes are not tested, because the suite runs on Node only.
- The Bun and Deno closes do not drop a client that ignores the close frame; each runtime's own stop handles it as before.
- Checked by hand on Linux, 2026-10-15: after `shutdown`, the caller and a second client each get 1001 and `the host is stopping`.
