---
title: A late client reads the command parts
status: done
depends:
  - task-01-the-store-takes-the-marks-out-in-order.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L317-L330](../../../../packages/sdk/src/machines/terminals.ts#L317-L330) - the scrollback, which this task replaces with parts"
  - "[code://packages/sdk/src/host/spawn.ts#L201-L214](../../../../packages/sdk/src/host/spawn.ts#L201-L214) - the fold with the reducer of the protocol package, which this task repeats for terminals"
---

## Objective

`state()` sends the parts that a client watching from the start built from the same actions.
The cap of 200,000 characters stays, and it trims whole parts from the front first.

## Files

- `UPDATE: packages/sdk/src/machines/terminals.ts:317-330` - `content` and `size` replace `buffered`, and `tell` folds each action through `terminalReducer` before it goes out.
- `UPDATE: packages/sdk/src/machines/terminals.ts:540-560` - `state()` sends `content`, and `clear()` goes through `tell`.
- `UPDATE: packages/sdk/test/pty.test.ts` - a case that compares a snapshot with the reducer replay, and a case for the cap.
- `UPDATE: docs/sdk/TERMINALS.md` - "What a client sees" and the scrollback paragraph.

## Steps

1. Replace `buffered` with `content` and `size`.
2. Add `tell`, which folds an action through `terminalReducer`, trims past `KEEP`, and emits it.
3. Send every action of the store through `tell`.
4. Send `content` from `state()`.
5. Add the cases, and correct the two paragraphs of `TERMINALS.md`.

## Validation

- Test that a snapshot equals the reducer replay of the actions the store sent.
- Test that a part over the cap goes whole, and that one long part keeps its newest characters.
- `pnpm exec vitest run packages/sdk/test/pty.test.ts` passes.

## Resume

Done 2026-10-27.
`tell` folds every action of the store through `terminalReducer`, and `state()` sends the folded `content`.
The trim follows the reference host: whole parts from the front, then the first part's oldest characters.
Node, Bun, the protocol package and ahpd hold no trim for a list of parts.
So the trim takes the order of the reference host.
`packages/sdk/test/pty.test.ts` passes, 32 of 32.
On the store before this change, both new cases fail.
