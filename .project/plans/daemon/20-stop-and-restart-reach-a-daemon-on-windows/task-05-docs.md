---
title: The docs describe stop and restart on Windows
status: done
depends: [task-04-stop-waits-for-the-daemon-to-exit.md]
layer: "docs"
refs:
  - "[code://docs/DAEMON.md#L248-L256](../../../../docs/DAEMON.md#L248-L256) - the pipe on Windows, the key in the record, and the wait in `stop`"
  - "[code://packages/server/src/daemon.ts#L589-L672](../../../../packages/server/src/daemon.ts#L589-L672) - what the paragraph and the two command lists describe"
---

## Objective

`docs/DAEMON.md` says how stop and restart reach the daemon on Windows, and that `ahpd stop` waits.

## Files

- `UPDATE: docs/DAEMON.md:248-256` - the pipe on Windows, the key in the record, and the wait in `stop`.
- `UPDATE: docs/DAEMON.md:168-169` - the command list line for `ahpd stop`, which now says it waits.
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

- **Status:** implemented, and not committed. The files this task changed are `docs/DAEMON.md` and `packages/server/README.md`.
- **Done:** `docs/DAEMON.md` has a paragraph on Windows after the paragraphs on the signal.
  It says `SIGHUP` and `SIGUSR2` cannot be sent there, and that `SIGTERM` is a hard kill.
  It says the daemon takes a stop and a restart on a named pipe, and that the record names the pipe and a key.
  A request is one line of JSON, and the daemon compares the key in constant time.
  It says a refused request runs nothing and is logged without the key, and that no command prints the pipe or the key.
  A second paragraph says `ahpd stop` waits for the process to exit, for up to 30 seconds, and then kills it.
  So `Stopped` is only for a daemon that is gone.
  The command lists in `docs/DAEMON.md` and `packages/server/README.md` say that the stop waits.
- **Placement:** the Windows paragraph sits at the end of the `ahpd restart` section rather than directly under the signals paragraph.
  The paragraph under it begins "Its answer is in `daemon.log`", so a paragraph between them would leave that word with no noun.
  The command list line in `docs/DAEMON.md` was not in the Files list above.
  It is the same list the README carries, and leaving it said a stop returns at once.
- **Verified:** the two files are prose and nothing runs them, so `lint-prose` does not cover them, as step 4 says.
  No test reads either file: `server-commands.test.ts` checks the declared commands, not this list.
  `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/server` pass, 945 cases in 48 files.
- **Left by hand:** the Windows half, which the final list in the plan holds.
- **Next action:** none. The plan awaits review.
