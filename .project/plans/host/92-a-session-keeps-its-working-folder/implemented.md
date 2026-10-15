---
title: A session keeps its working folder, and the backends find it there after a restart - implemented
date: 2026-10-15
refs:
  - git://54db6c7e
  - "[code://packages/sdk/src/sessions.ts](../../../../packages/sdk/src/sessions.ts)"
  - "[code://packages/agent-claude/src/catalog.ts](../../../../packages/agent-claude/src/catalog.ts)"
  - "[code://packages/agent-pi/src/catalog.ts](../../../../packages/agent-pi/src/catalog.ts)"
---

A session that ran outside the configured paths opens again after a daemon restart.
The session record keeps the working folder, and agent-claude and agent-pi look for the session there first.
Examples are a bot's session under `~/.bots`, a session in a subfolder of a path, and a worktree outside the paths.

## What was built

- [`code://packages/sdk/src/sessions.ts`](../../../../packages/sdk/src/sessions.ts) - `Row` and `Saved` keep `workingDirectory`, and the store reads and writes it.
- [`code://packages/sdk/src/types/agent.ts`](../../../../packages/sdk/src/types/agent.ts) - `SessionAt`, the optional last argument `at` of `find`, `transcript` and `subagents`.
- [`code://packages/sdk/src/host/history.ts`](../../../../packages/sdk/src/host/history.ts) - `sessionAt(id)` reads the record, and `findOf`, `past` and `restoredSubagents` pass it.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - `keepFolder` records the folder of a started session.
- [`code://packages/agent-claude/src/catalog.ts`](../../../../packages/agent-claude/src/catalog.ts) - `findSession` asks the given folder first, when its project folder holds the transcript.
- [`code://packages/agent-pi/src/catalog.ts`](../../../../packages/agent-pi/src/catalog.ts) - `lookupDirectories` puts the given folder first, when it exists.
- [`code://docs/AGENT.md`](../../../../docs/AGENT.md) - the `Agent` table names `at`.

## Verified

- `host-past-open.test.ts` has four new cases, and `sessions.test.ts` has one.
- `agent-claude-find.test.ts` has six new cases, and `agent-pi-find.test.ts` has three.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude`, `packages/agent-acp` and `packages/agent-pi` passes.
- `nested-proxy.test.ts` failed once under load, and it passed alone three times.
- A subfolder of a path is a folder outside the paths, and the new cases with such a folder cover it.
- By hand, a test daemon on port 39433 opened a session in a bot folder after a restart.
- The same session with no folder in its record gave -32001.

## Departures from the plan

- agent-claude asks a folder outside the paths only when the transcript is in its project folder. Otherwise the SDK runs `git worktree list` in that folder.
- agent-pi asks a folder only when it exists. Otherwise pi creates a project folder for it.
- The bot session in the check by hand had a written transcript, because a real turn needs the Claude API.

## Left for later

- See [deferred.md](deferred.md).
