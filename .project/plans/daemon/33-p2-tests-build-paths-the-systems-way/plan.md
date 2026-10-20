---
title: Tests build paths the system's way
domain: daemon
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
refs:
  - "[code://packages/agent-claude/src/session/customizations.ts#L55-L56](../../../../packages/agent-claude/src/session/customizations.ts#L55-L56) - the user's folders from `HOME`"
  - "[code://packages/agent-claude/test/customizations.test.ts#L32-L33](../../../../packages/agent-claude/test/customizations.test.ts#L32-L33) - the test sets `HOME`"
  - "[code://packages/agent-claude/test/agent-claude-find.test.ts#L58-L59](../../../../packages/agent-claude/test/agent-claude-find.test.ts#L58-L59) - `/home/softov/one` as a working folder"
  - "[code://packages/agent-claude/test/delete.test.ts#L22](../../../../packages/agent-claude/test/delete.test.ts#L22) - `/home/softov` as a working folder"
  - "[code://packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212](../../../../packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212) - `file:///dev/zero`"
  - "[code://packages/agent-claude/test/agent-claude-tool-input.test.ts#L158](../../../../packages/agent-claude/test/agent-claude-tool-input.test.ts#L158) - `/tmp/project`"
  - "[code://packages/sdk/test/fileuri.test.ts#L42](../../../../packages/sdk/test/fileuri.test.ts#L42) - a path split on `/`"
  - "[code://packages/sdk/test/attachments.test.ts#L44](../../../../packages/sdk/test/attachments.test.ts#L44) - a label from a path split on `/`"
  - "[code://packages/sdk/src/fileuri.ts](../../../../packages/sdk/src/fileuri.ts) - `localPath` and `uriOf`, the host's own conversion"
---

## Goal

A test that names a path or a file URI builds it the way the system under test does.
A test passes on Linux and on Windows with the same meaning.
agent-claude finds the user's folders on Windows.

## Reconnaissance

### Searches performed

- `git grep -ln "/home/" packages/sdk/test packages/agent-claude/test` - 28 sdk files and 4 agent-claude files.
- `git grep -ln "'/tmp" packages/sdk/test packages/agent-claude/test` - 50 sdk files and 6 agent-claude files.
- `git grep -ln "file:///" packages/sdk/test packages/agent-claude/test` - 35 sdk files and 2 agent-claude files.
- `git grep -n "process.env.HOME" packages/*/src` - agent-claude reads `HOME` in `customizations.ts`.

### What is true now

- Many tests write a POSIX path as a literal, and compare it with what `localPath` or `join` gives. On Windows those give `\home\softov` or a drive path.
- A test that passes a path through, with no disk and no conversion, can keep its literal.
- `HOME` is not set on Windows, so `customizations.ts` names the user's folders under `/.claude`. `os.homedir()` reads `USERPROFILE` there.

### Gaps

- The failing tests by file, from p1's first Windows run.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A test builds its expected path with `join`, `localPath` or `pathToFileURL` | (defaulted: the code under test does the same) | 01, 02 |
| agent-claude reads `os.homedir()`, and a test still sets `HOME` on POSIX | (defaulted: `os.homedir()` reads `HOME` first on POSIX) | 01 |
| A path literal stays where nothing converts it | (defaulted: the smallest change) | 01, 02 |
| The test run's temp folder is named by its long name, and git's paths are passed through `resolve` | (defaulted: git answers long names with forward slashes) | 04 |

## Proposed architecture

- **Data flow:** a test's folder from `join(tmpdir(), ...)` -> its URI from `uriOf` -> the expected value from the same calls.
- **Layer responsibilities:** agent-claude: the home folder from `os.homedir()`. Tests: paths from the system.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - agent-claude's tests build their paths](task-01-agent-claudes-tests-build-their-paths.md) | done | - |
| [02 - The sdk's tests build their paths](task-02-the-sdks-tests-build-their-paths.md) | done | - |
| [03 - The paths the Windows run found](task-03-the-paths-the-windows-run-found.md) | done | - |
| [04 - The paths a runner's temp folder found](task-04-the-paths-a-runners-temp-folder-found.md) | done | 03 |

## Risks and tradeoffs

- Task 02 touches many files. Each file is its own change, so a review reads one file at a time.

## Resume state

- **Done so far:** drafted 2026-10-16, planned 2026-10-16, tasks 01, 02 and 03 implemented 2026-10-18, and task 04 implemented 2026-10-19 on Softov's Windows machine. On 2026-10-19 the tests step of the `check-windows` job of PR #30 passed, in run 39344018005. Softov approved the close on 2026-10-19. The plan is built: see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a fixture file under `test/fixtures` holds POSIX URIs that VS Code sent. It stays as it is.

## Final verification checklist

- [x] The Windows job passes every test in this plan's files.
- [x] The Linux jobs pass.
- [x] `customizations.ts` reads no `HOME`.
