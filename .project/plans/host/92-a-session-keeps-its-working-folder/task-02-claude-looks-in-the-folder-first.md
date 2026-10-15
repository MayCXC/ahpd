---
title: Claude looks in the folder first
status: todo
depends: [task-01-the-record-keeps-the-folder-and-the-host-passes-it.md]
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/catalog.ts#L54-L62](../../../../packages/agent-claude/src/catalog.ts#L54-L62) - `findSession`, which asks the configured paths only"
  - "[code://packages/agent-claude/src/claude.ts#L498](../../../../packages/agent-claude/src/claude.ts#L498) - `find`"
  - "[code://packages/agent-claude/src/claude.ts#L524-L540](../../../../packages/agent-claude/src/claude.ts#L524-L540) - `transcript` and `subagents`"
---

## Objective

agent-claude finds and reads a session in the folder the host gives, before it looks in the configured paths.
A bot session, a subfolder session and a worktree session open after a restart.

## Files

- `UPDATE: packages/agent-claude/src/catalog.ts:54-62` - `findSession` takes the given folder first, then the configured paths.
- `UPDATE: packages/agent-claude/src/claude.ts:498` - `find` passes `at.workingDirectory`.
- `UPDATE: packages/agent-claude/src/claude.ts:524-540` - `transcript` and `subagents` pass `at.workingDirectory`.
- `UPDATE: packages/agent-claude/test/agent-claude-find.test.ts` - the cases below.

## Steps

1. Give `findSession` an optional folder, and ask `getSessionInfo` there before the configured paths.
2. Skip the given folder when it is one of the configured paths, so `getSessionInfo` reads each folder once.
3. Pass `at?.workingDirectory` from `find`, `transcript` and `subagents`.
4. Add the test cases below.

## Validation

- `agent-claude-find.test.ts`: give a folder outside the paths, and `find` answers the session in it.
- `agent-claude-find.test.ts`: give no folder, and `find` answers nothing for the same session.
- `agent-claude-find.test.ts`: a given folder that does not exist falls back to the configured paths.
- Run `pnpm -s typecheck` and `pnpm -s boundary`; each exits 0.
- Run vitest on `packages/agent-claude` and `packages/sdk`; all pass.
- By hand on a test daemon: make a bot, restart, and subscribe to its session. The snapshot comes back.

## Resume

