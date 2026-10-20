---
title: Mode, link and worktree tests
status: done
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

Done 2026-10-18. Not reviewed.

p1's list had one worktree file: `packages/sdk/test/worktrees.test.ts`, 57 tests and 41 failed. Every case that creates a session sent a folder built by hand as `` `file://${project(root)}` ``. On Windows that reads `file://C:\...`. `packages/sdk/src/resources.ts` refuses it with "<uri> is not a local file URI", and the rest of the case then failed with it.

The file now builds a URI with `uriOf` and reads one back with `localPath`, both from `../src/fileuri.js`. That is 34 sites that write a URI and 14 that read one back, including the `replace('file://', '')` and `replace(/^file:\/\//, '')` forms. The file passes on Linux. Whether a worktree case still fails on Windows for another reason is for the next run of the job to say.

File modes are skipped with `it.skipIf(!posix)`. A reason is beside each skip. The cases are `users.test.ts` 1, `policies.test.ts` 2, `jsonfile.test.ts` 4, `usage.test.ts` 1, `host-attachments.test.ts` 1, `attachments.test.ts` 1 (a pipe made with `mkfifo`), and `packages/agent-claude/test/delete.test.ts` 1. The reason is the same each time: `0600`, `0644`, `0700`, `0400` or `0555` is a POSIX file mode, and Windows keeps only a read-only flag.

Folder links now name their type. `host-trust.test.ts` and `writes.test.ts` make a directory link with `process.platform === 'win32' ? 'junction' : 'dir'`, as `packages/sdk/src/repo/worktrees.ts` does.

Cases that need a file link are skipped, because a file link on Windows needs Developer Mode or an administrator. They are 3 in `writes.test.ts`, 2 in `commit.test.ts`, 1 in `agent-machine-needs.test.ts`, and the `resource-write.test.ts` fixtures whose `before` is a symlink.

Path and URI problems for a later task, not skipped. These files in p1's list build `` `file://${...}` `` by hand: `sessions.test.ts`, `nested-proxy.test.ts`, `packages/bot/test/bot-provider.test.ts`, `host-files.test.ts`, `packages/agent-cofold/test/agent-cofold-store.test.ts`, `changes-refresh.test.ts`, `changes-uris.test.ts`, `users-gate-names.test.ts`, `packages/server/test/scheduled.test.ts`, `packages/agent-pi/test/agent-pi.test.ts`, `packages/agent-acp/test/agent-acp-turn.test.ts`, `agent-acp-ports.test.ts` and `agent-acp-client-tool.test.ts`. The errors seen are "'file:/// is not a local file URI'" and "No file at file://packages/sdk/...". The fix is the one this task made in `worktrees.test.ts`.

Gates run: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass. Vitest on `packages/sdk` with `--maxWorkers=2 --testTimeout=10000`: 149 files and 2990 tests pass. Vitest on `packages/agent-claude`: 34 files and 317 tests pass. `posix` is true on Linux, so nothing skips here.

`packages/sdk/test/fixtures/wire.jsonl` was rewritten by the run and could not be restored: `git checkout --` and `git restore` are both denied in this mode. It needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` from Softov.
