---
title: The stand-in acts on a call that starts or stops a unit
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/test/fixtures/systemctl-fake/systemctl#L1-L10](../../../../packages/server/test/fixtures/systemctl-fake/systemctl#L1-L10) - the stand-in"
  - "[code://packages/server/test/server-cli-service.test.ts#L23-L37](../../../../packages/server/test/server-cli-service.test.ts#L23-L37) - `started()`"
  - "[code://packages/server/test/server-cli-service.test.ts#L90-L109](../../../../packages/server/test/server-cli-service.test.ts#L90-L109) - the last install case, which the new one follows"
---

## Objective

The stand-in systemctl does what `SYSTEMCTL_DO` says only on a call that starts or stops a unit.
An install then starts the daemon once, on `enable --now`, and not again on `daemon-reload`.

## Files

- `UPDATE: packages/server/test/fixtures/systemctl-fake/systemctl` - run `SYSTEMCTL_DO` on `start`, `stop`, `restart` and a call with `--now`.
- `UPDATE: packages/server/test/server-cli-service.test.ts:23-37` - say that `started()` is what the stand-in does when it is asked to start the unit.
- `UPDATE: packages/server/test/server-cli-service.test.ts` - a case that counts the daemons one install starts.

## Steps

1. Add a case after the last install case. Its action writes a line to a file in the case's home, and runs `started()`.
2. Expect `daemon-reload` among the calls, and one line in the file.
3. Run `server-cli-service.test.ts`, and see the case fail with two lines.
4. In the stand-in, run `SYSTEMCTL_DO` only when an argument is `start`, `stop`, `restart` or `--now`.
5. Say so in the stand-in's comment, with the page of systemctl it follows, and in the comment of `started()`.
6. Run `server-cli-service.test.ts` and `server-cli-restart.test.ts`, and list the daemons left running.

## Validation

- The new case fails before step 4, and passes after it.
- Every other case in the two files passes unchanged.
- No run of the two files leaves a daemon running.

## Resume

