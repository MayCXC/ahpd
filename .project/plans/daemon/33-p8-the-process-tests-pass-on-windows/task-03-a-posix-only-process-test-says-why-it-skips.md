---
title: A POSIX-only process test says why it skips
status: done
depends: []
layer: tests
refs:
  - "[code://tools/posix.ts#L9](../../../../tools/posix.ts#L9) - `posix`"
  - "[code://packages/server/src/install.ts#L99-L115](../../../../packages/server/src/install.ts#L99-L115) - `launch`, the npm beside Node on Windows"
  - "[code://packages/server/src/commands/restart.ts#L57](../../../../packages/server/src/commands/restart.ts#L57) - `CONTROL_PIPE`, what a restart's receipt names on Windows"
---

## Objective

Each process case that is POSIX by nature skips on Windows with `it.skipIf(!posix)` and its reason beside it, and the one that is not is made portable.

## Files

- `UPDATE: packages/agent-acp/test/agent-acp-blocks.test.ts` - "names a large file, a pipe and a device": a FIFO and `/dev/zero`.
- `UPDATE: packages/sdk/test/nested-process.test.ts` - the inner host that ignores SIGTERM, the configuration folder made `0500`, and the child that closes its stdin, whose closed pipe Windows does not report.
- `UPDATE: packages/server/test/server-cli-restart.test.ts` - the two restart signals, and the two supervised daemons under a stand-in `systemctl`; the stop sent while a restart is stopping expects the `control pipe` receipt on Windows.
- `UPDATE: packages/server/test/server-cli-service.test.ts` - `service install` and `service uninstall`, a systemd unit or a launchd agent, with `describe.skipIf`.
- `UPDATE: packages/server/test/server-cli-verbs.test.ts` - the five plugin cases that run the stand-in npm.
- `UPDATE: packages/server/test/server-http.test.ts` - the five served installs that run the stand-in npm, and the two cases that read the cache folder's `0700`.

## Steps

1. Import `posix` from `tools/posix.ts` with each file's other imports.
2. Put `it.skipIf(!posix)` on each case, or `describe.skipIf(!posix)` on a block whose every case is one, with a comment that names the reason.
3. In "lets a stop sent while a restart is stopping win", wait for `restart: stopping (SIGHUP)` on POSIX and `restart: stopping (control pipe)` on Windows.
4. Run the six files on the Windows VM and on this host.

## Validation

- On the Windows VM: the six files pass, with these skips, and the stop sent while a restart is stopping passes.
- The Linux jobs pass, with no case skipped there.

## Resume

Done 2026-10-20. Not reviewed.
The skips are 1 in `agent-acp-blocks`, 3 in `nested-process` (the closed stdin of task 02 among them), 3 in `server-cli-restart`, 6 in `server-cli-service`, 5 in `server-cli-verbs` and 7 in `server-http`.
On the Windows VM, from `main` at `8ad65e71` with this change copied over: the six files pass with these skips, and the stop sent while a restart is stopping passes with the `control pipe` receipt.
