---
title: pi looks in the folder first
status: done
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

### Built

- `lookupDirectories(directories, at)` in `catalog.ts` puts the recorded folder first, then the configured paths.
- It skips the recorded folder when it resolves to one of the paths.
- It skips the recorded folder when it is not a directory, so pi makes no session folder for it.
- `findSession` and `replayed` take `at` and look through `lookupDirectories`.
- `find` and `transcript` in `agent.ts` pass `at` through.
- `stateFile` and `delete` get the directory from the host, so they need no change.
- agent-pi has no `subagents`, and `piSession` replays from the folder its start gives.

### Validation

- `agent-pi-find.test.ts` has three new cases.
- `find` and `transcript` answer a session outside the paths through the recorded folder only.
- pi gets one lookup for a recorded folder that is one of the paths.
- A recorded folder that is gone falls back to the paths, and pi is never asked about it.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/agent-pi`, `packages/sdk` and `packages/server` passes 4150 tests in 215 files.
- `nested-start.test.ts` timed out once under load and passed alone with `--testTimeout 30000`.

### Seen and not done

- Without `sessionDir`, pi's `findById` makes its default session folder for each directory it is asked about.
- The configured paths still get that folder, as before this task.
