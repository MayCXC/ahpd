---
title: ahpd takes @cofold/terminal 0.4
status: todo
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
