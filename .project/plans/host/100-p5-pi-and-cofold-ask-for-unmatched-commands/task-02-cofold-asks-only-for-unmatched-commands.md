---
title: cofold asks only for unmatched commands
status: done
depends: []
layer: agent-cofold
refs:
  - "[code://packages/agent-cofold/src/mapping.ts#L511-L580](../../../../packages/agent-cofold/src/mapping.ts#L511-L580) - `approval.requested`"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm`"
---

## Objective

An `approval.requested` for `shell_exec` calls `getAutoApproval` first.
An approved command is answered with approve, without `alwaysApprove`, and opens no question.

## Files

- `UPDATE: packages/agent-cofold/src/mapping.ts:511-580` - call the check before the request opens.
- `UPDATE: packages/agent-cofold/src/pauses.ts:139-180` - answer an approved command without a person.
- `UPDATE: packages/agent-cofold/test` - an allowed command, an unmatched one.

## Steps

1. Read the command from the `shell_exec` input in `approval.requested`.
2. Call `getAutoApproval` with the command and the shell.
3. Send approve without `alwaysApprove` when the check approves it, and open no request.
4. Open the request as now in every other case.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The agent-cofold tests pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** the call sits in the session, not the mapping, because `mapping.ts` is pure and has no host to ask. `createPauses` now returns `autoApprove(requestId, name, input)`: it ignores every tool but `shell_exec`, reads `input.command`, and asks `start.getAutoApproval('shell', command, shell)`. The shell is cofold's own `DEFAULT_SHELL` (`process.platform === 'win32' ? 'powershell' : 'bash'`). On `not-needed` it submits `{ type: 'approve', requestId }` with no `alwaysApprove` and reports true. The live read loop in `runs.ts` asks it before `apply` runs the mapping. An approved request raises no entry, moves no row to `pending-confirmation` and is never held. The run's own `tool.started` readies the row `not-needed`. Every other answer falls through to the mapping and the question opens as before. Tests: `packages/agent-cofold/test/agent-cofold-autoapproval.test.ts`, four cases. One covers an allowed command: the check is asked once with `{ kind: 'shell', line: 'echo hi', shell: 'bash' }`, no `session/inputNeededSet` is drawn and the row is `not-needed`. The others cover an unmatched command that asks, no check at all, and a `write_file` that never reaches the check.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the mapping is pure and stays so. The resume replay also calls `apply`, so the check stays out of `apply`. A replay rebuilds the questions that were asked, whatever the rules say now. `agent-cofold-store.test.ts` covers this case. The input shape is cofold's own `{ command }`, not the SDK's.
