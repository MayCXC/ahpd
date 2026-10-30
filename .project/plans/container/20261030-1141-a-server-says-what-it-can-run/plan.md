---
title: A server says what it can run
domain: container
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
requires:
  - plans/container/05-p9-an-ssh-machine-runs-a-nested-host/plan.md
changes: []
creates: []
decisions:
refs:
  - "[code://packages/computer/src/ssh.ts#L48-L130](../../../../packages/computer/src/ssh.ts#L48-L130) - `SshMachine` and `machinesOf`, the boxes in `ssh.machines`"
  - "[code://packages/computer/src/ssh.ts#L213-L300](../../../../packages/computer/src/ssh.ts#L213-L300) - `sshRuntime`, which runs a command on a box"
  - "[code://packages/computer/src/ssh.ts#L499-L560](../../../../packages/computer/src/ssh.ts#L499-L560) - `STATS` and `statsFrom`, a script sent to a box and its answer parsed, the pattern for the check"
  - "[code://packages/computer/src/provider.ts#L175-L185](../../../../packages/computer/src/provider.ts#L175-L185) - the leaves under a machine: `status`, `capabilities`, `stats`, `state`"
  - "[code://packages/computer/src/provider.ts#L390-L420](../../../../packages/computer/src/provider.ts#L390-L420) - where a leaf is read"
  - "[code://packages/computer/test/fixtures/ssh.mjs](../../../../packages/computer/test/fixtures/ssh.mjs) - the fake `ssh` the tests use"
  - "[code://.project/ideas/a-server-check-installs-what-is-missing.md](../../../ideas/a-server-check-installs-what-is-missing.md) - the install step that waits"
---

## Goal

An operator names a box in `ssh.machines`, such as `dev02`.
Reading `computer://ssh.dev02/server` tells what the box can run: Docker, KVM, libvirt, CPUs, memory, disk, architecture and ahpd.
Each missing piece comes with the commands that install it, for the operator to run.
ahpd installs nothing on the box.
A Docker profile ([p8](../05-p8-a-profile-on-another-docker/plan.md)) and a VM profile ([the VM plan](../20261030-1141-a-vm-is-made-on-a-server/plan.md)) name the box as `server`.
Both use the check before they make a machine there.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "STATS|statsFrom" packages/computer/src/ssh.ts` - a fixed script goes to a box over ssh, and its lines are parsed; the check is the same shape.
- `rg -n "name: '" packages/computer/src/provider.ts` - the leaves a machine has today.
- `rg -n "server" packages/computer/src/manifest.ts` - no profile field names a box.

### Runtime path

```
read computer://ssh.<name>/server -> [new] checkServer(box) -> ssh <box> sh -s < check script
  -> key=value lines -> [new] ServerReport -> [new] fixesOf(report) -> JSON with each item, ok or not, and its fix
profile.server = <name> -> [new] requireOn(box, needs) before the first create on the box -> refused with the fixes when a need is missing
```

### Gaps

- Nothing tells an operator what a box lacks before a machine fails on it.
- No profile names a box from `ssh.machines`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The check reports what a box has and prints the commands that fix each missing piece; it installs nothing | Softov, 2026-10-30: "check and print fix commands" | 01 |
| An install step is an idea for later | Softov, 2026-10-30: "add a idea for a install what is missing" | - |
| A Docker profile and a VM profile name the box as `server`, an entry of `ssh.machines` | Softov, 2026-10-30: "It names the ssh box" | 03 |
| The server check is its own plan, beside the Docker plan and the VM plan | Softov, 2026-10-30: "Three plans: check, Docker, VM" | - |
| The check is one POSIX `sh` script sent on stdin, and its answer is `key=value` lines | (defaulted: the shape of `STATS`, and a box needs nothing of ahpd for it) | 01 |
| Fix commands are written for Debian and Ubuntu; on another system the fix names the package only | (defaulted: dev02 is Debian 13, and a guessed command for another system is worse than none) | 01 |
| The report is a leaf `server` under each ssh machine, run fresh on each read | (defaulted: a leaf is how a client reads a machine's facts today) | 02 |
| A profile keeps the last report of its box for 60 seconds, so a burst of creates checks once | (defaulted: a check is one ssh round trip) | 03 |

## Proposed architecture

- **Data flow** - `servercheck.ts` holds the script, `checkServer(run)`, `ServerReport`, `fixesOf(report, os, user)` and `serverGate(check)`. The ssh runtime gives it a function that runs the script on one box.
- **Report items** - `os`, `arch`, `cpus`, `memory`, `disk`, `docker`, `dockerAccess`, `kvm`, `libvirt`, `libvirtAccess`, `ahpd`. Each item has `ok`, what was found, and `fix`, a list of command lines.
- **Layer responsibilities** - `@ahpd/computer` only.
- **Source-of-truth files** - [`code://packages/computer/src/ssh.ts`](../../../../packages/computer/src/ssh.ts), `CREATE: packages/computer/src/servercheck.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The check runs on a box and says each fix](task-01-the-check-runs-on-a-box.md) | done | - |
| [02 - The report is a leaf of the ssh machine](task-02-the-report-is-a-leaf.md) | done | 01 |
| [03 - A profile names its server and is checked first](task-03-a-profile-names-its-server.md) | done | 01 |
| [04 - dev02 is checked and fixed by hand](task-04-dev02-is-checked-by-hand.md) | done | 02 |
| [05 - Docs](task-05-docs.md) | done | 03, 04 |

## Risks and tradeoffs

- A fix command can be wrong for a system the check did not expect. The fix names the package alone outside Debian and Ubuntu.
- `docker info` as a user outside the `docker` group fails. The check reports this as `dockerAccess`, apart from `docker`, so the fix is the group and not the install.
- A new group takes effect only at the next login. The fix says to log in again.

## Resume state

- **Done so far:** tasks 01 to 05.
- **Next action:** write `implemented.md` and close the plan after the merge.
- **Open questions:** none.
- **Watch out for:** the script must run under `sh`, not `bash`, and every probe must not fail the script when a program is absent.

## Final verification checklist

- [x] Reading `computer://ssh.dev02/server` on a test daemon lists each item, and each missing item has its fix.
- [x] After Softov runs the fixes, the same read says each item is ok.
- [ ] A Docker profile on a box without Docker is refused with the fix lines, and nothing is made.
