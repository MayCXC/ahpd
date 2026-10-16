---
title: agent-pi is on pi 1.3.0 - implemented
date: 2026-10-16
refs:
  - git://48417898
  - "[code://packages/agent-pi/package.json](../../../../packages/agent-pi/package.json)"
  - "[code://packages/agent-pi/src/backend.ts](../../../../packages/agent-pi/src/backend.ts)"
  - "[code://packages/agent-pi/src/machine.ts](../../../../packages/agent-pi/src/machine.ts)"
  - npm://@earendil-works/pi-coding-agent@1.3.0 - the version agent-pi runs on
---

agent-pi runs on `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent` 1.3.0, and its tests run on that version.
The brace-expansion audit finding under pi-coding-agent is gone.

## What was built

- [`code://packages/agent-pi/package.json`](../../../../packages/agent-pi/package.json) - both pi ranges are `^1.3.0`, and `engines.node` is `>=22.19.0`, in `48417898`.
- [`code://package.json`](../../../../package.json) - the root dev dependency on pi-coding-agent is `^1.3.0`.
- [`code://pnpm-workspace.yaml`](../../../../pnpm-workspace.yaml) - the release-age excludes for the 7 pi packages at 1.3.0.
- [`code://packages/agent-pi/src/backend.ts`](../../../../packages/agent-pi/src/backend.ts) - `steer` drops the disposition that pi now returns.
- [`code://packages/agent-pi/src/machine.ts`](../../../../packages/agent-pi/src/machine.ts) - `PI_KEY_VARIABLES` holds `TYPESAFE_API_KEY`.
- [`code://packages/agent-pi/test/fake-pi.ts`](../../../../packages/agent-pi/test/fake-pi.ts) and the other agent-pi tests - each fake `agent_settled` carries `aborted`.

## Verified

- Build, typecheck, boundary and schema pass.
- The test gate passes with 5102 tests, and agent-pi passes with 197 tests.
- `pnpm why brace-expansion` shows only 5.0.12, under pi-coding-agent 1.3.0.
- By hand on 2026-10-16, on a test daemon built from `main` at `ba7daf5c`, on port 39222, with ahpc.
- A turn on `openrouter/moonshotai/kimi-k2.6` answered "ready".
- A steer sent while a turn ran the bash call `sleep 8; echo first` arrived in the same turn. The turn skipped its second command and ended with STEERED.

## Departures from the plan

- The tests have 31 fake `agent_settled` sites, not 32. The 4 sites in a fake `abort` say `aborted: true`, and the other 27 say `aborted: false`.
- The check by hand ran on a test daemon, and not on Softov's daemon.

## Left for later

- pi's new features - see [deferred.md](deferred.md).
