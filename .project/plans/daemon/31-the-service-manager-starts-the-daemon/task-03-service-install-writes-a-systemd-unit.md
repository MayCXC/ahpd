---
title: Service install writes a systemd unit
status: todo
depends:
  - task-01-a-supervised-daemon-writes-its-record.md
  - task-02-stop-and-restart-ask-the-manager.md
layer: server
refs:
  - "[code://packages/server/src/commands/registry.ts#L56-L74](../../../../packages/server/src/commands/registry.ts#L56-L74) - `cliRegistry`"
  - "[code://packages/server/src/commands/start.ts#L80-L146](../../../../packages/server/src/commands/start.ts#L80-L146) - `daemon.start`, the command shape and the lines it prints"
  - "[code://packages/server/src/daemon.ts#L89](../../../../packages/server/src/daemon.ts#L89) - `READY_TIMEOUT_MS`"
---

## Objective

On Linux, `ahpd service install` writes `~/.config/systemd/user/ahpd.service`, enables it, waits for the daemon, and prints its address.
`ahpd service uninstall` disables the unit, stops the daemon, and removes the file.

## Files

- `CREATE: packages/server/src/commands/service.ts` - the `service install` and `service uninstall` commands.
- `UPDATE: packages/server/src/service.ts` - `unitOf`, the unit text, and `install` and `uninstall` for systemd.
- `UPDATE: packages/server/src/commands/registry.ts:56-74` - declare the `service` group.
- `CREATE: packages/server/test/service.test.ts` - the unit text and the command, with a fake manager.

## Steps

1. Write the tests first.
2. Write `unitOf` with `ExecStart=<node> <ahpd> --config <file>` and `Environment=AHPD_SERVICE=systemd`.
3. Write `Restart=on-failure`, and `Environment=PATH=` with the `PATH` of the shell that runs the install.
4. Refuse `service install` when `ahpd start` already runs a daemon, and name `ahpd stop`.
5. Write the file, then run `systemctl --user daemon-reload` and `systemctl --user enable --now ahpd`.
6. Wait for the record from task 01, with `READY_TIMEOUT_MS`, and print the address and the token line.
7. Write `service uninstall`: `systemctl --user disable --now ahpd`, then remove the file and the record.
8. Say on a machine with no `systemctl` that the command needs systemd, and exit with a configuration failure.
9. Set this task and the plan row to `implemented`.

## Validation

- A test: the unit text names `process.execPath`, the ahpd binary and the configuration file.
- A test: install calls `daemon-reload` and `enable --now`, and prints the address and no token.
- A test: install refuses while a daemon from `ahpd start` runs.
- A test: uninstall calls `disable --now` and removes the file.
- By hand on Debian: install, `ahpd status`, logout and login, `ahpd restart`, uninstall.

## Resume
