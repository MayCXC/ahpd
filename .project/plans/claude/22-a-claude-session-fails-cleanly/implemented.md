---
title: A Claude session fails cleanly - implemented
date: 2026-10-11
refs:
  - git://534ac9ac
  - "[code://packages/agent-claude/src/session/asking.ts](../../../../packages/agent-claude/src/session/asking.ts)"
  - "[code://packages/agent-claude/src/session/failure.ts](../../../../packages/agent-claude/src/session/failure.ts)"
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
  - "[code://packages/agent-claude/src/spawn.ts](../../../../packages/agent-claude/src/spawn.ts)"
---

A Claude session that fails now says one plain sentence and leaves nothing open. A call that the SDK cancels takes its confirmation off the chat. A CLI that never starts names its errno and no path. A CLI that does not answer its handshake in 120 seconds fails the turn.

## What was built

- [`code://packages/agent-claude/src/session/asking.ts`](../../../../packages/agent-claude/src/session/asking.ts) - `canUseTool` reads the SDK's `signal`. An abort removes the entry and denies the call with `Cancelled`. One settle, `done`, removes the listener.
- [`code://packages/agent-claude/src/session/failure.ts`](../../../../packages/agent-claude/src/session/failure.ts) - `failureOf` gives "Claude Code process could not start" with the errno for the three classes of a CLI that never started. Other errors keep their message.
- [`code://packages/agent-claude/src/spawn.ts`](../../../../packages/agent-claude/src/spawn.ts) - a computer port that rejects gets its `syscall` named as a spawn, so the SDK files it as a failure to start.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - `bounded` puts the handshake timer on each query. `died` is the one path for a CLI that died, shared with the `consume` catch.
- The option `handshakeTimeoutMs` in `plugin.ts`, `claude.ts`, `context.ts` and the package README.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp`: 4300 of 4300 tests pass after the rebase onto main.
- New cases: `agent-claude-spawn-failure.test.ts`, `agent-claude-handshake.test.ts`, and four in `agent-claude-tool-input.test.ts`.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- Task 02's build named the `syscall` on every error from the computer port, so "There is no computer called `<id>`" became the short sentence too. The review kept that sentence, because it holds no path. Only a port that rejects gets the syscall named.
- Task 03 also changed `claude.ts` and the package README, which its Files line did not name.

## Left for later

- Nothing.
