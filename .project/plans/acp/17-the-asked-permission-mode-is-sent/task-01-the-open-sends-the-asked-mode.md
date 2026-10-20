---
title: The open sends the asked mode
status: done
depends: []
layer: "packages/agent-acp"
refs:
  - "[code://packages/agent-acp/src/session/config.ts#L42-L46](../../../../packages/agent-acp/src/session/config.ts#L42-L46) - `learnModes`"
  - "[code://packages/agent-acp/src/session/config.ts#L53-L54](../../../../packages/agent-acp/src/session/config.ts#L53-L54) - `modeOption`"
  - "[code://packages/agent-acp/src/session/config.ts#L281-L318](../../../../packages/agent-acp/src/session/config.ts#L281-L318) - `setConfig('permissionMode')`, the order to copy"
  - "[code://packages/agent-acp/src/session/opening.ts#L454-L516](../../../../packages/agent-acp/src/session/opening.ts#L454-L516) - the three open paths and `onHandshake`"
---

## Objective

Every open path sends the asked `permissionMode` when the server offers it and is in another mode.
`settings` and `config.values` then report the asked mode.

## Files

- `UPDATE: packages/agent-acp/src/session/config.ts:42-54` - a send of the asked mode on a connection the caller holds, put on `ctx`.
- `UPDATE: packages/agent-acp/src/session/opening.ts:454-516` - read the asked mode before the open, and call the send before `onHandshake`.

## Steps

1. Read `settings.permissionMode` at the start of the open, before any learn call.
2. Add a send to `config.ts` that takes the connection, the session id and the asked mode.
3. In the send, return when the asked mode is not a string or equals the current mode.
4. Take the offered modes from the `mode` option when there is one, else from `ctx.modes.availableModes`.
5. Return when the asked mode is not among them.
6. Put the asked mode in `settings` before the request, so the server's update is not news.
7. Send it with `setSessionConfigOption` when there is a `mode` option, and learn the options it answers.
8. Otherwise send it with `setSessionMode`, and set `ctx.modes.currentModeId`.
9. On a failure, put the server's mode back in `settings` and log the reason through `options.log`.
10. Call the send on the fork, the resume or load, and the new path, after the learn calls.
11. Set this task and the plan row to `implemented`.

## Validation

- Task 02's tests pass.
- The existing agent-acp tests pass unchanged.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

Implemented 2026-10-18, not reviewed.

- `config.ts` has `sendAskedMode(held, asked)` on `ctx`, beside `setConfig`.
- It returns for a value that is not a string, the mode in force, or a mode the server does not offer.
- It reads the offered modes from the `mode` option, or else from `ctx.modes.availableModes`.
- It puts the asked mode in `settings` before the request, so the server's echo is no news.
- It sends `setSessionConfigOption` on the `mode` option, or `setSessionMode` for legacy modes.
- On a failure it restores the server's mode and logs the reason through `ctx.options.log`.
- `opening.ts` reads `settings.permissionMode` at the top of the open, before any learn call.
- It calls the send after the learn calls on the fork, resume and new paths, before `onHandshake`.

No tests were added, because task 02 writes them.
A check by hand with a script outside the repository sent `set_config_option` on a `--modes` server and `set_mode` on a legacy one.
A mode the server does not offer sent nothing, and no `session/configChanged` was emitted.

Gates: schema, build, typecheck, boundary, `tools/` and vitest pass (312 files, 5382 passed, 1 skipped).
