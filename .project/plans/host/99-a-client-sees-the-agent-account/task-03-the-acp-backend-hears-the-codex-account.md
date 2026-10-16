---
title: The ACP backend hears the Codex account
status: todo
depends: [task-02-the-host-publishes-each-agent-account.md]
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/connection.ts#L209-L252](../../../../packages/agent-acp/src/connection.ts#L209-L252) - the notification handlers"
  - "[code://packages/agent-acp/src/agent.ts#L129](../../../../packages/agent-acp/src/agent.ts#L129) - the empty probe, which stays empty"
  - "npm://@agentclientprotocol/codex-acp@1.13.1 - `_auth/status_update`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/codex/codexAccountState.ts#L11-L32 - the state map"
---

## Objective

An ACP agent that advertises `authStatus` sends its account to the host when `_auth/status_update` arrives.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:209-252` - a handler for `_auth/status_update`.
- `UPDATE: packages/agent-acp/test` - each kind of the notification maps to its state.

## Steps

1. Read the `authStatus` flag in `agentCapabilities._meta` at the start of the connection.
2. Add the handler for `_auth/status_update`.
3. Map `account`, `api_key`, `gateway` and `none` to the states of task 01.
4. Send the account with the event of task 02.
5. Keep the probe as it is, with no spawn at boot.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-acp test: an `account` notification gives the email and the plan.
- The agent-acp test: a `none` notification gives `signedOut`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
