---
title: dev02 is checked and fixed by hand
status: done
depends: [task-02-the-report-is-a-leaf.md]
layer: "dev02 (by hand)"
refs:
  - "[code://.project/plans/container/05-p8-a-profile-on-another-docker/plan.md](../05-p8-a-profile-on-another-docker/plan.md) - dev02 is the test box for the Docker plan"
---

## Objective

dev02 is a box in `ssh.machines` on a test daemon, and its `server` leaf says each item is ok.
Softov runs each fix the report gives, since the box is his.

## Files

- None in the repository; the report before and after goes into this task's Resume.

## Steps

1. Get dev02's ssh destination from Softov, and make sure this host reaches it without a password.
2. Start a test daemon with its own `XDG_CONFIG_HOME` and `XDG_STATE_HOME`, and `ssh.machines.dev02` in its computer options.
3. Read `computer://ssh.dev02/server`, and give Softov each fix line it prints.
4. Wait for Softov to say he ran them.
5. Read the leaf again, and record both reports here.

## Validation

- The second read says `docker`, `dockerAccess`, `kvm`, `libvirt` and `libvirtAccess` are ok.

## Resume

- Done on 2026-10-30.
- Both reads went through the computer plugin, loaded in-process with its own `XDG_CONFIG_HOME`, `XDG_STATE_HOME` and state folder, over the real ssh to `dev02`.
- The listing of `computer://ssh.dev02` was `status capabilities stats state server`.
- First read: Debian 13, x86_64, 6 CPUs, 11.7 GiB, Docker 29.8.1 with access. Not ok: `kvm` (no access), `libvirt` and `libvirtAccess` (not installed), `ahpd` (not installed).
- Softov ran the fix lines: the `kvm` and `libvirt` groups, the libvirt `apt` line and the ahpd install.
- The install found ahpd 0.11.0 already in `~/.local/node/bin` and updated it to 0.14.0.
- So the first `ahpd` item was wrong: `ssh box cmd` does not have `~/.local/node/bin` on its PATH. The script now adds that folder at the end of PATH, with a test.
- Second read: every item is ok, with `libvirt` 11.3.0 and `ahpd` 0.14.0.
