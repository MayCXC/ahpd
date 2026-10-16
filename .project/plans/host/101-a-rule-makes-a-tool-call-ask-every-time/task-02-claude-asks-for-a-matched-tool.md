---
title: Claude asks for a matched tool
status: todo
depends: [task-01-the-rule-is-read-in-the-approval-check.md]
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L377-L379](../../../../packages/agent-claude/src/session/query.ts#L377-L379) - the `PreToolUse` hooks"
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`"
  - "[code://packages/agent-claude/src/session/config.ts#L150-L211](../../../../packages/agent-claude/src/session/config.ts#L150-L211) - `sourceFirst`, the shape of a hook answer"
  - npm://@anthropic-ai/claude-agent-sdk@^0.3.301 - `permissionDecision: 'ask'`
---

## Objective

A `PreToolUse` hook answers `ask` for a matched tool.
`canUseTool` skips `settled` for that tool and offers no suggestions.

## Files

- `UPDATE: packages/agent-claude/src/session/query.ts:377-379` - add a `PreToolUse` hook for every tool.
- `UPDATE: packages/agent-claude/src/session/asking.ts:174-180` - skip `settled` and the "always" suggestions for a matched tool.
- `UPDATE: packages/agent-claude/test` - a matched tool asks in every mode, and `dontAsk` refuses it.

## Steps

1. Check with a probe that the SDK honors `ask` from a hook in `bypassPermissions` and `dontAsk`.
2. Record the result in Resume, and stop if the SDK does not honor it.
3. Add a hook that answers `permissionDecision: 'ask'` for a matched tool.
4. Skip `settled` in `canUseTool` for a matched tool.
5. Offer no `suggestions` on the question for a matched tool.
6. Refuse the call in `dontAsk`.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass.
- A matched tool on the allow list still asks.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the `Bash` hook `sourceFirst` must keep running; the new hook adds to it.
