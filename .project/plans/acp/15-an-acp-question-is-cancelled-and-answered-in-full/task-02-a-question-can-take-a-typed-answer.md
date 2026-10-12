---
title: A question can take a typed answer
status: todo
depends: []
layer: "packages/agent-acp"
refs:
  - "[code://packages/agent-acp/src/mapping.ts#L591-L634](../../../../packages/agent-acp/src/mapping.ts#L591-L634) - `questionOf`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/codex/codexUserInputMapper.ts - a single-select question with `allowFreeformInput` from `isOther`
---

## Objective

A select question whose field has `_meta.codex.isOther` set to true has `allowFreeformInput: true`.
A person can then type an answer that is not one of the options.

## Files

- `UPDATE: packages/agent-acp/src/mapping.ts:591-634` - read the flag on a select question.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - the cases below.

## Steps

1. Find where Codex's ACP adapter puts `isOther` in an elicitation schema, and note the source in Resume.
2. Stop and ask Softov if the adapter does not send it.
3. Set `allowFreeformInput: true` on a single-select or multi-select question when the field's flag is true.
4. Leave every other question as it is.

## Validation

- A field with the flag gives a question with `allowFreeformInput: true`.
- A field without it gives no `allowFreeformInput`.
- `pnpm exec vitest run packages/agent-acp` passes.

## Resume
