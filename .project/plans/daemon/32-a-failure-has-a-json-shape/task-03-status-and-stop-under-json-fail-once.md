---
title: Status and stop under --json keep their result
status: done
depends:
  - task-01-ahpd-takes-cofold-terminal-0-4.md
layer: server
refs:
  - "[code://packages/server/src/commands/status.ts#L28-L34](../../../../packages/server/src/commands/status.ts#L28-L34) - `{\"running\":false}`, then `conflict`"
  - "[code://packages/server/src/commands/stop.ts#L21-L26](../../../../packages/server/src/commands/stop.ts#L21-L26) - `{\"stopped\":false}`, then `conflict`"
---

## Objective

`ahpd status --json` and `ahpd stop --json` with no daemon write their JSON result on stdout and one JSON failure on stderr.
A script reads each stream as one JSON value at most.

## Files

- `UPDATE: packages/server/src/commands/status.ts:28-34` - keep the `{"running":false}` write, and say in the comment where the failure goes.
- `UPDATE: packages/server/src/commands/stop.ts:21-26` - keep the `{"stopped":false}` write, and say in the comment where the failure goes.
- `UPDATE: packages/server/test/server-cli.test.ts` - the two cases with no daemon.

## Steps

1. Write the tests first.
2. Keep the stdout write in `status` and in `stop`, and change the comment above each write.
3. Keep exit 1 and the kind `conflict` for both.
4. Set this task and the plan row to `implemented`.

## Validation

- A test: `ahpd status --json` with no daemon writes `{"running":false}` on stdout, one JSON failure on stderr, and exits 1.
- A test: `ahpd stop --json` with no daemon writes `{"stopped":false}` on stdout, one JSON failure on stderr, and exits 1.
- `pnpm -s typecheck` and the server vitest suite pass.

## Resume

- **Done so far:** every step. `status` and `stop` keep their `{"running":false}` and `{"stopped":false}` write on stdout, and the comment above each says the failure goes to stderr. Both keep exit 1 and the kind `conflict`. `server-cli.test.ts` has a case for each: the result on stdout, one JSON failure on stderr, and exit 1.
- **Next action:** task 04.
- **Open questions:** none.
- **Watch out for:** the result is written before the failure, so a script reads stdout to its end and stderr as one line. The failure line is `{"message":"None running.","kind":"conflict","exitCode":1}`.
