---
title: Each wire reports what it holds
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/types/rpc.ts#L17-L24](../../../../packages/sdk/src/types/rpc.ts#L17-L24) - `Wire`"
  - "[code://packages/sdk/src/listen.ts#L189-L195](../../../../packages/sdk/src/listen.ts#L189-L195) - the Bun wire"
  - "[code://packages/sdk/src/listen.ts#L248-L254](../../../../packages/sdk/src/listen.ts#L248-L254) - the Deno wire"
  - "[code://packages/sdk/src/listen.ts#L341-L347](../../../../packages/sdk/src/listen.ts#L341-L347) - the Node `ws` wire"
  - "[code://packages/sdk/src/listen.ts#L526-L535](../../../../packages/sdk/src/listen.ts#L526-L535) - the stdio wire"
  - npm://@types/ws@8.18.1 - `WebSocket.bufferedAmount`
  - https://bun.sh/docs/api/websockets - `getBufferedAmount`
---

## Objective

Each listener's wire reports how many bytes it still holds for its client.
A wire with no queue, such as the in-process pair, reports nothing.

## Files

- `UPDATE: packages/sdk/src/types/rpc.ts:17-24` - an optional `buffered(): number` on `Wire`.
- `UPDATE: packages/sdk/src/listen.ts:189-195` - Bun: `ws.getBufferedAmount()`.
- `UPDATE: packages/sdk/src/listen.ts:248-254` - Deno: `socket.bufferedAmount`.
- `UPDATE: packages/sdk/src/listen.ts:341-347` - Node `ws`: `socket.bufferedAmount`.
- `UPDATE: packages/sdk/src/listen.ts:526-535` - stdio: `output.writableLength`.
- `UPDATE: packages/sdk/test/listen.test.ts` - the Node wire reports its queue.

## Steps

1. Add `buffered` to `Wire` as optional, with a comment that says what it counts.
2. Add `buffered` to each of the four wires in `listen.ts`.
3. Check the Bun and Deno names against their docs, because their types are not installed.
4. Leave the in-process pair without `buffered`.
5. Write the test.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: a Node socket that does not read reports a growing `buffered`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume
