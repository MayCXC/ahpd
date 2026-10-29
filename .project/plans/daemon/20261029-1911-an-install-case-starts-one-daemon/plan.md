---
title: An install case starts one daemon
domain: daemon
status: built
priority: medium
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - "[code://packages/server/test/fixtures/systemctl-fake/systemctl#L1-L10](../../../../packages/server/test/fixtures/systemctl-fake/systemctl#L1-L10) - the stand-in manager, which does what `SYSTEMCTL_DO` says on every call"
  - "[code://packages/server/test/server-cli-service.test.ts#L23-L37](../../../../packages/server/test/server-cli-service.test.ts#L23-L37) - `started()`, the action an install case gives it: the unit's `ExecStart`, in the background"
  - "[code://packages/server/src/service.ts#L88-L92](../../../../packages/server/src/service.ts#L88-L92) - `installCalls`: `daemon-reload`, then `enable --now`"
  - "[code://packages/server/src/daemon.ts#L594-L602](../../../../packages/server/src/daemon.ts#L594-L602) - `claim` reads the record, and then writes it"
  - "[code://packages/server/test/cli.ts#L81-L94](../../../../packages/server/test/cli.ts#L81-L94) - `afterEach` stops the pids a case kept and the ones its log names"
  - https://www.freedesktop.org/software/systemd/man/latest/systemctl.html - which calls start or stop a unit, and which only reload the manager
---

## Goal

An install case at the command line starts one daemon, as the manager the stand-in plays does.
No case leaves a daemon running after it ends.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "SYSTEMCTL_DO|fakeSystemctl" packages` - the service cases and the restart cases give the stand-in its action, and only on calls that start or stop a unit.

### Runtime path

```
service install -> installCalls -> systemctl --user daemon-reload -> SYSTEMCTL_DO: a daemon starts
                                -> systemctl --user enable --now ahpd -> SYSTEMCTL_DO: a second daemon starts
second daemon -> claim -> the record names the first, which runs -> it stamps and exits 1
both daemons at claim at once -> both write the record -> the one it does not name runs past the case
```

### Gaps

- The stand-in does the case's action on `daemon-reload`, which starts no unit.
- A daemon the record does not name is in no case's list, so `afterEach` never stops it.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The stand-in does the case's action on a call that starts or stops a unit: `start`, `stop`, `restart`, and a call with `--now` | systemctl's `daemon-reload` reloads the manager's configuration, and `--now` with `enable` or `disable` also starts or stops the units (https://www.freedesktop.org/software/systemd/man/latest/systemctl.html) | 01 |
| The case counts the daemons the stand-in starts for one install | The number left running after an install depends on which daemon reaches `claim` first, so it is one in most runs either way | 01 |

## Proposed architecture

- **Data flow** - the stand-in's arguments, then whether the call starts or stops a unit, then `SYSTEMCTL_DO`.
- **Layer responsibilities** - server tests: `fixtures/systemctl-fake/systemctl` and `server-cli-service.test.ts`.
- **Source-of-truth files** - [`code://packages/server/test/fixtures/systemctl-fake/systemctl`](../../../../packages/server/test/fixtures/systemctl-fake/systemctl)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The stand-in acts on a call that starts or stops a unit](task-01-the-stand-in-acts-on-a-call-that-starts-or-stops-a-unit.md) | done | - |

## Risks and tradeoffs

- A case that wants the stand-in to act on another call has to be one systemctl documents as starting or stopping a unit.

## Resume state

- **Done so far:** planned and built 2026-10-29. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the uninstall cases' action is a signal, given on `disable --now`.

## Final verification checklist

- [x] The case sees two starts without task 01, and one with it.
- [x] `server-cli-service.test.ts` and `server-cli-restart.test.ts` pass, and leave no daemon running.
- [x] The server suite passes, and leaves no daemon running.
