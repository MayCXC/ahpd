---
title: A hash sign completes a file
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L210-L218](../../../../packages/sdk/src/host/handshake.ts#L210-L218) - `completionTriggerCharacters`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L441](../../../../packages/sdk/src/host/sessionmethods.ts#L441) - the completions command"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostFileCompletionProvider.ts - the `#` answer VS Code's host gives
---

## Objective

The host sends `/`, `@` and `#` as trigger characters, and the completions command answers `#` with files, in the form VS Code's host uses.

## Files

- `UPDATE: packages/sdk/src/host/handshake.ts:210-218` - add `#`.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:441` - answer `#` with files.
- `UPDATE: packages/sdk/test/host-harness.test.ts` - a `#` query answers files.

## Steps

1. Read how `agentHostFileCompletionProvider.ts` answers `#`: the insert text, the range and the attachment.
2. Add `#` to `completionTriggerCharacters`.
3. Answer `#` through `options.resources.complete`, the same way as `@`.
4. Give each item the insert text and attachment VS Code's host gives.
5. Answer `#chat:` with no items, because p5 builds it.

## Validation

- A test asks completions for `#RE` and gets the file items `@RE` gets, with `#` insert text.
- `pnpm exec vitest run packages/sdk` passes.

## Resume
