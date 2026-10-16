---
title: agent-pi is on pi 1.3.0
status: done
depends: []
layer: "agent-pi"
refs:
  - "[code://packages/agent-pi/src/backend.ts#L281](../../../../packages/agent-pi/src/backend.ts#L281) - `steer`, which now returns a disposition"
  - "[code://packages/agent-pi/src/machine.ts#L26](../../../../packages/agent-pi/src/machine.ts#L26) - `PI_KEY_VARIABLES`"
---

## Objective

agent-pi depends on pi 1.3.0, and it builds and passes its tests on it.

## Files

- `UPDATE: packages/agent-pi/package.json:47-56` - `engines` to `>=22.19.0`, and both pi ranges to `^1.3.0`.
- `UPDATE: package.json:39` - pi-coding-agent to `^1.3.0`.
- `UPDATE: pnpm-workspace.yaml` - one release-age exclude for each of the 7 pi packages at 1.3.0.
- `UPDATE: pnpm-lock.yaml` - regenerated.
- `UPDATE: packages/agent-pi/src/backend.ts:281` - `steer` resolves to `undefined`.
- `UPDATE: packages/agent-pi/src/machine.ts:26` - `TYPESAFE_API_KEY` in sorted order.
- `UPDATE: packages/agent-pi/test/fake-pi.ts:102-105` - `agent_settled` carries `aborted`.
- `UPDATE: packages/agent-pi/test` - the 30 other `agent_settled` sites carry `aborted`.

## Steps

1. Set both pi ranges in `packages/agent-pi/package.json` to `^1.3.0`, and set the root dev dependency to the same.
2. Set `engines.node` in `packages/agent-pi/package.json` to `>=22.19.0`.
3. Run `pnpm install`, and keep the 7 excludes that pnpm adds to `pnpm-workspace.yaml`.
4. Change `steer` in `backend.ts` to `session.steer(...).then(() => undefined)`.
5. Add `'TYPESAFE_API_KEY'` to `PI_KEY_VARIABLES` in its sorted place.
6. Add `aborted: false` to each fake `agent_settled`, and `aborted: true` where the test models a cancel.
7. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- `pnpm -s exec vitest run packages/agent-pi` passes, with all 197 tests.
- `pnpm why brace-expansion` shows 5.0.12 or later under pi-coding-agent.

## Resume

- **Done:** 2026-10-16. Both pi ranges and the root dev dependency are `^1.3.0`, and `engines.node` is `>=22.19.0`. pnpm added the 7 release-age excludes. `steer` resolves to `undefined`, and `TYPESAFE_API_KEY` is in `PI_KEY_VARIABLES`.
- **Departure:** the tests have 31 fake `agent_settled` sites, not 32. The 4 sites in a fake `abort` say `aborted: true`, and the other 27 say `aborted: false`.
- **Gates:** build, typecheck, boundary and schema pass. The test gate passes with 5102 tests, and agent-pi passes with 197 tests. `pnpm why brace-expansion` shows only 5.0.12, under pi-coding-agent 1.3.0 and its minimatch 10.2.6.
