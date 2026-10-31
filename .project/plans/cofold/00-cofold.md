---
title: cofold - what exists today
domain: cofold
revalidated: 2026-10-31
---

`packages/agent-cofold` (`@ahpd/agent-cofold`) is the cofold backend: it implements the `Agent` interface of `packages/sdk` over `run()` and the session store of `@cofold/agents`, in the daemon's process.
A run's events become chat actions, and cofold's store is the conversation.
Plans before this domain existed are in `plugin/`, such as [63](../plugin/63-cofold-lists-models-by-provider/plan.md).

## Packages

- [`code://packages/agent-cofold`](../../../packages/agent-cofold) - the files:
  - `src/plugin.ts` - the plugin.
  - `src/agent.ts` - the `Agent`.
  - `src/session.ts` - a session.
  - `src/turns.ts` - a turn's start.
  - `src/runs.ts` - a run's events, its ending and the cuts.
  - `src/mapping.ts` - the event translation.
  - `src/pauses.ts` - a run that waits on a person.
  - `src/transcript.ts` - the turns read back.

## Contracts

- [`code://packages/sdk/src/types/agent.ts`](../../../packages/sdk/src/types/agent.ts) - `Agent` and `Start`, the only contract this package shares with the host.
- [`code://packages/sdk/src/types/session.ts`](../../../packages/sdk/src/types/session.ts) - `Session`, including the optional `forkPoint`, `endPoint` and `resume`.
- npm://@cofold/agents@^0.4.0 - `run`, `resume`, and `store.sessions` with `truncate`, `fork` and `delete`.

## Runtime path

```
cofoldAgent() -> Agent.create(start) -> cofold session -> begin() -> openTurn: chat/turnStarted
  -> run({ agent, session, input, messageId: turnId }) -> RunEvent -> runs.ts apply() -> mapping.ts -> chat/* actions
  -> run.finished -> settleTurn, points.set(turn, lastMessageId)
```

## Tests

- [`code://packages/agent-cofold/test/agent-cofold-turn.test.ts`](../../../packages/agent-cofold/test/agent-cofold-turn.test.ts) - the turn lifecycle, a failed turn and the session status.
- [`code://packages/agent-cofold/test/agent-cofold-fork.test.ts`](../../../packages/agent-cofold/test/agent-cofold-fork.test.ts) - a fork and a rewind through the store's cut.
- [`code://packages/agent-cofold/test/agent-cofold-store.test.ts`](../../../packages/agent-cofold/test/agent-cofold-store.test.ts) - the store a session reads and writes.
