---
title: The service manager starts the daemon
created: 2026-10-14
---

`ahpd service install` writes a systemd user unit on Linux or a LaunchAgent on macOS from the current config.
It enables the unit, waits for the port, and prints the address and the token file.
`ahpd service uninstall` stops it and removes the file.
On Windows the same command could register a scheduled task at logon.

The unit runs `ahpd start` in the foreground with the config file of the install.
So the service and a start by hand serve the same thing.

Two things to settle before a plan:

- Who supervises the process. Today `ahpd stop` and `ahpd restart` own the daemon through `daemon.json`, and a restart starts its successor itself. Under a service manager that restarts on exit, `ahpd stop` would be undone at once, and `ahpd restart` would race the manager. Either the commands ask the manager when a unit is installed, or the unit restarts only on failure.
- What the service's environment is. A unit does not get the login shell's `PATH` or variables, so an agent's CLI or a provider key may be missing. `shellEnv` covers agent shells only; the daemon's own environment needs its own answer.
