---
title: ACP asks only for unmatched commands
status: done
depends: []
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L295-L415](../../../../packages/agent-acp/src/session/handlers.ts#L295-L415) - `askPermission`"
---

## Objective

`askPermission` calls `getAutoApproval` for a call of kind `execute` whose `rawInput.command` is a string.
An approved command gets the agent's `allow_once` option without a question.

## Files

- `UPDATE: packages/agent-acp/src/session/handlers.ts:295-415` - call the check before the question.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - an allowed command, an unmatched one, a call with no command line and one with no `allow_once`.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - an `execute` permission request in codex-acp's shape.

## Steps

1. Read `toolCall.rawInput.command` when `toolCall.kind` is `execute` and the command is a string; any other shape asks as today.
2. Ask as now when there is no command line.
3. Call `getAutoApproval` with the command and the shell.
4. Select the agent's `allow_once` option when the check approves it.
5. Ask as now when the agent offers no `allow_once` option.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-acp tests pass.
- The host never selects an "always" option for a person.
- Name codex-acp 1.13.1 as the agent checked for this shape.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** `askPermission` is async and reads `rawInput.command` from a call of kind `execute`. It does so before anything is held, before the row is drawn and before the input-needed entry is made. Codex-acp 1.13.1 is the agent checked: it sends `rawInput: { command, cwd }`. A `not-needed` answer returns the agent's `allow_once` option, so no question is drawn. An unmatched command, a shape it cannot read and an agent with no `allow_once` all ask as before. Tests: `packages/agent-acp/test/agent-acp-ports.test.ts`, four cases, on a fixture script that asks about an `execute` call.
- **Next action:** none.
- **Open questions:** none. Softov answered where an ACP agent puts the command line on 2026-10-18. It is recorded in the plan's Decisions locked in table.
- **Watch out for:** each ACP agent puts the command in a different place. The check reads only `execute` with a string `rawInput.command`, which is codex-acp 1.13.1's shape. Another agent's shape asks. The check selects `allow_once` only; an "always" is never selected by the host.
