---
title: A backend feeds an output terminal
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/terminals.ts#L158-L229](../../../../packages/sdk/src/host/terminals.ts#L158-L229) - `heldTerminals`, the factory pattern"
  - "[code://packages/sdk/src/host/terminals.ts#L125-L141](../../../../packages/sdk/src/host/terminals.ts#L125-L141) - `terminalInfo`, the root list"
  - "[code://packages/sdk/src/machines/terminals.ts#L291-L295](../../../../packages/sdk/src/machines/terminals.ts#L291-L295) - `KEEP` and how `terminal/data` is sent"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L855-L945 - the output-only terminal verbs"
---

## Objective

A backend gets a terminal that shows text it supplies, with no process behind it.
A client subscribes to it like any terminal, and it is not on the root terminal list.

## Files

- `UPDATE: packages/sdk/src/types/terminals.ts` - `OutputTerminal` and `OutputTerminals`.
- `UPDATE: packages/sdk/src/types/agent.ts` - `Start.outputTerminals`.
- `UPDATE: packages/sdk/src/index.ts` - export the two types.
- `UPDATE: packages/sdk/src/host/terminals.ts` - the output terminal and its factory; skip it in `terminalInfo`.
- `UPDATE: packages/sdk/src/host/spawn.ts` - hand `outputTerminals` to the backend.
- `CREATE: packages/sdk/test/host-output-terminals.test.ts` - the cases below.

## Steps

1. Define `OutputTerminal` with `uri`, `append(text)`, `reset()`, `replace(text)`, `finalize(exitCode?)` and `dispose()`.
2. Define `OutputTerminals` with `create({ title, chat })`.
3. Create the terminal at `ahp-terminal:/<uuid>` with the session claim, and put it in the host's map.
4. Answer `isPty: false`, and ignore input and resize.
5. Send `terminal/data` on `append`, and send the whole content on `reset` and `replace`.
6. Keep at most `KEEP` characters of content.
7. Mark the terminal as exited on `finalize`, and keep the exit code when the backend gives one.
8. Leave the output terminal out of `terminalInfo`.
9. Offer `outputTerminals` on `Start` whether or not the host has a terminal store.
10. Write the tests.
11. Set this task and its plan row to `implemented`.

## Validation

- A subscriber reads the appended text, and a late subscriber reads the same content.
- `replace` leaves only the new text.
- The root terminal list does not name the output terminal.
- A session's close removes the terminal.
- `pnpm exec tsc --noEmit`, `pnpm boundary` and `pnpm test` pass.

## Resume

- **Done so far:** built. `OutputTerminal` has `uri`, `append`, `reset`, `replace`, `finalize` and `dispose`; `OutputTerminals.create({title, chat})` is the factory. The terminal lives at `ahp-terminal:/<uuid>` in the host's map with a session claim, answers `isPty: false`, and ignores input and resize. `append` sends `terminal/data` and `replace` sends `terminal/cleared` then the new text; both keep at most 200 000 characters, the same `KEEP` a process terminal uses. `reset` sends `terminal/cleared` alone, since the content it leaves is empty. `finalize` sends `terminal/exited` with the code when there is one. A set of URIs in `terminals.ts` keeps output terminals off `terminalInfo`, and `Start.outputTerminals` is handed whether or not the host has a terminal store. Tests are in `test/host-output-terminals.test.ts` and all four cases pass.
- **Next action:** task 03, the `vscode/stopBackgroundWork` method and its gate.
- **Open questions:** none.
- **Watch out for:** a closed session must not leave an output terminal in the map. The test checks this by disposing the session and then asserting that a subscribe to the terminal URI rejects. The two red tests are still red, as task 01 recorded. They turn green when tasks 04 and 05 move those backends to the seam.
