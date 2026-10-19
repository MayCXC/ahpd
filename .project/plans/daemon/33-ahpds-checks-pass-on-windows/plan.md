---
title: ahpd's checks pass on Windows
domain: daemon
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://scripts/boundary.mjs#L23](../../../../scripts/boundary.mjs#L23) - `ROOT` is a URL pathname, which is no Windows path"
  - "[code://package.json#L27](../../../../package.json#L27) - `test:unit` quotes its globs with single quotes, which `cmd.exe` keeps"
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the `check` job, on `ubuntu-latest` only"
  - "[code://.github/workflows/ci.yml#L45-L46](../../../../.github/workflows/ci.yml#L45-L46) - `timeout 300`, a POSIX command"
  - "[code://tools/test-tmpdir.ts#L15-L16](../../../../tools/test-tmpdir.ts#L15-L16) - the run's folder goes in `TMPDIR`, which Windows does not read"
  - "[code://packages/agent-claude/src/session/customizations.ts#L55-L56](../../../../packages/agent-claude/src/session/customizations.ts#L55-L56) - `HOME`, which Windows does not set"
  - "[code://packages/sdk/src/terminals.ts#L19](../../../../packages/sdk/src/terminals.ts#L19) - a terminal runs `SHELL` or `/bin/sh`"
  - "[code://DEVELOPER.md#L78-L90](../../../../DEVELOPER.md#L78-L90) - the checks, and where they run"
---

## Goal

ahpd's checks pass on Windows: `pnpm boundary`, `pnpm typecheck`, the vitest gate and `pnpm build`.
A test that cannot run on Windows says why it skips.
A `windows-latest` job in CI runs the checks, so Windows stays green.

## Reconnaissance

### Searches performed

- `git grep -n "import.meta.url).pathname" scripts tools` - `boundary.mjs` is the one script that reads a pathname.
- `git grep -ln "/home/\|'/tmp\|file:///" packages/sdk/test packages/agent-claude/test` - about 80 files name POSIX paths.
- `git grep -ln "sh -c\|/bin/sh\|shellTerminals" packages/sdk/test` - the tests that need a POSIX shell.
- `git grep -ln "worktree\|chmodSync\|symlinkSync\|SIGTERM" packages/sdk/test` - git worktrees, file modes, links and signals.
- `git grep -n "win32" packages/*/src` - the sources check for Windows in two places.

### What is true now

Windows cannot run here, so the failures are grouped by cause from the code.
Softov's run on Windows 10 reported 17 failures in agent-claude and about 200 in the sdk.

| Cause | Where | Child |
| --- | --- | --- |
| A URL pathname as the repository root | `scripts/boundary.mjs:23` | p1 |
| Single quotes in a pnpm script | `package.json:27` | p1 |
| `timeout` in a CI step | `ci.yml:46`, `ci.yml:76` | p1 |
| `TMPDIR` as the test folder | `tools/test-tmpdir.ts:16` | p1 |
| A POSIX path or URI in a test, such as `/home/softov`, `/tmp` or `file:///dev/zero` | about 80 test files | p2 |
| `HOME` in source | `customizations.ts:55` | p2 |
| A terminal that runs `SHELL` or `/bin/sh` | 13 test files | p5 |
| A POSIX shell outside a terminal, or a signal | about 10 test files | p3 |
| A file mode, a symbolic link or a git worktree | about 25 test files | p3 |

### Gaps

- The exact list of failing tests. Child p1 adds the Windows job first, and its first run gives the list.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One plan, plus a Windows job in CI | Softov, 2026-10-16, chose "One plan, plus Windows CI" | p1, p4 |
| A test is made portable where it can be, and skipped with its reason where it cannot | Softov, 2026-10-16, the same answer | p2, p3 |
| Terminals work on Windows, and their tests run there | Softov, 2026-10-16, chose "Make terminals work" for "What do the terminal tests do on Windows?" | p5 |
| The Windows job reports and does not block a merge until p2, p3 and p5 land; p4 makes it block | Softov, 2026-10-16, chose "Report only until p2 and p3 land, then p4 makes it required" for "How does the Windows job start?" | p1, p4 |
| Only the `check` job runs on Windows | Softov, 2026-10-16, chose "`check` only" for "Which jobs run on Windows?" | p1 |
| The plan is a parent with five children | (defaulted: the work passes eight tasks) | - |
| A sixth child, p6, takes the Windows run's findings that p2 and p5 do not cover | Softov, 2026-10-18, chose "New child plan p6" for "Where should the Windows session's daemon/33 findings go?" | p6 |
| The domain is daemon | (defaulted: no domain covers the repository's own checks, and daemon owns the build) | - |

## Proposed architecture

- **Data flow:** a push -> the Windows job runs the checks -> its log names each failure -> p2, p3 and p5 fix them -> p4.
- **Layer responsibilities:** scripts and CI: the checks start on Windows. sdk: a terminal starts a Windows shell. Tests: a path comes from the system, and a POSIX-only case says so.

## Tasks

Child plans, each for one cause.

| Plan | Package | Status | Depends on |
| --- | --- | --- | --- |
| [p1 - A Windows job runs the checks](../33-p1-a-windows-job-runs-the-checks/plan.md) | scripts, CI | planned | - |
| [p2 - Tests build paths the system's way](../33-p2-tests-build-paths-the-systems-way/plan.md) | sdk, agent-claude | planned | p1 |
| [p3 - POSIX-only tests say why they skip](../33-p3-posix-only-tests-say-why-they-skip/plan.md) | sdk, agent-claude | planned | p1 |
| [p4 - The Windows job is required](../33-p4-the-windows-job-is-required/plan.md) | CI, docs | planned | p2, p3, p5, p6 |
| [p5 - Terminals run on Windows](../33-p5-terminals-run-on-windows/plan.md) | sdk | planned | p1 |
| [p6 - The Windows run finishes clean](../33-p6-the-windows-run-finishes-clean/plan.md) | sdk, server, computer, CI | active | p1 |
| [p7 - A Windows folder has a path in the machine](../33-p7-a-windows-folder-has-a-path-in-the-machine/plan.md) | sdk, computer, agents | planned | p6 |

## Risks and tradeoffs

- A skip hides a Windows bug in the code under test. Each skip names its reason, so a later plan can find them all.
- A Windows runner is slower than a Linux one. The job runs the unit tests only, not the process tests.

## Resume state

- **Done so far:** drafted 2026-10-16 from the Windows run in `pending/vscode-checks.md`. Planned 2026-10-16 with Softov's answers.
- **Next action:** build p1.
- **Open questions:** none.
- **Watch out for:** the release workflow runs the same checks, and it stays on Linux.

## Final verification checklist

- [ ] The Windows job passes on a push to main.
- [ ] Every skip names its reason in a comment beside it.
- [ ] The terminal tests run on Windows, with no skip.
- [ ] The Linux jobs still pass, and they skip no test that ran before.
- [ ] `DEVELOPER.md` says the checks run on Windows.
- [ ] `plans/index.md` updated.
