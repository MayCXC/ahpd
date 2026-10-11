---
title: The agent is told to report back to the origin
status: todo
depends: [task-01-the-host-takes-a-remote-session.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1025](../../../../packages/sdk/src/host/tooling.ts#L1025) - `instructions`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/chatContributions/remoteSessionOrigin/remoteSessionOriginContribution.ts - the text and the rule
---

## Objective

A turn in a session that has an origin gets the `<remote_session_origin>` instruction, word for word, when an active client offers `send_remote_message`.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1025` - add the instruction under the same rule.
- `UPDATE: packages/sdk/test/host-remote-session.test.ts` - the cases below.

## Steps

1. Copy the instruction text from `remoteSessionOriginContribution.ts`.
2. Give it when the session has an origin and an active client offers `send_remote_message`.
3. Give nothing in every other case.

## Validation

- A session with an origin and the client tool gets the instruction.
- A session without the origin, or without the tool, does not.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
