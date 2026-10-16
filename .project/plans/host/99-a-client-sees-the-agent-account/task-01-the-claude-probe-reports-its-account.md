---
title: The Claude probe reports its account
status: todo
depends: []
layer: "sdk, agent-claude"
refs:
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/codexAccount.ts#L37-L50 - `ICodexAccountInfo`
  - "[code://packages/agent-claude/src/probe.ts#L49-L107](../../../../packages/agent-claude/src/probe.ts#L49-L107) - the probe"
  - "[code://packages/sdk/src/types/probe.ts#L4-L44](../../../../packages/sdk/src/types/probe.ts#L4-L44) - `Offered`"
  - "npm://@anthropic-ai/claude-agent-sdk@^0.3.301 - `AccountInfo`"
---

## Objective

The Claude probe returns the account from `initializationResult()` as `Offered.account`.
An API key or no sign-in gives a state without an email.

## Files

- `UPDATE: packages/sdk/src/types/probe.ts:4-44` - `Offered` gets an optional `account` with the fields of VS Code's `ICodexAccountInfo`.
- `UPDATE: packages/agent-claude/src/probe.ts:49-107` - the probe maps `init.account` to `Offered.account`.
- `UPDATE: packages/agent-claude/test` - a test of the map for a subscription, an API key and no sign-in.

## Steps

1. Read `AccountInfo` in the installed SDK, and record its fields in Resume.
2. Add the `account` type to `Offered`, with the fields of `ICodexAccountInfo`.
3. Map `email` to `email` and `subscriptionType` to `planType`, with `status: 'signedIn'`.
4. Map an API key or a cloud provider to `unavailable`, and no sign-in to `signedOut`.
5. Set `observedAt` to the time of the probe.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude test: a subscription account gives its email and plan.
- The agent-claude test: an `apiKeySource` account gives `unavailable` and no email.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
