---
title: A client restarts the daemon over AHP - implemented
date: 2026-10-30
refs:
  - git://880cf374 - the last commit of the code, before the plan's own records
  - "[code://packages/server/src/commands/restart.ts](../../../../packages/server/src/commands/restart.ts) - `servedRestart`, `restartMethod` and `busy`"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts) - where `x-ahpd/restart` is registered"
  - "[code://packages/server/test/host-restart-method.test.ts](../../../../packages/server/test/host-restart-method.test.ts) - the cases of the command"
  - "[code://packages/server/test/server-restart.test.ts](../../../../packages/server/test/server-restart.test.ts) - the HTTP refusal, and the signal and pipe cases that keep `--force`"
  - "[code://docs/server/RUN.md](../../../../docs/server/RUN.md) - the Restart section, which names the command"
  - "[code://docs/updates/v0_14.md](../../../../docs/updates/v0_14.md) - the line under 0.14"
---

A client of the daemon's AHP restarts it with `x-ahpd/restart`, with the checks and the `force` of `ahpd restart`.
Only the host's own connection may send it, and the answer is `{ restarting: true, pid }`.
A refusal while a turn runs names the sessions and says `force: true`, over AHP and over `POST /api/restart`.
The terminal, the signals, the control pipe and `ahpd update` keep `--force`.

## What was built

- [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts) - `servedRestart(served, force)` holds the served checks: the record must name this daemon, and a turn running refuses it unless the caller forces. It answers `{ restarting, pid }` and asks `served.restart`, which defers the restart until the answer has gone. `restartMethod(served)` is the AHP method. It takes `config:write`, refuses a reader and an owner that is not `root:` with `deploymentOnly`, and answers any conflict as an `RpcError`. `busy(turning, forces)` takes how the caller forces, with `--force` as the default. The served branch of `declareRestart` calls `servedRestart`, so the API and AHP run one path.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `x-ahpd/restart` is registered beside `x-ahpd/update`, with `by: 'ahpd'`.
- [`code://packages/server/test/host-restart-method.test.ts`](../../../../packages/server/test/host-restart-method.test.ts) - the cases below, through a host in this process.
- [`code://packages/server/test/server-restart.test.ts`](../../../../packages/server/test/server-restart.test.ts) - the HTTP refusal now says `force: true`. The signal and pipe cases are unchanged and keep `--force`.
- [`code://docs/server/RUN.md`](../../../../docs/server/RUN.md) and [`code://docs/updates/v0_14.md`](../../../../docs/updates/v0_14.md) - the command, its grant, its answer and its way to force.

## Verified

- `packages/server/test/host-restart-method.test.ts`, 7 cases. A person and an owner `user:ada` are refused with the `deploymentOnly` words. The root connection gets `{ restarting: true, pid }`, and `served.restart` gets the recorded argv. A turn running refuses with `force: true` and restarts nothing. `force: true` restarts while a turn runs. A daemon in the foreground gets `FOREGROUND`. A param other than `force: true` is not a force.
- `packages/server/test/server-restart.test.ts`, 61 cases: `POST /api/restart` refuses with `A turn is running in ahp-session:/a, ahp-session:/b; pass force: true to restart anyway.`; the signal and control-pipe refusals still say `pass --force`.
- `packages/server/test/host-update-method.test.ts` and `packages/server/test/server-update.test.ts`, 25 cases: the update is unchanged, which is the same path `served.restart` serves.
- `pnpm exec tsc -p tsconfig.json --noEmit` prints nothing.
- `node tools/schema.mjs` writes the strict schema.

## Departures from the plan

- Task 02, step 2 - the plan says to pass `force: true` when `context.surface` is `http`. The API's surface value in `@cofold/remote` is `remote`, not `http`. `servedRestart` is reached only by the API and by AHP, so it passes `force: true` without reading the surface. The terminal branch of `declareRestart` is the only command-line path.
- The plan's task 01 names `restartMethod(served)` and task 02 says both surfaces call `servedRestart`. The helper is `servedRestart`, and the websocket command calls it directly, so the two surfaces cannot disagree.

## Left for later

- The plan's final checklist was not run on a daemon from `ahpd start`. The cases drive the same paths with a record this test writes and a restart that records what it was asked.
- The plan folder and `packages/server/test/host-restart-method.test.ts` are untracked. `git add` is denied in this session, so run `git add .project/plans/daemon/20261030-0635-a-client-restarts-the-daemon packages/server/test/host-restart-method.test.ts` to commit them with task 01.
