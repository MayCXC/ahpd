---
title: A terminal action is answered - implemented
date: 2026-10-31
refs:
  - "[code://packages/sdk/src/host/actions.ts#L757-L795](../../../../packages/sdk/src/host/actions.ts#L757-L795) - a client's terminal actions, each answered"
  - "[code://packages/sdk/src/types/terminals.ts#L106-L127](../../../../packages/sdk/src/types/terminals.ts#L106-L127) - `Terminal.write` and `Terminal.setTitle` answer"
  - "[code://packages/sdk/src/host/terminals.ts#L299-L355](../../../../packages/sdk/src/host/terminals.ts#L299-L355) - a command's output terminal keeps a size and refuses input"
---

Every terminal action a client sends is answered.
Input that reaches a process is answered to the client that sent it alone, and input with no process to reach is refused in the terminal's words.
A title the terminal already has is answered to its sender alone, a claim that names nobody is refused, and a command's output terminal keeps the size a client gives it.

## What was built

- [`code://packages/sdk/src/types/terminals.ts#L106-L127`](../../../../packages/sdk/src/types/terminals.ts#L106-L127) - `write` answers `true` or the sentence that says why the input reached no process; `setTitle` answers whether the title moved. The comments on `resize` and `clear` say what each does under a pseudoterminal and under pipes.
- [`code://packages/sdk/src/machines/terminals.ts#L669-L730`](../../../../packages/sdk/src/machines/terminals.ts#L669-L730) and [`#L748-L753`](../../../../packages/sdk/src/machines/terminals.ts#L748-L753) - the shell's `write` answers for a shell that has exited, a `^C` with no process group, and pipes that no longer take input; its `setTitle` answers.
- [`code://packages/sdk/src/host/terminals.ts#L299-L355`](../../../../packages/sdk/src/host/terminals.ts#L299-L355) - a command's output terminal refuses input, keeps the size a client gives it and says it with `terminal/resized`, and its `setTitle` answers.
- [`code://packages/sdk/src/host/actions.ts#L757-L795`](../../../../packages/sdk/src/host/actions.ts#L757-L795) - input taken is answered with `echoTo`, and input refused with the terminal's sentence; a title that did not move is answered with `echoTo`; a claim naming nobody is refused, and the terminal's own claim stays.
- [`code://docs/sdk/AHP.md#L323-L326`](../../../../docs/sdk/AHP.md#L323-L326) - the `terminal/input`, `terminal/resized`, `terminal/claimed` and `terminal/titleChanged` rows.
- Four cases in `host-terminals.test.ts`: input answered to its sender and to nobody else, input to a shell that has gone refused, a title it has answered to its sender alone while a new one reaches everyone, and a claim naming nobody refused.
- Two cases in `host-output-terminals.test.ts`: input refused, and a size kept and read back.
- `conformance.test.ts` waits for the marker in the shell's `terminal/data`, since the input's own answer carries it too.

## Verified

- On `27bfa9b4` the six cases fail for the reasons they name: input is never answered, input to a shell that has gone and to an output terminal is dropped in silence, a title the terminal has and a claim naming nobody are dropped in silence, and an output terminal reports 80 by 24 whatever size it is given.
- After the change, `host-terminals`, `host-output-terminals`, `conformance`, `changes-refresh`, `host-retained-terminals`, `wire`, `users-gate-names` and `users-gate-dispatch` pass with 179 tests.
- The round's full run: `test:unit` 12 failed and `test:processes` 126 failed, each a timeout of a loaded machine or a process killed at one. The ten failed unit files pass one at a time (111 tests). The process suite run one file at a time passes 691 tests with 30 skipped, and the four timeouts it met in two files, while another job loaded the machine, pass when those files run alone (57 tests).
- `pnpm run typecheck` and `pnpm run boundary` pass.

## Departures from the plan

- The comments on `Terminal.resize` and `Terminal.clear` are brought to the shell under a pseudoterminal, which `resize` tells and `clear` leaves alone.

## Left for later

- A claim on a terminal another client holds is taken, the audit's C7, a SHOULD.
