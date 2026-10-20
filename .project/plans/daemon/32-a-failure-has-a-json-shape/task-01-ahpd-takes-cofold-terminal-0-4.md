---
title: ahpd takes @cofold/terminal 0.4
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/package.json#L50](../../../../packages/server/package.json#L50) - the dependency range"
  - npm://@cofold/terminal@^0.4.0 - the release with the JSON failure
---

## Objective

`@ahpd/server` depends on `@cofold/terminal` `^0.4.0`, and a failure that `runEntry` writes has the JSON shape under `--json`.

## Files

- `UPDATE: packages/server/package.json:50` - `@cofold/terminal` goes to `^0.4.0`.
- `UPDATE: pnpm-lock.yaml` - the lock for the new version.
- `UPDATE: packages/server/test/server-cli.test.ts` - a case for a thrown failure under `--json`.

## Steps

1. Check that `npm view @cofold/terminal version` prints 0.4.0 or later.
2. Set the range to `^0.4.0`, and run `pnpm install`.
3. Write a test: `ahpd --json plugin show nothing` writes one JSON line and keeps its exit code.
4. Run the server tests, and fix each test that reads the old failure line under `--json`.
5. Set this task and the plan row to `implemented`.

## Validation

- The new test passes.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the server vitest suite pass.

## Resume

- **Done so far:** every step. `npm view @cofold/terminal version` printed `0.4.0`. `packages/server/package.json` asks for `^0.4.0`, and `pnpm install` updated `pnpm-lock.yaml` and added the version to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. `packages/server/test/server-cli.test.ts` has the case: `ahpd --json plugin show nothing` writes one JSON line with the kind `argument` and the exit code 2.
- **Next action:** task 02.
- **Open questions:** none.
- **Watch out for:** `plugin show nothing` names no command, so it reaches the group hint in `main.ts` rather than `runEntry`. Its JSON line is task 02's `fail`, and the case fails until that change lands.
