---
title: agent-acp is on the ACP SDK 1.8.0 - implemented
date: 2026-10-16
refs:
  - git://41e748fa
  - "[code://packages/agent-acp/package.json](../../../../packages/agent-acp/package.json)"
  - npm://@agentclientprotocol/sdk@1.8.0 - schema 1.25.0
---

agent-acp runs on `@agentclientprotocol/sdk` 1.8.0, and its tests run on that version.

## What was built

- [`code://packages/agent-acp/package.json`](../../../../packages/agent-acp/package.json) - the SDK range is `^1.8.0`, in `41e748fa`.
- `pnpm-lock.yaml` - the lock moves from 1.6.0 to 1.8.0 for agent-acp only.

## Verified

- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and `node tools/schema.mjs` pass.
- The test gate passes with 5102 tests. `nested-proxy.test.ts` failed once under load, and it passes alone with 49 tests.

## Departures from the plan

- none.

## Left for later

- The SDK's new features - see [deferred.md](deferred.md).
