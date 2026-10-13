---
title: A late problem line goes to the log
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/plugins.ts#L856-L897](../../../../packages/server/src/plugins.ts#L856-L897) - `told` and the `problem` callback"
  - "[code://packages/server/test/plugin-load.test.ts](../../../../packages/server/test/plugin-load.test.ts) - the load cases to extend"
---

## Objective

A `problem` line that a plugin says after its load answered goes to the daemon log at once.
A line said during the load stays in the load's answer, as today.

## Files

- `UPDATE: packages/server/src/plugins.ts:856-941` - `problem` writes a line to the log after the load answered.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* row.
2. Find where the daemon writes the problems of a load, and pass that writer to the load.
3. Mark the load as answered just before each of its three returns.
4. In `problem`, push to `told` before that mark, and write to the log after it.
5. Add the test cases below.

## Validation

- `plugin-load.test.ts`: a line said during `apply` is in the load's problems and is not logged twice.
- `plugin-load.test.ts`: a line said after `apply` returned goes to the log.
- By hand: a bot file edited by hand to a new owner gives a line in the daemon log.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

