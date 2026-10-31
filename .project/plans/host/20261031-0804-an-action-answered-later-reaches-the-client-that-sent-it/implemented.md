---
title: An action answered later reaches the client that sent it - implemented
date: 2026-10-31
refs:
  - "[code://packages/sdk/src/host.ts#L740-L799](../../../../packages/sdk/src/host.ts#L740-L799) - `applying`, `owed`, `answering`, `originOf` and `answeredBy`"
  - "[code://packages/sdk/src/types/session.ts#L12-L40](../../../../packages/sdk/src/types/session.ts#L12-L40) - `Emit` with an optional `Handed`, and `Handed`"
  - "[code://packages/sdk/src/sessions/nested.ts#L474-L544](../../../../packages/sdk/src/sessions/nested.ts#L474-L544) - `answering`, `unsent`, `deliver`, `carry` and `unanswered`"
  - "[code://packages/sdk/src/sessions/nested.ts#L927-L983](../../../../packages/sdk/src/sessions/nested.ts#L927-L983) - `pump` answering each client action from the envelope that names it"
---

A client's action that a backend answers after the host has applied it reaches the client that sent it, as its echo with its origin or as a rejection.
On a nested session the host inside answers each action the proxy carries in, a turn included, and its rejection is a rejection outside that changes nothing.
A message queued under the turn's check comes back with its origin on every backend.

## What was built

- [`code://packages/sdk/src/host/state.ts#L126-L135`](../../../../packages/sdk/src/host/state.ts#L126-L135) - `Dispatched`, a client's dispatch as an answer to it needs it: the sender, the channel, the action and the origin.
- [`code://packages/sdk/src/host.ts#L740-L799`](../../../../packages/sdk/src/host.ts#L740-L799) - `applying` and `owed` hold the `Dispatched`; `answering` finds the one an action says back, the dispatch being applied when the action is of its kind and about its turn or one owed under the turn or the queued message the action names; `originOf` is `answering` and letting go.
- [`code://packages/sdk/src/host.ts#L1195-L1196`](../../../../packages/sdk/src/host.ts#L1195-L1196) - `owe` owes the dispatch being applied, declared with `answering` at [`code://packages/sdk/src/host/context.ts#L332-L348`](../../../../packages/sdk/src/host/context.ts#L332-L348).
- [`code://packages/sdk/src/host/chatactions.ts#L1195-L1196`](../../../../packages/sdk/src/host/chatactions.ts#L1195-L1196) - a queued message is owed under its id, so the echo said after the turn's check carries the origin.
- [`code://packages/sdk/src/types/session.ts#L12-L40`](../../../../packages/sdk/src/types/session.ts#L12-L40) - `Emit` takes an optional `Handed`, a client's action held by the backend it was handed to, which refuses it through `refuse`.
- [`code://packages/sdk/src/types/agent.ts#L441-L452`](../../../../packages/sdk/src/types/agent.ts#L441-L452) - `Start.handed(action)`, the client's action `action` answers.
- [`code://packages/sdk/src/host/spawn.ts#L1199-L1222`](../../../../packages/sdk/src/host/spawn.ts#L1199-L1222) - `Start.handed`, whose origin stays with the host in `handedFrom`; refusing a turn or a queued message through it lets its sender and keys go, since no turn's end will.
- [`code://packages/sdk/src/host/spawn.ts#L1286-L1294`](../../../../packages/sdk/src/host/spawn.ts#L1286-L1294) - an action emitted with a `Handed` goes out with that client's origin, and [`code://packages/sdk/src/host/spawn.ts#L1646-L1676`](../../../../packages/sdk/src/host/spawn.ts#L1646-L1676) keeps the `Handed` of what waits behind a held turn end.
- [`code://packages/sdk/src/sessions/nested.ts#L474-L544`](../../../../packages/sdk/src/sessions/nested.ts#L474-L544) - the proxy holds each client action under the `clientSeq` its own client sent it with; `carry` takes the action's `Handed`; `unanswered` refuses what the host inside will not answer, from `fail`, `halt`, a reconnect and `close`.
- [`code://packages/sdk/src/sessions/nested.ts#L927-L983`](../../../../packages/sdk/src/sessions/nested.ts#L927-L983) - an envelope with the proxy's origin answers its action: a rejection is refused, neither reduced nor emitted, and a refused turn is let go of; an echo is emitted with the action's `Handed`.
- [`code://packages/sdk/src/sessions/nested.ts#L1257-L1381`](../../../../packages/sdk/src/sessions/nested.ts#L1257-L1381) - each session method a client action reaches carries it: a turn, a queued or steering message, a removal, a reorder, the draft, a resume, a stop, a confirmation, an answer's change, an MCP start and stop; the confirmation names the running inner turn.
- [`code://docs/sdk/AGENT.md`](../../../../docs/sdk/AGENT.md) - "Answering later".
- Cases in `nested-proxy.test.ts` (a draft, a queued message, a steering message and a turn the host inside refuses), `policy-checks.test.ts` (a message queued under the turn's check) and `host-senders.test.ts` (a turn a backend refuses through its `Handed`).

## Verified

- Each of the six new cases fails on `fff9c888` for the reason it names.
  The draft and the queued message on a nested session come back with no origin.
  The refused steering message comes out as one `chat/pendingMessageSet` with no origin and no rejection.
  The turn the host inside refused comes out as an accepted `chat/turnStarted`, carrying the client's origin through `owed`, with no rejection.
  The message queued under the turn's check comes back with no origin, and a backend has nothing to refuse a turn through.
- With the turn's refusal answered and the proxy's turn kept, the session's end failed the turn that never ran, with a `chat/error`; without the release in `Start.handed`, the senders map kept the refused turn.
- After the change, `nested-proxy`, `echo-origin`, `policy-checks`, `host-senders`, `presence`, `host-input`, `host-chats` and `nested-background-tasks` pass with 207 tests.
- `pnpm run typecheck` and `pnpm run boundary` pass.

## Departures from the plan

- none.

## Left for later

- A toggle and a config change on a nested session still come back without their origin, with the groups that rework them.
