---
title: The process tests pass on Windows
domain: daemon
status: active
priority: medium
created: 2026-10-20
revalidated: 2026-10-20
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
decisions:
  - decisions/windows-powershell-5-is-given-an-argv-escaped-for-the-c-runtime.md
refs:
  - "[code://tools/wait.ts#L10](../../../../tools/wait.ts#L10) - `WAIT_MS`, the wait by the clock that a slow runner is given"
  - "[code://tools/posix.ts#L9](../../../../tools/posix.ts#L9) - `posix`, the skip p3 uses for a POSIX-only case"
  - "[code://packages/sdk/src/terminals.ts#L212-L227](../../../../packages/sdk/src/terminals.ts#L212-L227) - `argvLine`, the argv a terminal runs, quoted for its shell"
  - "[code://packages/server/src/install.ts#L99-L115](../../../../packages/server/src/install.ts#L99-L115) - `launch`, which on Windows runs the `npm-cli.js` beside Node and never reads `PATH`"
  - "[code://packages/server/src/daemon.ts#L13-L22](../../../../packages/server/src/daemon.ts#L13-L22) - Windows has no `SIGHUP`, so a stop and a restart go by a control pipe"
---

## Goal

The process tests pass on a Windows host that has Windows PowerShell 5.1 and no PowerShell 7, apart from the cases that are POSIX by nature, which say why they skip.
A terminal started with an argv on such a host runs it with each word whole.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- Each file of `test:processes` and each file p7's [deferred.md](../33-p7-a-windows-folder-has-a-path-in-the-machine/deferred.md) names, run alone on a Windows 10 VM with Docker Desktop 29.9.1, from `main` at `8ad65e71`, 2026-10-20, after the VM's scanner was told to skip the work folder.
- `rg "for \(let i = 0; i < [0-9]+; i\+\+\)" packages/sdk/test/host-terminals.test.ts` - five shell waits by a count.

### What is true now

32 of the 43 files pass on the VM, the real-Docker computer cases among them.
37 cases fail in 11 files, by four causes:

| Cause | Cases | Task |
| --- | --- | --- |
| A wait by the clock of 2 to 3 s, too short for Windows PowerShell 5.1 to start or for a cold import | `agent-pi-lazy` 1, `conformance` 1, `host-terminals` 2 | 01 |
| A stand-in that is a POSIX program: `cat`, `sleep`, `true`, `false`, `sh -c` | `computer-spawn` 5, `nested-process` 2 | 02, and 03 for the closed stdin Windows does not report |
| A case that is POSIX by nature: a FIFO and `/dev/zero`, a process that ignores SIGTERM, a file mode, SIGHUP and SIGUSR2, a systemd or launchd service, a stand-in npm on `PATH` | `agent-acp-blocks` 1, `nested-process` 2, `server-cli-restart` 3, `server-cli-service` 6, `server-cli-verbs` 5, `server-http` 7 | 03 |
| An argv a terminal runs under Windows PowerShell 5.1 loses the `"` inside a word | `pty` 1 | 04 |

The `spawn sh ENOENT`, `spawnSync mkfifo ENOENT` and `spawn systemctl ENOENT` that p7 saw are all stand-ins in tests, not the product.
One case of `server-cli-restart`, a stop sent while a restart is stopping, expects the `SIGHUP` receipt; on Windows the receipt names the control pipe.

### Not in this plan

- A Windows job for `test:processes` in CI. The parent plan's answer stands: only `check` runs on Windows, and the process tests on Windows are checked on a Windows machine.
- The `ahpd` part built from a checkout with `spawnSync('pnpm', ...)`, and `ahpc changes` naming `/C:/...`: p7's deferred.md keeps them.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Windows PowerShell 5.1 is given an argv escaped for the C runtime](../../../decisions/windows-powershell-5-is-given-an-argv-escaped-for-the-c-runtime.md) | Softov, 2026-10-20 |

| What | Source | Task |
| --- | --- | --- |
| The process tests' findings go in one new child plan, p8 | Softov, 2026-10-20, chose "New child plan: process tests" and "Write and build (Recommended)" | - |
| No Windows CI job for the process tests | Softov, 2026-10-20, chose "No, VM only (Recommended)" | - |
| A wait by the clock uses `WAIT_MS` | [code://tools/wait.ts#L10](../../../../tools/wait.ts#L10) | 01 |
| A stand-in is made portable where it can be, and a case is skipped with its reason where it cannot | the parent plan's answer, Softov, 2026-10-16 | 02, 03 |
| A stand-in program is this Node with `-e`, which every system has | (defaulted: `process.execPath` is what the suites already spawn) | 02 |

## Proposed architecture

- **Data flow** - a terminal's argv -> `argvLine` -> Windows PowerShell 5.1 escaped for the C runtime -> the program reads each word whole.
- **Layer responsibilities** - sdk: the argv's escape · tests: waits, stand-ins and skips.
- **Source-of-truth files** - [`code://packages/sdk/src/terminals.ts`](../../../../packages/sdk/src/terminals.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A wait by the clock has the case's budget](task-01-a-wait-by-the-clock-has-the-cases-budget.md) | implemented | - |
| [02 - A stand-in is a Node script](task-02-a-stand-in-is-a-node-script.md) | implemented | - |
| [03 - A POSIX-only process test says why it skips](task-03-a-posix-only-process-test-says-why-it-skips.md) | implemented | - |
| [04 - Windows PowerShell 5.1 runs an argv whole](task-04-windows-powershell-5-runs-an-argv-whole.md) | implemented | - |
| [05 - A terminal case ends the shell it started](task-05-a-terminal-case-ends-the-shell-it-started.md) | implemented | - |
| [06 - The wire capture is the same on every run](task-06-the-wire-capture-is-the-same-on-every-run.md) | implemented | - |

## Risks and tradeoffs

- A longer wait makes a case that hangs slower to fail. `WAIT_MS` stays inside the case's own limit, so the wait still fails in its own words.
- A skip hides a Windows bug in the code under test. Each skip names its reason beside it.

## Resume state

- **Done so far:** planned 2026-10-20 from the VM run. Tasks 01 to 04 implemented 2026-10-20, and the 11 files pass on the Windows VM. Task 05 added and implemented the same day: `pty.test.ts` left a Node child in the run's folder, which failed its removal on Windows. Task 06 added and implemented the same day: the committed `wire.jsonl` held a Windows home with a real user name, and every run rewrote it; it is regenerated on Linux. `install-ps1.test.ts` sits at the Windows limit on a desktop: see [deferred.md](deferred.md).
- **Next action:** review tasks 01 to 06 and the CI run of the branch, then close the plan.
- **Open questions:** none.
- **Watch out for:** the `check-windows` runner has PowerShell 7 and Git's `usr/bin` on `PATH`, so a POSIX stand-in or a PowerShell 5.1 bug passes there; only a host without them shows it.

## Final verification checklist

- [x] The 11 files pass on the Windows VM, with their skips.
- [ ] The Linux jobs pass.
- [x] `plans/index.md` updated.
