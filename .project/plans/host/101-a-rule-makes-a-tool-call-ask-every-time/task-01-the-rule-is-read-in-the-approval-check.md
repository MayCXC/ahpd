---
title: The rule is read in the approval check
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/vscoderootconfig.ts#L112-L117](../../../../packages/sdk/src/vscoderootconfig.ts#L112-L117) - `globalAutoApproveEnabled`, the pattern for a host key"
  - "[code://packages/sdk/src/host/gate.ts#L274-L298](../../../../packages/sdk/src/host/gate.ts#L274-L298) - a host key needs `config:change`"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/workbench/contrib/chat/browser/tools/languageModelToolsService.ts#L1921-L1933 - `getToolFullReferenceName`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/workbench/contrib/chat/browser/tools/languageModelToolsService.ts#L1348-L1370 - `isToolEligibleForAutoApproval`
---

## Objective

The check on `Start` from host/100 reads the rule first.
A matched tool gets the answer "ask, and offer no always option".
This task needs host/100 p2 task 01.

## Files

- `UPDATE: packages/sdk/src/vscoderootconfig.ts` - declare `eligibleForAutoApproval`, a map of tool name to boolean, as VS Code.
- `UPDATE: packages/sdk/src/types/agent.ts` - the check's answer gains "ask, with no always option".
- `UPDATE: packages/sdk/src/host/spawn.ts` - the check reads the rule before the terminal rules.
- `UPDATE: packages/sdk/test` - the matcher, and the order against the terminal rules.

## Steps

1. Confirm that host/100 p2 task 01 is `implemented`.
2. Declare `eligibleForAutoApproval` as a host key, outside `PER_CONNECTION`, so a push needs `config:change`.
3. Match `<server>/<tool>` keys exactly, and `<server>/*` keys for every tool of that server.
4. Return "ask, with no always option" for a matched tool, before the terminal rules run.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass.
- A tool matched by both this rule and a terminal allow rule asks.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** VS Code's value `false` means "always ask"; keep that sense.
