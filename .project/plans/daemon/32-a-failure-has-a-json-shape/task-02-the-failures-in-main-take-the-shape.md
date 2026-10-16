---
title: The failures in main.ts take the shape
status: todo
depends:
  - task-01-ahpd-takes-cofold-terminal-0-4.md
layer: server
refs:
  - "[code://packages/server/src/main.ts#L193-L205](../../../../packages/server/src/main.ts#L193-L205) - the group hint"
  - "[code://packages/server/src/main.ts#L65-L82](../../../../packages/server/src/main.ts#L65-L82) - the remote surface failure"
  - "[code://packages/server/src/main.ts#L103-L125](../../../../packages/server/src/main.ts#L103-L125) - the token failures"
  - "[code://packages/server/test/server-cli-verbs.test.ts#L94](../../../../packages/server/test/server-cli-verbs.test.ts#L94) - the group hint test"
---

## Objective

The group hint, the remote surface failure and the three token failures in `main.ts` go through `writeFailure`.
Under `--json`, each one is a JSON line; without it, each one is the line of today.

## Files

- `UPDATE: packages/server/src/main.ts:65-125` - the remote surface and token failures throw an error to one local `fail` function.
- `UPDATE: packages/server/src/main.ts:193-205` - the group hint calls `fail`.
- `UPDATE: packages/server/test/server-cli-verbs.test.ts` - the group hint under `--json`.
- `UPDATE: packages/server/test/server-http.test.ts` - a token failure under `--json`.

## Steps

1. Write the tests first.
2. Write `fail(error)` in `main.ts`: `writeFailure` with the mode of the line, then `process.exit(exitCodeFor(error))`.
3. Read the mode from a literal `--json` in `argv0`, because the remote and token failures come before `tokenize`.
4. Make each token failure an `ArgumentError`, and call `fail`.
5. Give the remote surface failure to `fail`, so it exits with `exitCodeFor` and an unreachable daemon exits 4.
6. Call `fail` with the `ArgumentError` of the group hint.
7. Keep `warnCleartext` and the check run as plain lines.
8. Set this task and the plan row to `implemented`.

## Validation

- A test: `ahpd --json plugin` writes one JSON line with the kind `argument` and exits 2.
- A test: `ahpd plugin` writes the line of today, as the test at line 94 expects.
- A test: `ahpd --json --remote http://127.0.0.1:1 status` with a token exits 4.
- A test: `ahpd --json --remote <url> status` with no token writes one JSON line and exits 2.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
