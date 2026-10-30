---
title: The check runs on a box and says each fix
status: todo
depends: []
layer: "computer"
refs:
  - "[code://packages/computer/src/ssh.ts#L499-L560](../../../../packages/computer/src/ssh.ts#L499-L560) - `STATS` and `statsFrom`, the shape to copy"
  - "[code://packages/computer/src/ssh.ts#L213-L300](../../../../packages/computer/src/ssh.ts#L213-L300) - `sshRuntime`, which runs a command on a box"
---

## Objective

`checkServer(run)` sends one `sh` script to a box and answers a `ServerReport`.
`fixesOf(report, user)` adds to each missing item the commands that install or allow it.

## Files

- `CREATE: packages/computer/src/servercheck.ts` - the script, `ServerReport`, `checkServer(run)`, `reportFrom(text)` and `fixesOf(report, user)`.
- `UPDATE: packages/computer/src/ssh.ts:213-300` - `sshRuntime` answers `check(name)`, which runs the script on that box through `checkServer`.
- `CREATE: packages/computer/test/computer-servercheck.test.ts` - the parse and the fixes.
- `UPDATE: packages/computer/test/fixtures/ssh.mjs` - the fake answers the check script with lines a test sets.

## Steps

1. Write the script so each probe prints `key=value` and never stops the script when a program is absent.
2. Probe `ID` and `ID_LIKE` from `/etc/os-release`, `uname -m`, `nproc`, and `MemTotal` from `/proc/meminfo`.
3. Probe the free space of the home folder and of `/var/lib` with `df -Pk`.
4. Probe `docker version --format '{{.Client.Version}}'`, then `docker info` for access to the daemon.
5. Probe that `/dev/kvm` exists and that the user can read and write it.
6. Probe `virsh --version`, then `virsh -c qemu:///system list` for access.
7. Probe `ahpd --version` and the user name with `id -un`.
8. Write `reportFrom(text)`, which keeps known keys and ignores the rest.
9. Write `fixesOf` for an `os` whose `ID` or `ID_LIKE` holds `debian` or `ubuntu`.
10. For a missing Docker, give `sudo apt install docker.io` and `sudo usermod -aG docker <user>`.
11. For Docker without access, give `sudo usermod -aG docker <user>` and say to log in again.
12. For a missing libvirt, give `sudo apt install libvirt-daemon-system qemu-system-x86 qemu-utils virtinst cloud-image-utils`.
13. For libvirt without access, give `sudo usermod -aG libvirt <user>` and say to log in again.
14. For a missing `/dev/kvm`, say the CPU or its host does not give KVM, with no command.
15. For a missing ahpd, give the one-line install from `docs/`.
16. On another system, name the package only.
17. Write the tests.

## Validation

- A fake answer with every item present gives a report where each item is ok and has no fix.
- A fake answer with no Docker gives the two Docker lines, with the box's user in the `usermod` line.
- A fake answer on a non-Debian `ID` gives the package name and no `apt` line.
- `reportFrom` ignores an unknown key in the answer.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume
