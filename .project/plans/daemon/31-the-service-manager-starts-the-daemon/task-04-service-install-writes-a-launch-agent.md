---
title: Service install writes a LaunchAgent
status: todo
depends:
  - task-01-a-supervised-daemon-writes-its-record.md
  - task-02-stop-and-restart-ask-the-manager.md
layer: server
refs:
  - "[code://packages/server/src/commands/start.ts#L80-L146](../../../../packages/server/src/commands/start.ts#L80-L146) - `daemon.start`, the lines it prints"
  - https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html - the plist keys
---

## Objective

On macOS, `ahpd service install` writes `~/Library/LaunchAgents/dev.ahpd.daemon.plist`, loads it, waits for the daemon, and prints its address.
`ahpd service uninstall` unloads it and removes the file.

## Files

- `UPDATE: packages/server/src/service.ts` - `plistOf`, the plist text, and `install` and `uninstall` for launchd.
- `UPDATE: packages/server/src/commands/service.ts` - choose launchd on `darwin`.
- `UPDATE: packages/server/test/service.test.ts` - the plist text and the launchd calls.

## Steps

1. Write the tests first.
2. Write `plistOf` with `ProgramArguments`, `RunAtLoad`, and `AHPD_SERVICE=launchd` in `EnvironmentVariables`.
3. Write `KeepAlive` with `SuccessfulExit` false, and the `PATH` of the shell in `EnvironmentVariables`.
4. Send the daemon's output to `daemon.log`, with `StandardOutPath` and `StandardErrorPath`.
5. Load the file with `launchctl bootstrap gui/<uid>`, then wait for the record as task 03 does.
6. Unload it with `launchctl bootout gui/<uid>/dev.ahpd.daemon`, then remove the file and the record.
7. Set this task and the plan row to `implemented`.

## Validation

- A test: the plist names `process.execPath`, the ahpd binary, the configuration file and the log.
- A test: install calls `bootstrap`, and uninstall calls `bootout`.
- By hand on macOS: install, `ahpd status`, logout and login, `ahpd restart`, uninstall.

## Resume
