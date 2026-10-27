---
title: Each pipe decodes as a stream
status: done
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L470-L471](../../../../packages/sdk/src/machines/terminals.ts#L470-L471) - the two pipe readers this task changes"
---

## Objective

The stdout and the stderr of a shell on pipes give the store strings from their own decoders.
A character that two reads split arrives whole.

## Files

- `UPDATE: packages/sdk/src/machines/terminals.ts:470-471` - each pipe calls `setEncoding('utf8')`, and its handler takes a string.
- `UPDATE: packages/sdk/test/pty.test.ts` - a case for a character that two writes split.
- `UPDATE: docs/sdk/TERMINALS.md` - "Pipes, or a pseudoterminal" says how the output is decoded.
- `UPDATE: CHANGELOG.md` - an entry under `0.14.1 - unreleased`.

## Steps

1. Call `setEncoding('utf8')` on the stdout and the stderr of the shell.
2. Take the string in each data handler, and say it as before.
3. Add the case, with Node as the command so that it runs on every system.
4. Add the sentence to `TERMINALS.md` and the changelog entry.

## Validation

- Test in `packages/sdk/test/pty.test.ts` that `é`, written as two bytes in two writes, arrives as `é`.
- Run the case on the store before this change, and see it fail.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.

## Resume

Done 2026-10-27.
Both pipes call `setEncoding('utf8')`, and their handlers take strings.
The new case passes, and it fails on the store before this change.
A run of the store with the same two writes gives `é` on Node 24.21.0 and on Bun 1.4.4.
