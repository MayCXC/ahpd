---
title: Only the echo carries the origin - implemented
date: 2026-10-30
refs:
  - git://764effd7 - the change
  - "[code://packages/sdk/src/host.ts#L719-L784](../../../../packages/sdk/src/host.ts#L719-L784) - `applying`, `owed`, `originOf` and `answeredBy`"
  - "[code://packages/sdk/src/host.ts#L849-L861](../../../../packages/sdk/src/host.ts#L849-L861) - `dispatch` takes an origin named, or the echo's, and a turn's end clears what it owes"
---

A client's own action comes back carrying its origin, whether the host says it while the dispatch is applied or after an await.
Every other action the host sends carries none, so a client never takes a host action for its own.

## What was built

- [`code://packages/sdk/src/host.ts#L719-L784`](../../../../packages/sdk/src/host.ts#L719-L784) - `applying` holds the dispatch's origin, type and turn. `originOf` gives the origin to its echo alone, or to an echo `owed` keeps by turn id.
- [`code://packages/sdk/src/host.ts#L849-L861`](../../../../packages/sdk/src/host.ts#L849-L861) - `dispatch` uses an origin its caller names, and otherwise asks `originOf`. A turn's end clears the start and the stop it still owed.
- [`code://packages/sdk/src/host.ts#L975-L1012`](../../../../packages/sdk/src/host.ts#L975-L1012) - `refuse` and `echoTo` mark the dispatch answered, so nothing later takes its origin.
- [`code://packages/sdk/src/host.ts#L1180`](../../../../packages/sdk/src/host.ts#L1180) - `owe`, which the context declares at [`code://packages/sdk/src/host/context.ts#L322-L338`](../../../../packages/sdk/src/host/context.ts#L322-L338).
- [`code://packages/sdk/src/host/chatactions.ts#L389-L406`](../../../../packages/sdk/src/host/chatactions.ts#L389-L406) - a turn on a sleeping session is applied again through `conn.applyNow` once awake. The wake is bounded by the host's wait limit, and later dispatches wait behind it.
- [`code://packages/sdk/src/host/chatactions.ts#L529`](../../../../packages/sdk/src/host/chatactions.ts#L529) - a turn is owed before `beginOrRun`.
- [`code://packages/sdk/src/host/chatactions.ts#L1117-L1131`](../../../../packages/sdk/src/host/chatactions.ts#L1117-L1131) - a stop is owed under the turn it stops, named or not.
- [`code://packages/sdk/src/host/chatactions.ts#L1514`](../../../../packages/sdk/src/host/chatactions.ts#L1514) and [`code://packages/sdk/src/host/actions.ts#L394`](../../../../packages/sdk/src/host/actions.ts#L394) - a chat started over and a daemon key's echo name their origin.
- [`code://packages/sdk/test/echo-origin.test.ts`](../../../../packages/sdk/test/echo-origin.test.ts) - the echo and what it causes, a backend that begins late, a machine, a stop, a stop with no turn named.
- One case each in `session-wake`, `policy-checks`, `host-snapshots`, `host-chats`, `root-config` and `nested-proxy`.

## Verified

- Each new case failed on `920d154a` for the reason it names.
  On a first turn, sixteen envelopes carried the client's `clientSeq`; each other case found no origin on its echo.
- The machine case also checks that the port was asked to follow the machine, so it ran the machine's wait.
- After the change, 18 files pass with 1202 tests: the 7 touched test files and 11 that assert an origin or drive the wake.
- `pnpm run typecheck` and `pnpm run boundary` pass.
- No other test file ran.

## Departures from the plan

- none.

## Left for later

- A client action other than a turn or a stop, sent to a nested session, still comes back without its origin.
  The proxy says the inner host's echo through `Start.emit`, which names no origin.
- The per-key echoes of `session/configChanged` each carry the origin of the one dispatch that caused them.
