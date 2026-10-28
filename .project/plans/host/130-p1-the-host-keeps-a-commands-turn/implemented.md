---
title: The host keeps a command's turn for its chat - implemented
date: 2026-10-27
refs:
  - "[code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts)"
  - "[code://packages/sdk/test/host-local-turns.test.ts](../../../../packages/sdk/test/host-local-turns.test.ts)"
  - "[code://packages/sdk/test/localturns.test.ts](../../../../packages/sdk/test/localturns.test.ts)"
---

When a `!` command's turn ends, the host keeps it as a local turn of its chat, in the session's folder.
Every read of a transcript puts the chat's local turns back after the turns they followed.
So a `!` turn and its terminal are there after a restart.
A truncation or a fork at a local turn goes to the backend at the turn before it.
Local turns go with their chat, move with it, and a fork keeps the ones it copies.

## What was built

- [`code://packages/sdk/src/host/localturns.ts`](../../../../packages/sdk/src/host/localturns.ts) - the area: one file per local turn, its anchor, the interleave, the turn a cut goes to, forget, copy and move.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - the end of a command turn keeps it, and `onTurnRecorded` gives the area the turn's transcript id.
- [`code://packages/sdk/src/host/history.ts`](../../../../packages/sdk/src/host/history.ts), [`code://packages/sdk/src/host/sleep.ts`](../../../../packages/sdk/src/host/sleep.ts), [`code://packages/sdk/src/host/snapshots.ts`](../../../../packages/sdk/src/host/snapshots.ts), [`code://packages/sdk/src/host/outputs.ts`](../../../../packages/sdk/src/host/outputs.ts) - the five transcript reads go through `transcriptOf`.
- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - a truncation at a local turn rewinds at the turn before it, and forgets the local turns it drops.
- [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts) - a fork goes to the turn before a local turn and copies the local turns; a move and a dispose take them.

## Verified

- `packages/sdk/test/host-local-turns.test.ts` holds 15 cases through a host, and each fails on the code before this plan, at `58f57736`.
- `packages/sdk/test/localturns.test.ts` holds 4 cases on the area alone.
- The Claude case anchors a `!` turn to the CLI's uuid of the turn before it.
- In the same case, a restarted host shows the turn after that turn, and opens its terminal.
- A transcript that holds a local turn already keeps it in its place, and a later local turn of the same anchor comes after it.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass, and so does the sdk suite but for `nested-start`, which times out on upstream's main here too.

## Departures from the plan

- None.

## Left for later

- None.
