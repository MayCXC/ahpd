---
title: A shell's marks stay out of its output - implemented
date: 2026-10-27
refs:
  - git://06cf79df
  - "[code://packages/sdk/src/machines/terminals.ts](../../../../packages/sdk/src/machines/terminals.ts)"
  - "[code://packages/sdk/test/pty.test.ts](../../../../packages/sdk/test/pty.test.ts)"
---

A shell under a pseudoterminal reaches the client without its OSC 133 and OSC 7 marks, as the protocol requires of a server.
The action of each mark goes out where the mark stood, so the output of a command lies between its two actions.
Command detection goes out with the first OSC 133 mark, and a shell that prints no marks never announces it.

## What was built

- [`code://packages/sdk/src/machines/terminals.ts`](../../../../packages/sdk/src/machines/terminals.ts) - `HELD`, `OPENERS` and `unfinished` beside `MARKS`; `meant` and `read` in `createTerminal`; `detected` on the state; the exit says what was held.
- [`code://packages/sdk/test/pty.test.ts`](../../../../packages/sdk/test/pty.test.ts) - the cases for detection, removal, order through the protocol reducer, a split mark and the exit.
- [`code://docs/sdk/TERMINALS.md`](../../../../docs/sdk/TERMINALS.md) and [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md) - what a client receives.

## Verified

- `packages/sdk/test/pty.test.ts`: 30 of 30 pass, and five of the new cases fail on the store before this change.
- `pty.test.ts`, `host-terminals.test.ts`, `host-output-terminals.test.ts`, `conformance.test.ts` and `wire.test.ts`: 99 of 99 pass.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.
- A full run of `packages/sdk` has failures outside the terminal cases, which change from run to run.
  The store before this change has them too.

## Departures from the plan

- none.

## Left for later

- A late subscriber gets the output as one `unclassified` part, also when the shell marks commands - see [deferred.md](deferred.md).
