---
title: An auto-archived merged session is deleted
status: todo
depends: [task-01-an-inactive-merged-session-is-archived.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L498-L560](../../../../packages/sdk/src/host/lifecycle.ts#L498-L560) - `removeSession`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L465-L476](../../../../packages/sdk/src/host/lifecycle.ts#L465-L476) - `mayDispose`, which passes when nobody is acting"
  - "git://github.com/microsoft/vscode@b5db36cf258 - `agentHostSessionLifecycle.ts` delete candidates"
---

## Objective

The pass deletes a session it archived, once the delete days have passed and its tree is gone.

## Files

- `UPDATE: packages/sdk/src/host/merged.ts` - the delete half of the pass.
- `UPDATE: packages/sdk/test/host-merged.test.ts` - the cases in Validation.

## Steps

1. Write the tests first.
2. Take as a candidate only an archived session with `autoArchivedAt` at or before now less the delete days.
3. Ask for its related pull requests again, and skip it unless they are complete.
4. Skip it while its stored worktree path exists on disk.
5. Check the session again just before the delete: still archived, still idle, the same time stored.
6. Delete it through `removeSession` with no acting principal, and log the session and its pull requests.

## Validation

- `host-merged.test.ts`: with the delete key at 30, the pass deletes a session it archived 31 days ago. Every client gets `root/sessionRemoved`.
- `host-merged.test.ts`: the pass keeps a session of the same age that a person archived.
- `host-merged.test.ts`: the pass keeps a session whose dirty tree stayed on disk.
- `host-merged.test.ts`: the pass keeps a session that a person unarchived and archived again.
- `host-merged.test.ts`: the delete key at `0` deletes nothing.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
