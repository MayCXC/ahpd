---
title: agent-claude is on the Agent SDK 0.3.301
status: done
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/probe.ts#L58](../../../../packages/agent-claude/src/probe.ts#L58) - the probe's query"
---

## Objective

agent-claude depends on the Claude Agent SDK 0.3.301, and the probe names its permission mode.

## Files

- `UPDATE: packages/agent-claude/package.json:59` - the SDK range to `^0.3.301`.
- `UPDATE: package.json:38` - the SDK range to `^0.3.301`.
- `UPDATE: pnpm-workspace.yaml` - one release-age exclude for the SDK and one for each of its 8 binaries at 0.3.301.
- `UPDATE: pnpm-lock.yaml` - regenerated.
- `UPDATE: packages/agent-claude/src/probe.ts:58` - the options get `permissionMode: 'default'`.

## Steps

1. Set the SDK range in `packages/agent-claude/package.json` and in the root `package.json` to `^0.3.301`.
2. Run `pnpm install`, and keep the 9 excludes that pnpm adds to `pnpm-workspace.yaml`.
3. Add `permissionMode: 'default'` to the probe's query options.
4. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- `pnpm -s exec vitest run packages/agent-claude packages/sdk/test/host-tools.test.ts` passes.

## Resume

- **Done:** 2026-10-16. The SDK range is `^0.3.301` in `packages/agent-claude/package.json` and in the root `package.json`, and the lock moves from 0.3.278 to 0.3.301. pnpm added the 9 release-age excludes. The probe sends `permissionMode: 'default'`.
- **Gates:** build, typecheck, boundary and schema pass. The test gate passes with 5102 tests.
