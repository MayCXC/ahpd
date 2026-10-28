---
title: A `!` command's turn survives a restart - implemented
date: 2026-10-27
refs:
  - "[code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts)"
  - "[code://packages/agent-cofold/src/turns.ts](../../../../packages/agent-cofold/src/turns.ts)"
  - "[code://packages/agent-pi/src/session.ts](../../../../packages/agent-pi/src/session.ts)"
---

A `!` command's turn is kept as a local turn of its chat.
Every read of a transcript puts it back after the turn it followed.
After a restart, a Claude, cofold or pi chat shows its `!` turns where they were, and their terminals open.
A truncation or a fork at one goes to the backend at the turn before it.

## What was built

- [p1](../130-p1-the-host-keeps-a-commands-turn/implemented.md) - the host keeps the local turns, puts them back at each transcript read, and carries them through a cut, a dispose and a move.
- [p2](../130-p2-a-cofold-turn-keeps-its-id/implemented.md) - a cofold turn is stored under the id its client gave it.
- [p3](../130-p3-a-pi-turn-names-its-entry/implemented.md) - a pi turn names its prompt's entry through `onTurnRecorded`.

## Verified

- The cases of each child plan fail on the code before this plan, and pass on it.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass, and so do the sdk, agent-cofold and agent-pi suites but for `nested-start`, which times out on upstream's main here too.

## Departures from the plan

- None.

## Left for later

- An ACP chat read back after a restart is its server's replay, with new turn ids on each load.
  A local turn after one of its turns is dropped, as the plan's answer says.
