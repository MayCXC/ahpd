---
title: A spawn failure names its cause, not a path
status: done
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L687-L691](../../../../packages/agent-claude/src/session/query.ts#L687-L691) - the `consume` catch, which keeps `error.message`"
  - "[code://packages/agent-claude/src/spawn.ts#L73-L80](../../../../packages/agent-claude/src/spawn.ts#L73-L80) - `settle`, which hands the failure to the SDK"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278 - a spawn failure is an error with `code` and `errorClass`
---

## Objective

A CLI that could not start fails the turn with "Claude Code process could not start", and the errno code when there is one.
The message names no path on the host.

## Files

- `CREATE: packages/agent-claude/src/session/failure.ts` - `failureOf`, which gives the message a person reads for an error from the SDK.
- `UPDATE: packages/agent-claude/src/session/query.ts:687-691` - use `failureOf` for `ctx.failed`.
- `UPDATE: packages/agent-claude/src/spawn.ts:73-80` - give the SDK an error that `failureOf` reads the same way.
- `CREATE: packages/agent-claude/test/agent-claude-spawn-failure.test.ts` - the cases below.

## Steps

1. Read `errorClass` and `code` from the error in `failureOf`.
2. Return "Claude Code process could not start" for `executable_not_found`, `executable_launch_failed` and `spawn_failed`.
3. Add the errno code in brackets when the error has one, as in "(ENOENT)".
4. Return `error.message` for every other error, as now.
5. Set `ctx.failed` from `failureOf` in the `consume` catch.
6. Keep `code` on the error that `settle` passes on, so `failureOf` can read it.

## Validation

- With the real SDK, a hook that runs a missing binary fails the turn with the short message and `(ENOENT)`.
- That message has no `/` in it.
- An error with no `errorClass` keeps its own message.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume

Implemented 2026-10-11. `failureOf` is new: it reads `errorClass` and `code` off the error, which the SDK hangs on by name rather than declaring in its types, and answers "Claude Code process could not start" - with the errno in brackets when there is one - for the three classes the SDK files a CLI that never came up under. Every other error keeps the message it came with. The `consume` catch sets `ctx.failed` from it, so every road out of that catch says the same one line: `ctx.gone`, the failing turn's `chat/error` part, and the refusal a turn typed afterwards takes.

`spawn.ts` needed more than passing the error over. The SDK decides what kind of failure it has from the `syscall` the error carries: an error the runtime raised (`spawn /missing/claude`, with `ENOENT`) is a failure to start, and one that arrives bare is a process error, whose message the SDK keeps whole - and on this road that message is a socket path, a registry or an image name. So the rejection of the port names the syscall as a spawn when the error does not already carry one, and leaves `code` alone, which is what puts the failure on the same road as a missing binary and keeps the errno that sentence is allowed to show. Checked against the real SDK: a hook that spawns a missing binary arrives as `executable_launch_failed` with `code: ENOENT`, and a port that rejects arrives as `process_error` with no `code` at all until the syscall is named.

The review narrowed this to a port that rejects. A machine that is not there keeps its own sentence, "There is no computer called `<id>`", because it holds no path.

Files changed, uncommitted:

- `CREATE: packages/agent-claude/src/session/failure.ts` - `failureOf`, the one line a person reads for an error from the SDK.
- `UPDATE: packages/agent-claude/src/session/query.ts` - the `consume` catch sets `ctx.failed` from `failureOf`.
- `UPDATE: packages/agent-claude/src/spawn.ts` - a port that rejects gets the syscall named, and keeps its `code`.
- `CREATE: packages/agent-claude/test/agent-claude-spawn-failure.test.ts` - three cases through the real SDK, and two on `failureOf` itself.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/agent-claude` pass - 28 files, 275 cases. `packages/computer/test/computer-spawn.test.ts`, which imports `spawn.ts`, passes with `--maxWorkers=2 --testTimeout=10000`; at the default 5 seconds its last case times out on a loaded box, which is the flake it already had.
