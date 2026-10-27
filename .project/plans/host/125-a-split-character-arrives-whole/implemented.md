---
title: A split character arrives whole - implemented
date: 2026-10-27
refs:
  - "[code://packages/sdk/src/machines/terminals.ts](../../../../packages/sdk/src/machines/terminals.ts)"
  - "[code://packages/sdk/test/pty.test.ts](../../../../packages/sdk/test/pty.test.ts)"
---

A shell on pipes reaches the client with each UTF-8 character whole, also when its bytes arrive in two reads.

## What was built

- [`code://packages/sdk/src/machines/terminals.ts`](../../../../packages/sdk/src/machines/terminals.ts) - each pipe decodes with `setEncoding('utf8')`, and its data handler takes the string.
- [`code://packages/sdk/test/pty.test.ts`](../../../../packages/sdk/test/pty.test.ts) - the case for `é` written as two bytes in two writes.
- [`code://docs/sdk/TERMINALS.md`](../../../../docs/sdk/TERMINALS.md) - "Pipes, or a pseudoterminal" says how the output is decoded.

## Verified

- The new case passes, and it fails on the store before this change.
- A run of the store gives `é` on Node 24.21.0 and on Bun 1.4.4, where the store before this change gives two replacement characters.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.

## Departures from the plan

- none.

## Left for later

- none.
