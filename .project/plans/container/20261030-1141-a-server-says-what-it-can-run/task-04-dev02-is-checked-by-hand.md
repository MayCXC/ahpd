---
title: dev02 is checked and fixed by hand
status: todo
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
