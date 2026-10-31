---
title: A terminal action is answered
status: done
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host/actions.ts#L754-L790](../../../../packages/sdk/src/host/actions.ts#L754-L790) - a client's terminal actions"
  - "[code://packages/sdk/src/types/terminals.ts#L106-L120](../../../../packages/sdk/src/types/terminals.ts#L106-L120) - `Terminal.write` and `Terminal.setTitle`"
---

## Objective

Every terminal action a client sends is answered: input that reaches a process and a title it already has, to the sender alone; input with no process to reach and a claim that names nobody, refused; an output terminal's new size, kept and said.

## Files

- `UPDATE: packages/sdk/src/types/terminals.ts:106-120` - `write` answers `true` or the sentence that says why the input did not reach a process; `setTitle` answers whether the title moved.
- `UPDATE: packages/sdk/src/machines/terminals.ts:669-750` - the shell's `write` and `setTitle` answer.
- `UPDATE: packages/sdk/src/host/terminals.ts:293-358` - the output terminal refuses input, keeps a size and says it, and its `setTitle` answers.
- `UPDATE: packages/sdk/src/host/actions.ts:754-790` - input answered with `echoTo` or refused; a title it has answered with `echoTo`; a malformed claim refused.
- `UPDATE: docs/sdk/AHP.md:323-326` - the terminal rows.
- `UPDATE: packages/sdk/test/host-terminals.test.ts` - input answered to its sender alone, input after the shell has gone refused, a title it has answered, a claim naming nobody refused.
- `UPDATE: packages/sdk/test/host-output-terminals.test.ts` - input refused, a size kept and read back.
- `UPDATE: packages/sdk/test/conformance.test.ts` - the case waits for the marker in the shell's output.

## Steps

1. Write the cases and run them on `27bfa9b4` to see input unanswered, input after exit and to an output terminal dropped, a title it has dropped, a malformed claim dropped, and an output terminal's size fixed.
2. Have `write` and `setTitle` answer, in both terminals.
3. Answer the client in the switch.
4. Keep an output terminal's size.
5. Bring the conformance case and AHP.md to what the host does.

## Validation

- The new cases fail on `27bfa9b4` and pass after the change.
- `host-terminals`, `host-output-terminals`, `conformance`, `changes-refresh`, `host-retained-terminals`, `wire`, `users-gate-names` and `users-gate-dispatch` pass.
- `pnpm run typecheck` and `pnpm run boundary` report no errors.

## Resume

Done 2026-10-31.
Every step is built, and the touched suites, the type check and the boundary check pass.
