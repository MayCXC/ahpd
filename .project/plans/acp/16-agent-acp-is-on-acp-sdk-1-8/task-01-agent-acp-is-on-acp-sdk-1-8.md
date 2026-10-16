---
title: agent-acp is on the ACP SDK 1.8.0
status: done
depends: []
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/package.json#L66](../../../../packages/agent-acp/package.json#L66) - the SDK range"
---

## Objective

agent-acp depends on the ACP SDK 1.8.0, and it passes its tests on it.

## Files

- `UPDATE: packages/agent-acp/package.json:66` - the SDK range to `^1.8.0`.
- `UPDATE: pnpm-lock.yaml` - regenerated.

## Steps

1. Set the SDK range in `packages/agent-acp/package.json` to `^1.8.0`.
2. Run `pnpm install`.
3. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- `node tools/schema.mjs`, then `pnpm -s exec vitest run packages/agent-acp`, passes.

## Resume

- **Done:** 2026-10-16. The SDK range is `^1.8.0`, and the lock moves from 1.6.0 to 1.8.0 for this package only.
- **Gates:** build, typecheck, boundary and schema pass. The test gate passes with 5102 tests. `nested-proxy.test.ts` failed once under load and passes alone with 49 tests.
