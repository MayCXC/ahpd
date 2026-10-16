---
title: The docs say how to run it as a service
status: todo
depends:
  - task-03-service-install-writes-a-systemd-unit.md
  - task-04-service-install-writes-a-launch-agent.md
layer: docs
refs:
  - "[code://docs/server/RUN.md](../../../../docs/server/RUN.md) - start, stop and restart"
  - "[code://docs/server/REFERENCE.md](../../../../docs/server/REFERENCE.md) - the command reference"
---

## Objective

docs/server/RUN.md has a section on the service.
It says how to install it, what `stop` and `restart` do, where its log is, and how to remove it.

## Files

- `UPDATE: docs/server/RUN.md` - a `Service` section after `Restart`.
- `UPDATE: docs/server/REFERENCE.md` - the generated rows for `service install` and `service uninstall`.

## Steps

1. Write the `Service` section, with one example for Linux and one for macOS.
2. Say that the service gets the `PATH` of the shell that ran `service install`.
3. Say that a second `service install` writes the file again after an upgrade.
4. Generate the reference again, and check the two new rows.
5. Set this task and the plan row to `implemented`.

## Validation

- RUN.md names both commands, the log and the environment.
- The reference holds `service install` and `service uninstall`.

## Resume
