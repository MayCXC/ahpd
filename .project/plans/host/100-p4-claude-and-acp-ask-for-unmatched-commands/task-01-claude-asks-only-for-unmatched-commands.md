---
title: Claude asks only for unmatched commands
status: implemented
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`"
---

## Objective

Claude's `canUseTool` calls `getAutoApproval` for `Bash` before it asks, with the line the model wrote.

## Files

- `UPDATE: packages/agent-claude/src/session/asking.ts:174-180` - call the check after `settled` and before the question.
- `UPDATE: packages/agent-claude/src/session/config.ts:220-231` - `sourceFirst` keeps the command it rewrote, per `tool_use_id`.
- `UPDATE: packages/agent-claude/src/session.ts` - `close` drops what was kept.
- `UPDATE: packages/agent-claude/test` - an allowed command runs, an unmatched one asks, a denied one asks, and a prefixed line is matched as the model wrote it.

## Steps

1. Read `command` from the `Bash` input in `canUseTool`, or the original `sourceFirst` kept under the call's `tool_use_id`.
2. Call `getAutoApproval` with the command and `bash`.
3. Allow the call and record `not-needed` when the check approves it.
4. Ask as now in every other case.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass.
- A command the shell hook prefixed is still matched as the model wrote it.
- `bypassPermissions` and `dontAsk` keep their answers.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** `canUseTool` reads `command` and calls `getAutoApproval` before anything is held. It runs after `settled`, the host-tool flag and the SDK's abort. The line read is the one the model wrote. When `sourceFirst` prefixes the operator's environment or a shell init script, it keeps the original command per `tool_use_id` in `Config.unprefixed`. The check reads that entry and drops it. The map is cleared when the session closes. `getAutoApproval` is carried from `Start` on `ClaudeSessionOptions` (`packages/agent-claude/src/session/context.ts`) and mapped in `packages/agent-claude/src/claude.ts`. An approval returns `{ behavior: 'allow', updatedInput: raw }`, so no question is drawn and the call's row keeps the `confirmed: 'not-needed'` the stream writes. Tests: `packages/agent-claude/test/agent-claude-autoapproval.test.ts`, eight cases.
- **Next action:** none.
- **Open questions:** none. Softov answered which line the rules match on 2026-10-18; it is recorded in the plan's Decisions locked in table.
- **Watch out for:** `bypassPermissions` and `dontAsk` never call `canUseTool` (the SDK's `permissionMode` documentation), so their answers are unchanged. `sourceFirst` returns no rewrite when it has nothing to put in front of a command. That is every session without `shellEnv` and a script, and then nothing is kept.
