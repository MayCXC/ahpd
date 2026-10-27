---
title: The store takes the marks out, in the order they came
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L362-L427](../../../../packages/sdk/src/machines/terminals.ts#L362-L427) - `marked` and the wiring of the pseudoterminal, which this task replaces"
  - "[code://packages/sdk/test/pty.test.ts#L251-L333](../../../../packages/sdk/test/pty.test.ts#L251-L333) - the cases this task changes and adds"
---

## Objective

The store sends the output of a pseudoterminal without its OSC 133 and OSC 7 marks.
Each action goes out where its mark stood, and detection goes out with the first OSC 133 mark.

## Files

- `UPDATE: packages/sdk/src/machines/terminals.ts:226-239` - the comment on `MARKS` says the marks come out; `HELD` and `unfinished` go beside it.
- `UPDATE: packages/sdk/src/machines/terminals.ts:355-403` - `marked` becomes `meant` and `read`, with `detected` and `held`.
- `UPDATE: packages/sdk/src/machines/terminals.ts:421-427` - the data goes to `read`, the exit says what was held, and detection is not said at the start.
- `UPDATE: packages/sdk/src/machines/terminals.ts:541-544` - `supportsCommandDetection` reports `detected`.
- `UPDATE: packages/sdk/test/pty.test.ts:251-333` - the cases for detection and for the marks in the output change, and cases for the order and the split mark are new.

## Steps

1. Add `HELD`, a bound of 1,024 characters, and `unfinished`, which finds a mark the next chunk can finish.
2. Replace `marked` with `meant`, which makes the action of one mark.
3. Add `read`, which says the output between the marks and holds back an unfinished mark.
4. Say `terminal/commandDetectionAvailable` in `meant` at the first OSC 133 mark, not at the start.
5. Say the held text when the pseudoterminal exits.
6. Report `detected` as `supportsCommandDetection`.
7. Change the two cases that hold the old behaviour, and add the new cases.

## Validation

- Test in `packages/sdk/test/pty.test.ts` that detection waits for the first OSC 133 mark.
- Test that no mark reaches `terminal/data`, and that a title sequence does.
- Test that output before `D` goes out before `terminal/commandFinished`.
- Test that the store reads and removes a mark that two chunks split.
- Test that the held text goes out when the shell exits.
- `pnpm exec vitest run packages/sdk/test/pty.test.ts packages/sdk/test/conformance.test.ts packages/sdk/test/wire.test.ts` passes.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.

## Resume
