---
title: pi looks in the folder first
status: todo
depends: [task-01-the-record-keeps-the-folder-and-the-host-passes-it.md]
layer: "packages/agent-pi"
refs:
  - "[code://packages/agent-pi/src/replay.ts#L196-L219](../../../../packages/agent-pi/src/replay.ts#L196-L219) - `replayed`, which calls `SessionManager.findById` in each configured path"
  - "[code://packages/agent-pi/src/catalog.ts#L294](../../../../packages/agent-pi/src/catalog.ts#L294) - pi's `findSession`, which asks the configured paths"
  - "[code://packages/agent-pi/src/agent.ts#L142-L148](../../../../packages/agent-pi/src/agent.ts#L142-L148) - `find` and `transcript`"
  - "[code://packages/agent-claude/src/catalog.ts#L54-L62](../../../../packages/agent-claude/src/catalog.ts#L54-L62) - `findSession`, the sibling this task mirrors"
---

## Objective

agent-pi finds and reads a session in the folder the host gives, before it looks in the configured paths, as agent-claude does.

## Files

- `UPDATE: packages/agent-pi/src/catalog.ts:294` - `findSession` takes the given folder first.
- `UPDATE: packages/agent-pi/src/replay.ts:196-219` - `replayed` takes the given folder first.
- `UPDATE: packages/agent-pi/src/agent.ts:142-148` - `find` and `transcript` pass `at.workingDirectory`.
- `UPDATE: packages/agent-pi/test/agent-pi-find.test.ts` - the cases below.

## Steps

1. Give the pi folder lookup an optional folder, and call `SessionManager.findById` there first.
2. Skip the given folder when it is one of the configured paths.
3. Pass `at?.workingDirectory` from `find` and `transcript`.
4. Add the test cases below.

## Validation

- `agent-pi-find.test.ts`: give a folder outside the paths, and `find` answers the pi session in it.
- `agent-pi-find.test.ts`: a given folder that does not exist falls back to the configured paths.
- Run `pnpm -s typecheck` and `pnpm -s boundary`; each exits 0.
- Run vitest on `packages/agent-pi` and `packages/sdk`; all pass.

## Resume

