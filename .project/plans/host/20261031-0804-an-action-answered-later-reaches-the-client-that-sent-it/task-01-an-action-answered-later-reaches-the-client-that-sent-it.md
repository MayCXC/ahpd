---
title: An action answered later reaches the client that sent it
status: todo
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host.ts#L748-L784](../../../../packages/sdk/src/host.ts#L748-L784) - `owed` and `originOf`"
  - "[code://packages/sdk/src/sessions/nested.ts#L492-L500](../../../../packages/sdk/src/sessions/nested.ts#L492-L500) - `deliver`"
  - "[code://packages/sdk/src/sessions/nested.ts#L870-L924](../../../../packages/sdk/src/sessions/nested.ts#L870-L924) - `pump`"
  - "[code://packages/sdk/src/host/spawn.ts#L1196-L1265](../../../../packages/sdk/src/host/spawn.ts#L1196-L1265) - a backend's emit"
---

## Objective

A client action a backend answers after the host has applied it is answered to that client: its echo carries the client's origin, and a refusal is a rejection to that client that changes nothing.
The proxy for a nested session answers each client action from what the host inside says, a turn included, and a message queued under the turn's check is owed its echo on every backend.

## Files

- `UPDATE: packages/sdk/src/host/state.ts:119-123` - `Dispatched`, a client's dispatch as an answer to it needs it.
- `UPDATE: packages/sdk/src/host.ts:747-784` - `applying` and `owed` hold the `Dispatched`; `answering` finds the one an action says back; `originOf` and `answeredBy` read a queued message's id.
- `UPDATE: packages/sdk/src/host.ts:1180` - `owe` owes the dispatch being applied; `answering` on the context.
- `UPDATE: packages/sdk/src/host/context.ts:332-338` - `owe` and `answering` declared.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1190-1195` - a queued message is owed under its id.
- `UPDATE: packages/sdk/src/types/session.ts:12-19` - `Emit` takes an optional `Handed`, and `Handed` says what it is.
- `UPDATE: packages/sdk/src/types/agent.ts:439-440` - `Start.handed(action)`.
- `UPDATE: packages/sdk/src/types/index.ts:19` - `Handed` exported beside `Emit`.
- `UPDATE: packages/sdk/src/host/spawn.ts:1196-1265` - `Start.handed`, whose refusal lets a refused turn's sender go, and the emit giving an action emitted with a `Handed` its client's origin.
- `UPDATE: packages/sdk/src/host/spawn.ts:1616-1647` - the held turn end keeps each action's `Handed`.
- `UPDATE: packages/sdk/src/sessions/nested.ts:470-500` - `answering`, `unsent`, `deliver` holding the `Handed`, `carry`, and `unanswered`.
- `UPDATE: packages/sdk/src/sessions/nested.ts:509-579` - `fail`, `halt` and a reconnect refuse what will not be answered.
- `UPDATE: packages/sdk/src/sessions/nested.ts:870-924` - `pump` pairs an answer with its `Handed`; a rejection is refused, changes nothing, and lets go of a refused turn.
- `UPDATE: packages/sdk/src/sessions/nested.ts:1190-1321` - each session method a client action reaches carries it, and the confirmation names its turn.
- `UPDATE: docs/sdk/AGENT.md` - a session that answers later.
- `UPDATE: packages/sdk/test/nested-proxy.test.ts` - a draft, a queued message, a refused steering message and a refused turn on a nested session.
- `UPDATE: packages/sdk/test/policy-checks.test.ts` - a message queued under the turn's check.
- `UPDATE: packages/sdk/test/host-senders.test.ts` - a turn a backend refuses through its `Handed` lets its sender go.

## Steps

1. Write the cases and run them on `fff9c888` to see the origin missing, the rejection emitted as state, and the refused turn unanswered.
2. Hold the whole dispatch in `applying` and in `owed`, and owe a queued message under its id.
3. Find the dispatch an action says back with `answering`, as `originOf` finds the origin.
4. Add `Handed` and `Start.handed(action)`, and the optional `Handed` on `Emit`.
5. Give an action emitted with a `Handed` its client's origin, through the held turn end too, and let a refused turn's sender and keys go.
6. Hold each `Handed` in the proxy under the `clientSeq` of its dispatch inside, and answer it from the envelope that names it.
7. Refuse what the host inside will not answer when it ends, goes or is closed.
8. Say how a session answers later in AGENT.md.

## Validation

- The new cases in `nested-proxy.test.ts`, `policy-checks.test.ts` and `host-senders.test.ts` fail before the change and pass after it.
- `nested-proxy`, `echo-origin`, `policy-checks`, `host-senders`, `presence`, `host-input`, `host-chats` and `nested-background-tasks` pass.
- `pnpm run typecheck` and `pnpm run boundary` report no errors.

## Resume
