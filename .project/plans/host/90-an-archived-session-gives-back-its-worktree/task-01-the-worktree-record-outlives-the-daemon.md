---
title: The worktree record outlives the daemon
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/sessions.ts#L260-L268](../../../../packages/sdk/src/types/sessions.ts#L260-L268) - `remoteOrigin`, the optional store field to mirror"
  - "[code://packages/sdk/src/sessions.ts#L330-L390](../../../../packages/sdk/src/sessions.ts#L330-L390) - `Row`, `empty` and `Saved`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L887-L955](../../../../packages/sdk/src/host/lifecycle.ts#L887-L955) - `isolated`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L218-L247](../../../../packages/sdk/src/host/lifecycle.ts#L218-L247) - `teardown`"
---

## Objective

The session store keeps each session's worktree record.
Every reader of the `worktrees` map falls back to the stored record.

## Files

- `UPDATE: packages/sdk/src/types/sessions.ts:260-268` - add `StoredWorktree` and the optional `worktree?(id)` and `setWorktree?(id, value)`, beside `remoteOrigin`.
- `UPDATE: packages/sdk/src/sessions.ts:116-117` - the memory store keeps the field, as it keeps `remoteOrigin`.
- `UPDATE: packages/sdk/src/sessions.ts:330-390` - `Row`, `empty` and `Saved` carry `worktree`.
- `UPDATE: packages/sdk/src/sessions.ts:516-525` - the file store writes it.
- `UPDATE: packages/sdk/src/sessions.ts:660-670` - the file store reads it back, and ignores a value that is not a record of strings.
- `UPDATE: packages/sdk/src/sessions.ts:690-700` - the file wrapper passes it through `touched`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:952` - `isolated` also calls `kept.setWorktree`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:233-236` - `teardown` reads the map, then the store, and clears both.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:578-582` - the move clears the stored record with the map entry.
- `UPDATE: packages/sdk/src/host/vscodemethods.ts:325` - clear the stored record with the map entry.
- `UPDATE: packages/sdk/src/host/vscodemethods.ts:359` - the same.
- `UPDATE: packages/sdk/test/sessions.test.ts` - the store cases in Validation.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - the host case in Validation.

## Steps

1. Write the tests first.
2. Add the type and the two optional methods to the store interface.
3. In both stores, keep, save and load the field the same way as `remoteOrigin`.
4. Add `worktreeOf(uri)` to the context: the map entry, else the stored record.
5. Use `worktreeOf` in `teardown`. Clear the stored record at each place that deletes the map entry.

## Validation

- `sessions.test.ts`: write a worktree record, reopen the file store, and read the same record back.
- `sessions.test.ts`: a malformed stored value reads back as nothing.
- `worktrees.test.ts`: start a second host on the same store, delete the session, and see the clean tree go.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
