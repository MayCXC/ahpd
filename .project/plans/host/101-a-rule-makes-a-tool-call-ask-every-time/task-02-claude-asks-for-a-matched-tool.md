---
title: Claude asks for a matched tool
status: todo
depends: [task-01-the-rule-is-read-in-the-approval-check.md]
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L377-L379](../../../../packages/agent-claude/src/session/query.ts#L377-L379) - the `PreToolUse` hooks"
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`"
  - "[code://packages/agent-claude/src/session/asking.ts#L196-L245](../../../../packages/agent-claude/src/session/asking.ts#L196-L245) - the confirmation `canUseTool` awaits: the abort, the preview and the wait"
  - "[code://packages/agent-claude/src/session/asking.ts#L336-L346](../../../../packages/agent-claude/src/session/asking.ts#L336-L346) - the options, with `allow-always` from the suggestions"
  - "[code://packages/agent-claude/src/session/asking.ts#L483](../../../../packages/agent-claude/src/session/asking.ts#L483) - `allow-always` returns `updatedPermissions`"
  - "[code://packages/agent-claude/src/session/config.ts#L150-L211](../../../../packages/agent-claude/src/session/config.ts#L150-L211) - `sourceFirst`, the shape of a hook answer"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278 - `sdk.d.ts`: `HookCallback` with its `signal`, `HookCallbackMatcher.timeout`, `PreToolUseHookInput` and `PreToolUseHookSpecificOutput`
---

## Objective

A `PreToolUse` hook puts the question for a matched tool to a person, and answers with the person's choice.
It awaits the same confirmation that `canUseTool` awaits, and answers `allow` or `deny`.
It never answers `ask`, because auto mode and `allowedTools` can skip the prompt that `ask` asks for.
The question offers no `allow-always` option, and the hook returns no `updatedPermissions`.

## Files

- `UPDATE: packages/agent-claude/src/session/asking.ts:196-346` - take the confirmation out of `canUseTool`, so the hook can await it with no suggestions.
- `UPDATE: packages/agent-claude/src/session/query.ts:377-379` - add a `PreToolUse` hook for every tool, beside `sourceFirst`.
- `UPDATE: packages/agent-claude/test` - a matched tool asks in every mode, and `dontAsk` refuses it.

## Steps

1. Read the hooks guide of the Claude Agent SDK and the hook types in its `sdk.d.ts`.
2. Check that a hook's `allow` or `deny` holds in `bypassPermissions`, in auto mode and for a tool in `allowedTools`.
3. Check that a hook's `allow` does not call `canUseTool` again for the same call.
4. Check how the SDK merges the answers of two `PreToolUse` hooks, so `sourceFirst`'s `updatedInput` stays.
5. Check the default hook timeout, and set a matcher `timeout` that outlasts a person's answer.
6. Record the results in Resume, and stop if a check fails.
7. Move the confirmation of `canUseTool` into a function that both callers await.
8. Give that function the tool name, the input, the call id, the agent id and the abort signal.
9. Add a hook that returns at once for an unmatched tool.
10. For a matched tool, await the confirmation with no suggestions, and answer `allow` or `deny` with a reason.
11. Answer `deny` on the hook's abort signal, as `canUseTool` does on its own.
12. Refuse the call in `dontAsk` without a question.
13. Skip `settled` in `canUseTool` for a matched tool.
14. Write the tests.
15. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass.
- A test: a matched tool on the allow list asks, in `bypassPermissions` as in `default`.
- A test: the question for a matched tool has no `allow-always` option, and the answer carries no `updatedPermissions`.
- A test: an approved matched call asks once, not a second time in `canUseTool`.
- A test: a matched `Bash` call still runs with `sourceFirst`'s input.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the `Bash` hook `sourceFirst` must keep running; the new hook adds to it.
