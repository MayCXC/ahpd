---
title: A running terminal is listed when its call ends
status: done
depends: [task-01-a-backend-reports-a-task-the-host-draws.md, task-03-the-host-answers-stop-background-work.md]
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/session/handlers.ts#L274-L321](../../../../packages/agent-acp/src/session/handlers.ts#L274-L321) - `openTerminal`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L185-L197](../../../../packages/agent-acp/src/session/handlers.ts#L185-L197) - the mapped actions"
  - "[code://packages/agent-acp/src/mapping.ts#L362-L373](../../../../packages/agent-acp/src/mapping.ts#L362-L373) - the terminal block"
---

## Objective

When a tool call ends and a terminal its content names still runs, the backend reports that terminal as a background shell.
The row goes when the process exits or the agent releases the terminal.

## Files

- `UPDATE: packages/agent-acp/src/session/context.ts` - the held terminal gains `openedAt`, `command` and `listed`.
- `UPDATE: packages/agent-acp/src/session/handlers.ts` - record the open time and command, list at call end, remove on exit and release.
- `UPDATE: packages/agent-acp/src/session/turn.ts` - at turn end, scan the actions `closePlan` emits and list the terminals no call named.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - a call that ends while its terminal runs.
- `CREATE: packages/agent-acp/test/agent-acp-background-shell.test.ts` - the cases below.

## Steps

1. Keep the open time and the command line on the held terminal in `openTerminal`.
2. Read each `chat/toolCallComplete` before `emit`, and find the terminal blocks in its content.
3. Read the calls a turn's end closes the same way.
4. Call `backgroundTasks.set` for each named terminal that is still in `terminals` and still runs.
5. Give the task a `stop` that calls `handle.kill()` and answers whether the process was running.
6. Call `remove` when a listed terminal's process exits.
7. Call `remove` in `releaseTerminal` before it deletes the terminal.
8. Set `label` to the call's title and `command` to the command and args joined with spaces.
9. Call `backgroundTasks.set` at turn end for each running terminal that no call named, with the command line as `label`.
10. Write the tests.
11. Set this task and its plan row to `implemented`.

## Validation

- A terminal that runs past its call gets one set, with `terminal`, `startedAt` and the stop flag.
- A terminal that exits before its call ends gets no set.
- A running terminal that no call named gets one set at turn end, labelled with its command line.
- An exit and a release each remove the row once.
- A stop kills the process and answers true; a second stop answers false.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** built. `context.ts` defines `HeldTerminal`, which adds `openedAt`, `command` and `listed` to the handle, the limit and `exited`. `handlers.ts` records the open time and the request's command and args joined with spaces. It lists a terminal when a `chat/toolCallComplete` names it in its content and its process still runs. It lists every other running terminal at turn end. It removes the row on the process's exit and in `releaseTerminal` before the terminal is deleted. `turn.ts`'s `finish` hands its closing actions through the same scan and then the turn-end pass. The row's `id` and `terminal` are the host terminal's URI. Its label is the call's title, or the command line when no call named it. Its `startedAt` is the open time. A stop kills the process through the host and answers true once; a second stop, or one after the exit, answers false. The fixture has `linger`, `unspoken`, `brief`, `fade` and `release`, and `test/agent-acp-background-shell.test.ts` has the five cases. The whole agent-acp suite passes (286 tests).
- **Next action:** none; the plan's final gates are the remaining work.
- **Open questions:** none.
- **Watch out for:** a terminal a call names but never completes is listed at turn end with the command line. The mapping keeps no content for a call that is still open.
  The exit and a release can both come; `listed` is what makes the removal happen once.
  `settleTerminals` is on the `Handlers` interface, so the turn's end reaches it through the context.
