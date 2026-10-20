---
title: Tests build paths the system's way - implemented
date: 2026-10-19
refs:
  - git://4437ad09
  - git://fd313f62
  - git://ed3765eb
  - https://github.com/softov/ahpd/actions/runs/39344018005/job/118372148963 - the `check-windows` job of PR #30, green on 2026-10-19
  - "[code://packages/agent-claude/src/session/customizations.ts#L72](../../../../packages/agent-claude/src/session/customizations.ts#L72) - the home folder from `homedir()`"
---

A test that names a path or a file URI builds it the way the code under test does.
The tests pass on Linux and on Windows with the same meaning.
agent-claude finds the user's folders on Windows.

## What was built

- [`code://packages/agent-claude/src/session/customizations.ts`](../../../../packages/agent-claude/src/session/customizations.ts) - the home folder comes from `homedir()`, not from `HOME`.
- [`code://tools/test-tmpdir.ts`](../../../../tools/test-tmpdir.ts) - the run's folder is named by `realpathSync.native`, its long name.
- [`code://packages/sdk/src/repo/worktrees.ts`](../../../../packages/sdk/src/repo/worktrees.ts) - `repository` and `gitDir` pass git's paths through `resolve`.
- [`code://examples/echo/agent.ts`](../../../../examples/echo/agent.ts) - each `file://` URI comes from `uriOf`.
- agent-claude tests: `customizations.test.ts`, `agent-claude-find.test.ts` and `agent-claude-agent-pick.test.ts` build their paths and URIs with `join` and `uriOf`.
- sdk tests: `fileuri`, `attachments`, `sessions`, `nested-proxy`, `host-files`, `changes-refresh`, `changes-uris`, `host-terminals`, `sessiontools`, `users-gate-names`, `worktrees`, `host-merged` and `diagnostics` do the same.
- [`code://packages/server/test/config-layers.test.ts`](../../../../packages/server/test/config-layers.test.ts) - the expected worktrees root is `resolve('/trees')`.

## Verified

- On Linux, 2026-10-18: agent-claude passed 329 tests, and the sdk passed 3137 tests with 1 skip.
- On Softov's Windows machine, 2026-10-19: `worktrees.test.ts`, `host-merged.test.ts` and `diagnostics.test.ts` passed 87 tests.
- `sessiontools.test.ts`: `matches a directory with a space, however the URI was written` passes. `config-layers.test.ts`: `names the worktrees root typed on the command line against the working directory` passes.
- On 2026-10-19, the `check-windows` job of PR #30 passed its tests step, in run 39344018005. The Linux `check` job of that run passed too.
- Softov approved the close on 2026-10-19.

## Departures from the plan

- p1's failure list did not exist when tasks 01 and 02 ran. Their files came from the plan's refs, the tree, and the Resume of p3 and p5.
- Task 03 needed no change in `sessiontools.test.ts`: task 02 had already fixed it.
- In `host-merged.test.ts` the sdk's `uriOf` is imported as `fileUriOf`, because the file has a `uriOf` of its own.

## Left for later

- none.
