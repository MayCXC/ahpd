---
title: agent-claude's tests build their paths
status: todo
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/customizations.ts#L55-L56](../../../../packages/agent-claude/src/session/customizations.ts#L55-L56) - `HOME`"
  - "[code://packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212](../../../../packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212) - `file:///dev/zero`"
---

## Objective

agent-claude reads the home folder from `os.homedir()`.
Its 17 failing tests build their paths and URIs the system's way.

## Files

- `UPDATE: packages/agent-claude/src/session/customizations.ts:55-56` - `os.homedir()` in place of `HOME`.
- `UPDATE: packages/agent-claude/test/customizations.test.ts:32-33` - the test sets the home folder for both systems.
- `UPDATE: packages/agent-claude/test` - each file in p1's failure list.

## Steps

1. Replace `process.env.HOME ?? ''` with `homedir()` from `node:os`.
2. Make `customizations.test.ts` set `USERPROFILE` beside `HOME`.
3. Read each failing test in p1's list, and find the literal that the code converts.
4. Build that value with `join`, `uriOf` or `localPath`.
5. Keep a literal that the code passes through unchanged.
6. Run the agent-claude tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass on Linux.
- The Windows job passes the agent-claude tests.

## Resume
