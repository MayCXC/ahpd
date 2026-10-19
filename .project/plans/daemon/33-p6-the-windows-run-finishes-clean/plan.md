---
title: The Windows run finishes clean
domain: daemon
status: active
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/repo/git.ts#L39](../../../../packages/sdk/src/repo/git.ts#L39) - a spawn with no `windowsHide`"
  - "[code://packages/computer/src/manifest.ts#L562](../../../../packages/computer/src/manifest.ts#L562) - `MOUNT` refuses a source with a drive"
  - "[code://packages/computer/src/manifest.ts#L571](../../../../packages/computer/src/manifest.ts#L571) - `targetOf` splits at the first `:`"
  - "[code://.github/workflows/ci.yml#L91](../../../../.github/workflows/ci.yml#L91) - the Windows job's `timeout 300`"
  - "[code://packages/server/test/config-layers.test.ts#L233](../../../../packages/server/test/config-layers.test.ts#L233) - an `ahpd config` case that exits 1 on Windows"
---

## Goal

A daemon on Windows opens no console window for a process it starts.
A profile mount with a drive letter is a mount.
The Windows job runs every unit test, and a test's cleanup does not fail on a locked folder.

## Reconnaissance

### Searches performed

- `grep -nE "\b(spawn|execFile|spawnSync|execFileSync|fork)\(" packages/*/src` - the spawns, checked for `windowsHide` on `1803784f`.
- `grep -rn "source:target" packages/*/src` - the mount checks in `manifest.ts`.

### What is true now

The source is a Windows 10 run of ahpd 0.12.0 on Node 24.12.0, and three CI runs of PR 7.

- These spawns have no `windowsHide`, so each one opens a console window on Windows:
  - `packages/agent-acp/src/connection.ts:160`
  - `packages/agent-claude/src/spawn.ts:154`
  - `packages/computer/src/devcontainer.ts:465, 789, 804, 863, 1114`
  - `packages/computer/src/runtime.ts:884, 2380, 2417`
  - `packages/sdk/src/changes.ts:64, 79`
  - `packages/sdk/src/checkpoints.ts:31`
  - `packages/sdk/src/repo/git.ts:39`
  - `packages/sdk/src/repo/github.ts:65, 117, 157`
  - `packages/sdk/src/repo/worktrees.ts:43`
  - `packages/server/src/commands/restart.ts:397`
  - `packages/server/src/daemon.ts:515`
  - `packages/server/src/install.ts:107`
  - `packages/server/src/service.ts:323`
  - `packages/tunnel-devtunnel/src/devtunnel.ts:58, 70`
- `MOUNT` refuses `C:\work:/work`, because the drive's `:` reads as the separator. `nested-start.test.ts` fails 2 cases on it.
- The Windows job stops at 300 s with exit 124 on every run, so its list of failures is not complete.
- `EBUSY: resource busy or locked, rmdir` fails a different test on each run: enablement, host-plugins, worktrees and gate. A process still holds the folder when the cleanup runs.
- Three `ahpd config` and startup cases in `config-layers.test.ts` exit 1 on Windows. The cause is not read yet.

### Gaps

- The full failure list. Task 03 lets the job finish, and its run gives the list.

### Not in this plan

- The computer suite, `test:processes`, fails 144 cases on Windows, mostly in the docker and ssh fixtures. Only the `check` job runs on Windows, by the parent plan's answer.
- The `host-terminals.test.ts` and `sessiontools.test.ts` cases are p5 task 04's, and the path cases are p2 task 03's.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The Windows findings go in one child plan, p6; the path and terminal cases go to p2 and p5 | Softov, 2026-10-18, chose "New child plan p6" for "Where should the Windows session's daemon/33 findings go?" | 01 to 05 |
| Every spawn in `src` sets `windowsHide: true` | (defaulted: the option does nothing off Windows) | 01 |
| A mount source may start with a drive letter, and the separator is the first `:` after it | (defaulted: the smallest change that reads `C:\work:/work`) | 02 |
| The Windows job's bound goes from 300 s to 600 s, inside the job's 15 minutes | (defaulted: the job is cut off, not stuck) | 03 |
| A test's removal of its folder retries with `maxRetries` | (defaulted: Node's own retry for `EBUSY` and `EPERM`) | 04 |
| A tree's removal finds its links among the ignored entries too | (defaulted: on Windows a junction is a folder to git) | 06 |
| A path goes into an `ahp-git:` or `ahp-edit:` URI as a `file:` URI holds it, and is compared without case on Windows | (defaulted: VS Code prints a drive letter lowercase) | 07 |
| Every git of a test run has `core.autocrlf=false`, set once in the global setup | (defaulted: one place, and the code under test's git reads it too) | 08 |
| The suite's timeout stays 5 s; the git-heavy worktree blocks get 15 s | (defaulted: the other timeouts on the runner each had a cause) | 08 |
| The in-process update is tested as a Linux machine's install, in POSIX paths | (defaulted: Windows hands the install to a helper, which has its own case) | 09 |
| A test that is POSIX by nature skips on Windows with `it.skipIf(!posix)` and its reason beside it | (defaulted: the p3 pattern) | 10 |
| A host path is absolute by the host's rule; a path inside the machine stays POSIX | (defaulted: a machine is Linux whatever the host is) | 11 |
| A `file:` URI naming another machine is refused on every system | (defaulted: on Windows Node reads it as a network path, which the daemon would connect to) | 12 |
| A URI with no drive is read by POSIX rules on Windows, as a path on the current drive | (defaulted: what `uriOf` already makes of the same path) | 12 |

## Proposed architecture

- **Data flow:** a spawn on Windows -> no console window. A profile mount -> its drive read -> its target.
- **Layer responsibilities:** sdk, server, computer and the agents: `windowsHide` on each spawn. computer: the mount parse. CI: the Windows bound. Tests: the cleanup retry.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A spawn opens no console window](task-01-a-spawn-opens-no-console-window.md) | implemented | - |
| [02 - A mount with a drive is a mount](task-02-a-mount-with-a-drive-is-a-mount.md) | implemented | - |
| [03 - The Windows job runs to the end](task-03-the-windows-job-runs-to-the-end.md) | implemented | - |
| [04 - A test's cleanup waits for its folder](task-04-a-tests-cleanup-waits-for-its-folder.md) | implemented | 03 |
| [05 - ahpd config runs on Windows](task-05-ahpd-config-runs-on-windows.md) | todo | 03 |
| [06 - An archive leaves the checkout's linked folders](task-06-an-archive-leaves-the-checkouts-linked-folders.md) | implemented | 03 |
| [07 - A changeset names Windows paths](task-07-a-changeset-names-windows-paths.md) | implemented | 03 |
| [08 - A test reads nothing of the machine it runs on](task-08-a-test-reads-nothing-of-the-machine-it-runs-on.md) | implemented | 03 |
| [09 - The update and control tests run on Windows](task-09-the-update-and-control-tests-run-on-windows.md) | implemented | 03 |
| [10 - The daemon tests stop what they start](task-10-the-daemon-tests-stop-what-they-start.md) | implemented | 03 |
| [11 - A host path is absolute by the host's rule](task-11-a-host-path-is-absolute-by-the-hosts-rule.md) | implemented | 03 |
| [12 - A client's path is read by the host's rules](task-12-a-clients-path-is-read-by-the-hosts-rules.md) | implemented | 03 |
| [13 - A path is compared in the host's spelling](task-13-a-path-is-compared-in-the-hosts-spelling.md) | implemented | 03 |

## Risks and tradeoffs

- A retry hides a process that a test did not stop. Task 04 keeps the retry short, so a process that holds the folder for long still fails.
- A longer bound makes a slow run slower to report.

## Resume state

- **Done so far:** planned 2026-10-18 from the Windows session's report. Tasks 01, 02 and 03 implemented 2026-10-18; tasks 04 and 06 implemented 2026-10-19 on Softov's Windows machine. An ACP server is stopped on Windows, and what it leaves running is ended after it exits. A tree's removal no longer deletes the checkout's `node_modules` through a junction. Tasks 07, 08 and 09 implemented 2026-10-19: a changeset's sides and a write through the host name Windows paths, a test no longer reads the machine's git config or keys, and the update and control tests run on Windows. Tasks 10 and 11 implemented 2026-10-19: the daemon tests stop what they start, and a host path is absolute by the host's rule. Task 12 implemented 2026-10-19: a client's path is read by the host's rules. Task 13 implemented 2026-10-19: a path is compared with a pattern, a key or a mount in the host's spelling, and every file the Windows run of PR 25 failed passes on its own. Every process spawn in `packages/*/src` sets `windowsHide: true`, including three the task's Files list did not name. `mountParts` in `manifest.ts` reads a drive letter as part of a mount's source, and the dev container's two mount spellings use it. The `check-windows` job's test bound is 600 s; `check` and `processes` keep 300 s.
- **Next action:** task 03 step 2 - push the branch through a PR and read the Windows job's log. That is Softov's. Its failures are tasks 04 and 05.
- **Open questions:** none.
- **Watch out for:** this host cannot run Windows. Each Windows check is a CI run or Softov's Windows machine. Task 02's two cases ask `mountParts` directly: a drive path cannot exist on this host. The end-to-end check and `nested-start.test.ts` are for the Windows run.

## Final verification checklist

- [ ] No spawn in `packages/*/src` lacks `windowsHide`.
- [ ] `nested-start.test.ts` passes on Windows.
- [ ] The Windows job ends without exit 124.
- [ ] No `EBUSY` in the Windows job's log.
- [ ] `config-layers.test.ts` passes on Windows.
- [ ] The Linux jobs pass.
- [ ] `plans/index.md` updated.
