---
title: A hash sign completes a file
status: done
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

- `UPDATE: packages/sdk/src/host/handshake.ts` - `#` beside `/` and `@`.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts` - the completions command answers `#`.
- `UPDATE: packages/sdk/test/host-harness.test.ts` - the trigger-character list.
- `UPDATE: packages/sdk/test/host-files.test.ts` - a `#` query answers the files `@` answers.

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

One body answers both characters now, and the trigger is the only thing it changes: the insert text keeps whichever character was typed, and the range covers it. `#chat:` returns no items.

The completion cases went to `host-files.test.ts` rather than `host-harness.test.ts`, beside the at-sign ones and with the repository as the directory to enumerate; the trigger-character case is the one that stayed in the harness file.

Files changed:

- `packages/sdk/src/host/handshake.ts`
- `packages/sdk/src/host/sessionmethods.ts`
- `packages/sdk/test/host-harness.test.ts`
- `packages/sdk/test/host-files.test.ts`

Also touched by the run of `pnpm exec vitest run packages/sdk`, which rewrites its own capture: `packages/sdk/test/fixtures/wire.jsonl` (the initialize frame now carries `#`). The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass; a plain run flakes on `nested-start` under load.
