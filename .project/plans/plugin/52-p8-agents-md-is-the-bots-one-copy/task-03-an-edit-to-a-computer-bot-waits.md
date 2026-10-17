---
title: An edit to a computer bot waits for the computer
status: todo
depends: [task-02-the-persona-is-read-from-agents-md.md]
layer: "packages/bot, packages/computer"
refs:
  - "[code://packages/bot/src/wake.ts#L168](../../../../packages/bot/src/wake.ts#L168) - a bot with `computer` starts its back session there"
  - "[code://packages/computer/src/provider.ts](../../../../packages/computer/src/provider.ts) - the computer's provider"
---

## Objective

A computer bot's `AGENTS.md` is on the computer.
The host reads and writes it through the computer when the computer is online.
The record keeps the last parts that the host read, and the UI shows them while the computer is offline.
An edit while the computer is offline waits in the record, and the next start of a back session writes it.

## Files

- `UPDATE: packages/bot/src/provider.ts` - read and write the file through the computer, with the last parts as a fallback.
- `UPDATE: packages/bot/src/record.ts` - the last parts and the waiting edit.
- `UPDATE: packages/bot/src/wake.ts` - write the waiting edit before the back session starts.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - the tests of the offline edit.

## Steps

1. Find how the host reads and writes a file on a computer, and stop if no way exists.
2. Read the parts through the computer, and keep them in the record as the last parts.
3. Answer the last parts when the computer is offline.
4. Keep an edit made offline in the record as the waiting edit.
5. Write the waiting edit with `writeAgents` before a back session starts, then clear it.
6. Show a waiting edit on a read, so the UI shows what the person wrote.

## Validation

- `bot-provider.test.ts`: test that an offline edit waits, and the next start writes it.
- `bot-provider.test.ts`: test that an offline read answers the last parts.
- The gates pass: build, typecheck, boundary, schema and vitest.
