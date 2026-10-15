---
title: A daemon key decides what archive does with a dirty tree
status: done
depends: [task-02-archive-shelves-the-tree-and-unarchive-restores-it.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/worktrees.ts#L128-L143](../../../../packages/sdk/src/types/worktrees.ts#L128-L143) - `dirty` and `remove` on the `Worktrees` port"
  - "[code://packages/sdk/src/repo/worktrees.ts#L182-L202](../../../../packages/sdk/src/repo/worktrees.ts#L182-L202) - the git `dirty` and `remove`, the pattern for `commit`"
  - "[code://packages/sdk/src/types/host.ts#L429-L438](../../../../packages/sdk/src/types/host.ts#L429-L438) - `closedChats`, the host option to mirror"
  - "[code://packages/server/src/rootconfig.ts#L32-L40](../../../../packages/server/src/rootconfig.ts#L32-L40) - `DAEMON_KEYS` and `LIVE`"
  - "[code://packages/sdk/src/host/actions.ts#L470-L477](../../../../packages/sdk/src/host/actions.ts#L470-L477) - the live push of `closedChats`"
  - "git://github.com/microsoft/vscode@c289a58900a - `cleanupWorktreeOnArchive`, which commits a dirty tree, then removes it"
---

## Objective

The daemon key `archiveDirtyWorktree` decides what archive does with a dirty tree.
`keep`, the default, keeps the tree.
`commit` commits every change with the message "Saving uncommitted changes before archiving session", then removes the tree and keeps the branch.

## Files

- `UPDATE: packages/sdk/src/types/worktrees.ts:128-143` - add the optional `commit?(path, message)` to the `Worktrees` port.
- `UPDATE: packages/sdk/src/repo/worktrees.ts:182-202` - `commit` runs `git add -A`, then `git commit -m <message>`.
- `UPDATE: packages/sdk/src/types/host.ts:438` - add `archiveDirtyWorktree?: 'keep' | 'commit'` beside `closedChats`.
- `UPDATE: packages/sdk/src/host/context.ts:194` - add `archiveDirtyWorktree: 'keep' | 'commit'` beside `closedChats`.
- `UPDATE: packages/sdk/src/host/actions.ts:470-477` - a push of `archiveDirtyWorktree` changes `ctx.archiveDirtyWorktree`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts` - set `ctx.archiveDirtyWorktree` from the option, else `keep`, beside `shelve`, as `chatrecord.ts:50` sets `closedChats`; `shelve` reads it for a dirty tree.
- `UPDATE: packages/server/src/config.ts:209` - add the key beside `closedChats`.
- `UPDATE: packages/server/src/commands/options.ts:71` - add the field, with `keep` as the default at L1048.
- `UPDATE: packages/server/src/commands/options.ts:487-491` - add the field entry with `enum: ['keep', 'commit']`.
- `UPDATE: packages/server/src/commands/run.ts:690` - pass the key to the host.
- `UPDATE: packages/server/src/commands/run.ts:1084` - add a start line when the value is `commit`.
- `UPDATE: packages/server/src/rootconfig.ts:32-40` - add the key to `DAEMON_KEYS` and to `LIVE`.
- `UPDATE: packages/server/src/main.ts:264` - add the key to the list in the help text.
- `UPDATE: docs/HOST.md:75` - a table row after `closedChats`.
- `UPDATE: docs/HOST.md:138-142` - add the key to the daemon keys and to the keys that apply at once.
- `UPDATE: packages/sdk/test/worktrees.test.ts` - the host cases in Validation.
- `UPDATE: packages/server/test/server-root-config.test.ts` - the schema and the live push.
- `UPDATE: packages/server/test/config-check.test.ts:219` - the default in the checked options.

## Steps

1. Write the tests first.
2. Add `commit` to the port and to the git `Worktrees`.
3. Add the host option and the context field, with `keep` as the default.
4. In `shelve`, under `keep`, keep a dirty tree as task 02 does.
5. In `shelve`, under `commit`, call `commit`, then remove the tree with no branch.
6. Keep the tree and log the reason when the port has no `commit` or the commit fails.
7. Add the key to the server configuration, the flags, the root config and the help text.
8. Apply a push of the key at once, as `actions.ts` applies a push of `closedChats`.
9. Write the key in `docs/HOST.md`.

## Validation

- `worktrees.test.ts`: under `keep`, archive a dirty session; the tree stays and the log names it.
- `worktrees.test.ts`: under `commit`, archive a dirty session; the tree is gone.
- `worktrees.test.ts`: after that archive, `git log` on the branch shows "Saving uncommitted changes before archiving session" with the change.
- `worktrees.test.ts`: under `commit`, archive a clean session; the branch gets no new commit, and the tree is gone.
- `worktrees.test.ts`: under `commit`, a port with no `commit` keeps the tree and logs why.
- `server-root-config.test.ts`: the schema has `archiveDirtyWorktree` with `enum: ['keep', 'commit']`.
- `server-root-config.test.ts`: a push of `archiveDirtyWorktree` answers no restart.
- `config-check.test.ts`: the checked options carry `archiveDirtyWorktree: 'keep'` when the file has no value.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

### Built

- The `Worktrees` port has an optional `commit`, and the git port stages every change and commits only when something is staged.
- The host option and the daemon key `archiveDirtyWorktree` take `keep` or `commit`, and `keep` is the default.
- Under `commit`, `shelve` commits a dirty tree, checks that the tree is clean, and then removes it without the branch.
- A port with no `commit`, a failed commit or a tree still dirty after the commit keeps the tree, and the log says why.
- A push of the key applies at once, and the server start line names `commit`.
- The configuration, the flags, the root config, the help text and `docs/HOST.md` carry the key.
- `commit` excludes the links at the linked folder names from staging, so a link is never committed.

### Validation

- `worktrees.test.ts` checks `keep`, and a dirty and a clean tree under `commit`.
- `worktrees.test.ts` also checks a port with no `commit`, a failed commit and a push of the key.
- `server-root-config.test.ts` checks the schema enum and that a push needs no restart.
- `config-check.test.ts` checks the default `keep`.
- `worktrees.test.ts` commits a dirty tree with links, and the commit holds only the new file.
- The gates pass: typecheck, boundary, schema and 4528 tests.

### Seen and not done

- The help text list did not name `closedChats` before this change, and it still does not.
- The commit uses the git identity of the host, so a missing identity keeps the tree.
