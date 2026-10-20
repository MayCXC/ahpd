---
title: POSIX-only tests say why they skip - implemented
date: 2026-10-20
refs:
  - git://a8b9cf2b - the skips and `tools/posix.ts`
  - git://dbbca58f - main at the merge of PR #38, whose `check-windows` run passed
  - "[code://tools/posix.ts](../../../../tools/posix.ts) - `posix`, false on Windows"
---

A test that needs a POSIX shell outside a terminal, a file mode or a file link skips on Windows.
A comment beside each skip says why.
A folder link in a test is a junction on Windows, as `worktrees.ts` makes it.

## What was built

- [`code://tools/posix.ts`](../../../../tools/posix.ts) - `export const posix = process.platform !== 'win32'`, with a comment that each use names its reason.
- Shell skips in `git-locks.test.ts`, `changes-locks.test.ts`, `git-hardened.test.ts` and `github.test.ts`, where a `#!/bin/sh` program is put on `PATH`.
- File mode skips in `users.test.ts`, `policies.test.ts`, `jsonfile.test.ts`, `usage.test.ts`, `host-attachments.test.ts`, `attachments.test.ts` and agent-claude's `delete.test.ts`.
- File link skips in `writes.test.ts`, `commit.test.ts`, `agent-machine-needs.test.ts` and `resource-write.test.ts`.
- `worktrees.test.ts` builds and reads its URIs with `uriOf` and `localPath`.

## Verified

- 2026-10-20: `check-windows` passed on main at `dbbca58f` and at `e7b172de`.
- 59 uses of `it.skipIf(!posix)` are in the tests on main, and later plans added more with the same helper.
- On Linux `posix` is true, so the Linux jobs skip nothing new.

## Departures from the plan

- No signal case was skipped. `nested-process.test.ts` is outside `test:unit`, and `pty.test.ts` was p5's.
- The URI fixes that task 03 named in other files were made by p6, not here.
