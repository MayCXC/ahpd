---
title: Mode, link and worktree tests
status: todo
depends: [task-01-one-helper-names-a-posix-only-case.md]
layer: sdk, agent-claude
refs:
  - "[code://packages/sdk/test/policies.test.ts#L332](../../../../packages/sdk/test/policies.test.ts#L332) - `chmodSync`"
  - "[code://packages/sdk/test/host-trust.test.ts#L479](../../../../packages/sdk/test/host-trust.test.ts#L479) - `symlinkSync`"
  - "[code://packages/sdk/src/repo/worktrees.ts#L442](../../../../packages/sdk/src/repo/worktrees.ts#L442) - a junction on Windows"
---

## Objective

A test that checks a POSIX file mode, or makes a symbolic link, skips on Windows with its reason.
A worktree test that fails on a path gets p2's fix and runs.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's list that fails on a mode, a link or a worktree.
- `UPDATE: packages/agent-claude/test` - the same, for agent-claude.

## Steps

1. Read each worktree failure in p1's list, and record its cause in Resume.
2. Fix a worktree test that fails on a path, as p2 does.
3. Skip a case that checks a file mode with `it.skipIf(!posix)`, and give the reason.
4. Make a test link a folder with `junction` on Windows, as `worktrees.ts` does.
5. Skip a case that needs a file link, and give the reason.
6. Run the sdk and agent-claude tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The Windows job passes these files, and its log counts the skips.
- The Linux tests skip nothing new.

## Resume
