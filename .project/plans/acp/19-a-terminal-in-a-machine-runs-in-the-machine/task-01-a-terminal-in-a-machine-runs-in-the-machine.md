---
title: A terminal in a machine runs in the machine
status: todo
depends: []
layer: agents
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L261-L279](../../../../packages/agent-acp/src/session/handlers.ts#L261-L279) - `openTerminal`"
  - "[code://packages/agent-acp/src/session/opening.ts#L224-L249](../../../../packages/agent-acp/src/session/opening.ts#L224-L249) - `placed`, whose reading of the computer id is shared"
  - "[code://packages/agent-acp/test/agent-acp-machine.test.ts#L383-L419](../../../../packages/agent-acp/test/agent-acp-machine.test.ts#L383-L419) - the stub `computers.how` the new case uses"
---

## Objective

A `terminal/create` from an ACP agent in a session placed in a machine runs its command in that machine, through `computers.how`, in a terminal the host still lists; a session on the host is unchanged.

## Files

- `UPDATE: packages/agent-acp/src/session/opening.ts:224-249` - the computer id read out of `placed` into one function both use: `machineIdOf(start): string | undefined`, which throws on a value that is not `computer://<id>` and when the host has no computers port, with the messages `placed` throws today.
- `UPDATE: packages/agent-acp/src/session/handlers.ts:261-279` - `openTerminal`: where `machineIdOf(start)` names a machine, `await start.computers.how(id, { command, args, env, cwd: hostPathOf(request.cwd ?? <the machine's cwd>) })`, a missing descriptor thrown as `There is no computer called <id>`, and `shells.open({ cwd: where, command: how.command, args: how.args, env: how.env })`; otherwise as today.
- `UPDATE: packages/agent-acp/test/agent-acp-machine.test.ts` - a case per side.

## Steps

1. Move the id parsing out of `placed` into `machineIdOf`, and make `placed` call it.
2. In `openTerminal`, branch on `machineIdOf(start)` as above, applying decision `an-acp-agents-terminal-in-a-machine-runs-in-the-machine`.
3. Add a case in `agent-acp-machine.test.ts`: a placed session whose fixture sends `term`; assert the stub `how` was asked for `echo` with `cwd` the host folder, and that the host's terminal ran the descriptor's command, not `echo`.
4. Add a case: a session on the host sends `term`; `how` is not called, and the terminal runs `echo` at the folder.

## Validation

- `pnpm vitest run packages/agent-acp/test/agent-acp-machine.test.ts packages/agent-acp/test/agent-acp-ports.test.ts` passes on Linux and on Windows.
- `pnpm typecheck`, `pnpm boundary`.
- By hand on Windows with Docker Desktop: the hand check in `.project/pending/windows-machine-paths-checks.md` with the scripted agent's `paint` turn.

## Resume
