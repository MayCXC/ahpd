---
title: The daemon keeps the decisions in a state file
status: todo
depends: [task-01-a-store-keeps-the-decisions.md]
layer: "packages/server"
refs:
  - "[code://packages/server/src/config.ts#L409](../../../../packages/server/src/config.ts#L409) - `automationStatePath`, the pattern for the path"
  - "[code://packages/server/src/scheduled.ts](../../../../packages/server/src/scheduled.ts) - a versioned state file, written with `writeJsonAtomic`"
  - "[code://packages/server/src/commands/run.ts#L170-L185](../../../../packages/server/src/commands/run.ts#L170-L185) - `wholeFiles`, the files swept at start"
  - "[code://packages/server/src/commands/run.ts#L690-L700](../../../../packages/server/src/commands/run.ts#L690-L700) - where the host gets its stores"
---

## Objective

The daemon keeps global and folder decisions in `<configDir>/customizations-state.json`, so a decision survives a restart.

## Files

- `UPDATE: packages/server/src/config.ts:409` - add `customizationStatePath()`.
- `CREATE: packages/server/src/enablement.ts` - `fileEnablement({ file })`, an `EnablementStore` on the state file.
- `UPDATE: packages/server/src/commands/run.ts:170-185` - add the state file to `wholeFiles`.
- `UPDATE: packages/server/src/commands/run.ts:690-700` - pass `fileEnablement` to the host as `enablement`.
- `CREATE: packages/server/test/enablement.test.ts` - the cases below.

## Steps

1. Add `customizationStatePath()` beside `automationStatePath()` in `config.ts`.
2. Write `fileEnablement` in `enablement.ts` with the rules of `memoryEnablement`.
3. Write the file as `{ version: 1, global, folders }` with `writeJsonAtomic` after each change.
4. Read the file once at start, and start empty when it is missing or unreadable.
5. Report an unreadable file through `onProblem`, as `scheduled.ts` does.
6. Add the path to `wholeFiles`.
7. Pass the store to the host in `run.ts`.

## Validation

- `enablement.test.ts` checks that a new store on the same file reads a decision from an earlier store.
- It checks that a corrupt file starts empty and reports a problem.
- `pnpm -s typecheck` and `pnpm exec vitest run packages/server` pass.

## Resume
