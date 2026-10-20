---
title: One helper names a POSIX-only case
status: done
depends: []
layer: tools
refs:
  - "[code://packages/server/test/server-http.test.ts#L393](../../../../packages/server/test/server-http.test.ts#L393) - `it.skipIf`"
  - "[code://tools/test-tmpdir.ts](../../../../tools/test-tmpdir.ts) - a test helper in `tools/`"
---

## Objective

`tools/posix.ts` exports `posix`, which is true off Windows.
A test skips a case with `it.skipIf(!posix)`, and a comment beside it says why.

## Files

- `CREATE: tools/posix.ts` - `posix`, and a comment that says each use names its reason.

## Steps

1. Write `tools/posix.ts` with `export const posix = process.platform !== 'win32'`.
2. Say in its comment that each skip names its reason beside it.
3. Run `pnpm -s typecheck`.
4. Set this task and the plan row to `implemented`.

## Validation

- `pnpm -s typecheck` passes.
- The helper holds no test of its own.

## Resume

Done 2026-10-16. Every step is built. Not reviewed.

`tools/posix.ts` holds `export const posix = process.platform !== 'win32'`, A comment sits above it. The comment names the pieces a skip is for: a shell outside a terminal, a signal, a file mode, a symbolic link. It also says that each use names its reason beside it.

The helper is new and nothing imports it yet: `git grep -n posix -- packages examples scripts` finds only `node:path`'s `posix` in `packages/computer/src/runtime.ts`, `packages/sdk/src/host/trust.ts` and `packages/sdk/src/tools/session.ts`. Tasks 02 and 03 are its first uses.

`tsconfig.json` includes `packages/*/src`, `packages/*/test` and `examples`, so `pnpm -s typecheck` does not reach `tools/`; the file is checked when a test imports it. Task 01 asks for no test of its own, and there is none.

Gates run, all passing: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/`. No package changed, so no vitest path applied and `packages/sdk/test/fixtures/wire.jsonl` was not touched.

Left: tasks 02 and 03, which read p1's Windows failure list (see the plan's Resume).
