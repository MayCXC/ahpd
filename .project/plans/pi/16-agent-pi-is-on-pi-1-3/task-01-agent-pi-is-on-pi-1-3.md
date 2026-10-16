---
title: agent-pi is on pi 1.3.0
status: todo
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
