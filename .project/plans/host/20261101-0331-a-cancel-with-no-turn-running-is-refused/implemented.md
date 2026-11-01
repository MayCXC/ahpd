---
title: A cancel with no turn running is refused - implemented
date: 2026-11-01
refs:
  - git://d5674ef7
  - "[code://packages/sdk/src/host/chatactions.ts](../../../../packages/sdk/src/host/chatactions.ts)"
  - "[code://packages/sdk/src/types/session.ts](../../../../packages/sdk/src/types/session.ts)"
  - "[code://packages/bot/src/chat.ts](../../../../packages/bot/src/chat.ts)"
---

A client that stops a chat with no turn running is refused, as the protocol's validation table has a server reject it.
That holds on a lead chat and on the chat of a worker that has ended.
A session asleep in the catalogue gets the refusal and stays asleep.
A stop that names another turn than a lead chat's running turn stays an answer to its sender alone.
A stop of the running turn reaches every backend under that turn's id, a stop that names no turn included.

## What was built

- [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts) - the stop reads the running turn of the chat it names, the worker's own on a worker chat.
- With none running, the stop is refused with `Nothing is running on <chat> to stop`.
- The same file refuses a stop on a session asleep in the catalogue before the wake, and hands `cancel` the running turn's id.
- [`code://packages/sdk/src/types/session.ts`](../../../../packages/sdk/src/types/session.ts) - `cancel` says the host calls it while the chat runs a turn, with that turn's id.
- [`code://packages/bot/src/chat.ts`](../../../../packages/bot/src/chat.ts) - the bot's stop ends the open turn the host names, as pi, ACP and cofold read theirs.
- [`code://packages/sdk/test/ahp-test-cases.test.ts`](../../../../packages/sdk/test/ahp-test-cases.test.ts) - `REFUSALS` holds the refusal of `chat/turnCancelled`, with the validation row as its source.
- [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md), [`code://docs/sdk/AGENT.md`](../../../../docs/sdk/AGENT.md) and [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md) - when a stop is refused, and what `cancel` is handed.
- [`code://.project/specs/sessions-and-chats.md`](../../../specs/sessions-and-chats.md) - a stop with no turn running is refused, and a stop on an ended worker's chat with it.

## Verified

- On `c7899eff` each new case fails for the reason it names.
- `host-catalogue.test.ts`: the stop with no turn running came back with no `rejectionReason`.
- `subagent-chat.test.ts`: the stop on the ended worker's chat drew no refusal.
- `session-wake.test.ts`: the stop on a sleeping session drew no refusal.
- `agent-acp-turn.test.ts` and `agent-cofold-turn.test.ts`: the turn ran on after a stop that names no turn, "still waiting after 2000 tries" and "after 400 tries".
- After the change all of them pass, and the seven touched files pass with 848 tests.
- Case 015 stops a turn the host's chat is not running, and is refused through the host for the new row's reason.
- With the row renamed, case 015 fails with "chat/turnCancelled refused for a reason a source allows", so the row carries the case.
- `pnpm run typecheck` and `pnpm run boundary` report no errors.
- The full `pnpm run test:unit --maxWorkers=2` passes 7350 tests and fails 4, none of them a stop.
- `plugin-load` and `tasks-harnesses` timed out at 5 s under the run's load, and each passes whole when run alone.
- `nested-start`'s first case takes about 5 s of its 5 s here, and fails on `c7899eff` alone in 3 of 3 runs.
- `users-gate-commands`' usage pools case reads the current month, fails the same on `c7899eff`, and is fixed on its own branch, `usage/20261101-0158-the-usage-pools-case-holds-its-clock`.

## Departures from the plan

- Task 03 - `AGENT.md` and `PLUGINS.md` carry the stop's contract as well, beyond the Files list, since a backend's author reads it there.

## Left for later

- None.
