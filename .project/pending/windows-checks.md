---
title: Check stop, restart and shutdown on Windows
plans:
  - plans/daemon/20-stop-and-restart-reach-a-daemon-on-windows/plan.md
  - plans/daemon/21-the-shutdown-method-stops-the-daemon-gracefully/plan.md
---

# Check stop, restart and shutdown on Windows

These checks need a Windows machine. They passed on Linux on 2026-10-15, at `3cf1dc13`. The Windows machine was off, so they wait for the next pass.

## Set up

1. Clone `git@github.com:softov/ahpd.git` and check out `main`.
2. Run `pnpm install` and `pnpm build`.
3. Write a token to a file, for example `echo chk-token > %TEMP%\ahpd-token`.
4. Use a config folder of its own: `set XDG_CONFIG_HOME=%TEMP%\ahpd-chk`.
5. Run `node packages\server\dist\main.js paths add <folder>`, then add `<clone>\packages\agent-claude\dist\index.js` to `"plugins"` in `%TEMP%\ahpd-chk\ahpd\config.json`.

Below, `ahpd` means `node packages\server\dist\main.js`.

## daemon/20: stop with a token file

1. Run `ahpd start --port 39111 --connection-token-file %TEMP%\ahpd-token`.
2. Open a session in that folder with ahpc or VS Code, and start a turn.
3. Run `ahpd stop`.
4. Check that `daemon.log` shows `stopping` and then `stopped`.
5. Check that `daemon.json` is gone, and that `ahpd status --json` prints `{"running":false}`.

## daemon/20: the pipe names itself in the restart lines

1. Start the daemon as above, and start a turn.
2. Run `ahpd restart`. It must exit 1 and name the session.
3. Check that the log says `restart refused (control pipe)`.
4. Run `ahpd restart --force`.
5. Check that the log says `restart: stopping (control pipe, forced)`, and that the successor comes up.

## daemon/21: the shutdown method runs the way down

1. Start the daemon as above.
2. Send `initialize` and then `shutdown` over the WebSocket, or close VS Code's agent host from the window.
3. Check that the client gets an answer to `shutdown`.
4. Check that the log shows `stopping` and then `stopped`. A hard kill writes neither line.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
