---
title: The docs describe stop and restart on Windows
status: todo
depends: [task-04-stop-waits-for-the-daemon-to-exit.md]
layer: "docs"
refs:
  - "[code://docs/DAEMON.md#L225-L245](../../../../docs/DAEMON.md#L225-L245) - how a restart reaches the daemon"
---

## Objective

`docs/DAEMON.md` says how stop and restart reach the daemon on Windows, and that `ahpd stop` waits.

## Files

- `UPDATE: docs/DAEMON.md:225-245` - the pipe on Windows, the key in the record, and the wait in `stop`.
- `UPDATE: packages/server/README.md:47` - `ahpd stop` waits for the daemon to exit.

## Steps

1. Add one paragraph on Windows after the paragraph on signals in `docs/DAEMON.md`.
2. Say that `daemon.json` holds the pipe and the key, and that no command prints them.
3. Say that `ahpd stop` waits up to 30 seconds and then kills the process.
4. Run `lint-prose` on nothing; these files are not under `.project/`.

## Validation

- `rg -n "pipe" docs/DAEMON.md` finds the paragraph.
- Each sentence is short and direct, with no em dash and no hard wrap.

## Resume
