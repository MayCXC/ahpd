---
title: A failure has a JSON shape under --json - implemented
date: 2026-10-19
refs:
  - git://20edee91
  - npm://@cofold/terminal@^0.4.0 - `failureOf` and `writeFailure`
  - "[code://packages/server/src/main.ts#L60-L61](../../../../packages/server/src/main.ts#L60-L61) - `fail`, which gives a failure to `writeFailure`"
  - "[code://docs/server/RUN.md](../../../../docs/server/RUN.md) - `Output for scripts`, with the failure line and the kinds"
---

Under `--json`, every failure of `ahpd` is one JSON line on stderr with `message`, `kind` and `exitCode`.
That includes the group hint, the remote surface failure and the token failures that `main.ts` writes before `runEntry`.
Without `--json`, each failure writes the same line as before.

## What was built

- [`code://packages/server/package.json`](../../../../packages/server/package.json) - `@cofold/terminal` is `^0.4.0`.
- [`code://packages/server/src/main.ts`](../../../../packages/server/src/main.ts) - `fail` writes a failure with `writeFailure` in the mode of the line, and exits with `exitCodeFor`. The mode comes from a literal `--json` in the line. The token failures are `ArgumentError`s, and an unreachable daemon exits 4.
- [`code://packages/server/src/commands/status.ts`](../../../../packages/server/src/commands/status.ts) and [`code://packages/server/src/commands/stop.ts`](../../../../packages/server/src/commands/stop.ts) - the result stays on stdout, and the failure goes to stderr as JSON.
- [`code://docs/server/RUN.md`](../../../../docs/server/RUN.md) - the `ahpd --json plugin` example, and a table of the kinds and their exit codes.

## Verified

- `server-cli.test.ts`: `writes one JSON line, and keeps the exit code a thrown failure has`, `writes the same JSON line for a failure the program refuses`, `keeps the status result on stdout and writes the failure to stderr` and `keeps the stop result on stdout and writes the failure to stderr` pass.
- `server-cli-verbs.test.ts`: `writes the group hint as one JSON line under --json` passes for the `user` and `plugin` groups.
- `server-http.test.ts`: `writes the token failure as one JSON line under --json, and keeps exit 2` and `exits 4 under --json when the daemon cannot be reached` pass.
- Softov reviewed the four tasks and approved the close on 2026-10-19.

## Departures from the plan

- The remote surface failure exits with `exitCodeFor` for each error. A `ManifestError` is a plain `Error`, so it exits 1, not 2 as before.
- The cleartext case in `server-cli.test.ts` expects exit 4 now, because an unreachable port is `unavailable`.

## Left for later

- none.
