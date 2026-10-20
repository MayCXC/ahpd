---
title: POSIX-only tests say why they skip
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
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - `shellOf`: `SHELL` or `/bin/sh`"
  - "[code://packages/sdk/test/pty.test.ts#L192](../../../../packages/sdk/test/pty.test.ts#L192) - a process group killed with a negative pid"
  - "[code://packages/sdk/test/nested-process.test.ts#L90](../../../../packages/sdk/test/nested-process.test.ts#L90) - a script run with `sh -c`"
  - "[code://packages/sdk/test/git-locks.test.ts#L49](../../../../packages/sdk/test/git-locks.test.ts#L49) - `sh -c 'command -v git'`"
  - "[code://packages/sdk/test/policies.test.ts#L332](../../../../packages/sdk/test/policies.test.ts#L332) - a file mode set with `chmodSync`"
  - "[code://packages/sdk/test/host-trust.test.ts#L479](../../../../packages/sdk/test/host-trust.test.ts#L479) - a symbolic link"
  - "[code://packages/sdk/src/repo/worktrees.ts#L442](../../../../packages/sdk/src/repo/worktrees.ts#L442) - the source makes a junction on Windows"
  - "[code://packages/server/test/server-http.test.ts#L393](../../../../packages/server/test/server-http.test.ts#L393) - `it.skipIf`, the skip already in use"
---

## Goal

A test that needs a POSIX shell outside a terminal, a signal, a file mode or a symbolic link runs where it can.
On Windows it skips, and a comment beside the skip says why.
A test that fails on Windows for another cause is fixed, not skipped.

## Reconnaissance

### Searches performed

- `git grep -ln "sh -c\|/bin/sh" packages/sdk/test` - 10 files.
- `git grep -ln "shellTerminals" packages/sdk/test` - 13 files start a real shell for a terminal, which p5 covers.
- `git grep -ln "chmodSync\|mode: 0o" packages/sdk/test packages/agent-claude/test` - 21 files.
- `git grep -ln "symlinkSync" packages/sdk/test` - 5 files.
- `git grep -ln "worktree" packages/sdk/test packages/agent-claude/test` - 19 files.
- `git grep -n "skipIf" packages/*/test` - `server-http.test.ts` skips by what the machine has.

### What is true now

- `shellTerminals` runs `SHELL` or `/bin/sh`, so a terminal test cannot start on Windows. p5 fixes that, and this plan leaves those tests to it.
- Windows has no process groups and no POSIX signals, so a test of `kill(-pid)` has no meaning there.
- On Windows, `chmod` sets only the read-only flag, and a symbolic link needs a privilege the runner may lack.
- git worktrees work on Windows. A worktree test likely fails on a path, which is p2's cause.
- A test named `/bin/sh` only as a config value passes a string through, and needs no skip.

### Gaps

- Which worktree tests fail, and why. Task 03 step 1 reads them from p1's list.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One helper names a POSIX-only case, and each use gives its reason | (defaulted: one place to find every skip) | 01 |
| The skip uses `it.skipIf` or `describe.skipIf`, as `server-http.test.ts` does | (defaulted: the pattern in use) | 01 |
| A test of a terminal is not skipped; p5 makes it run on Windows | Softov, 2026-10-16, chose "Make terminals work" for "What do the terminal tests do on Windows?" | 02 |

## Proposed architecture

- **Data flow:** a test file -> `posixOnly` from a helper in `tools/` -> `describe.skipIf(process.platform === 'win32')` -> a comment with the reason.
- **Layer responsibilities:** tools: the helper. Tests: each skip and its reason.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - One helper names a POSIX-only case](task-01-one-helper-names-a-posix-only-case.md) | done | - |
| [02 - Shell and signal tests skip on Windows](task-02-shell-and-signal-tests-skip-on-windows.md) | done | 01 |
| [03 - Mode, link and worktree tests](task-03-mode-link-and-worktree-tests.md) | done | 01 |

## Risks and tradeoffs

- A skipped signal test leaves process groups unchecked on Windows. p5 checks how a Windows terminal stops.

## Resume state

- **Done so far:** drafted 2026-10-16, planned 2026-10-16. Task 01 built 2026-10-16: `tools/posix.ts` holds `posix`. Task 02 built 2026-10-18: four files that run a `#!/bin/sh` script as a program skip on Windows. Task 03 built 2026-10-18. `worktrees.test.ts` builds URIs with `uriOf` and reads them with `localPath`. The mode cases skip. Folder links are junctions on Windows. The file-link cases skip.
- **Next action:** none. Built 2026-10-20; see [implemented.md](implemented.md).
- **Open questions:** none.
- **Watch out for:** a `describe.skipIf` around a file skips its setup too. Put the skip around the cases, not the imports.

## Final verification checklist

- [x] Every skip uses the helper and names its reason.
- [x] The Windows job passes, with the skips counted in its log.
- [x] The Linux jobs skip nothing new.
