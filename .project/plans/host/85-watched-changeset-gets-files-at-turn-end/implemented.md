---
title: A watched changeset gets its files when a turn ends - implemented
date: 2026-10-13
refs:
  - git://8831b833
  - "[code://packages/sdk/src/host/facts.ts](../../../../packages/sdk/src/host/facts.ts)"
  - "[code://packages/sdk/test/changes-refresh.test.ts](../../../../packages/sdk/test/changes-refresh.test.ts)"
---

When a turn ends, a client that watches a changeset gets the files the turn changed on that changeset's channel. The Changes pane now shows a turn's files without a refresh by hand, as in VS Code.

## What was built

- [`code://packages/sdk/src/host/facts.ts`](../../../../packages/sdk/src/host/facts.ts) - `readFacts` calls `contentMoved` for each session in `toldIn(dir)` when the files moved, as `refreshWatched` does.
- [`code://packages/sdk/test/changes-refresh.test.ts`](../../../../packages/sdk/test/changes-refresh.test.ts) - three cases: a turn's end after a tool call, a turn's end with no tool call, and no changeset read when nothing is watched.

## Verified

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- vitest over sdk, server, agent-claude and agent-acp: 4341 tests pass in 241 files.
- With the old `readFacts`, the two turn cases fail with "the change never arrived".
- By hand, Softov, 2026-10-13: after a daemon restart, the Changes pane shows a turn's files when the turn ends.

## Departures from the plan

- none.

## Left for later

- A session in a machine takes the same `readFacts` call after `bringBackOf`, but no test or check by hand covers that path.
