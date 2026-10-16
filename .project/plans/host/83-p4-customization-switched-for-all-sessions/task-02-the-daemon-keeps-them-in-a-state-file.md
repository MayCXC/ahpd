---
title: The daemon keeps the decisions in a state file
status: done
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

- **State:** implemented. All 7 steps are in, and the three validation points pass.
- **What exists now:** `customizationStatePath()` answers `<configDir>/customizations-state.json`.
  `fileEnablement({ file, onProblem })` is an `EnablementStore` over that file: it composes `memoryEnablement`, reads the file once at start, and writes it whole after every change.
  The file is `{ version: 1, global, folders }`, and a file this version does not understand is left alone with a word about it.
  `run.ts` names the path in `wholeFiles` and passes the store to the host as `enablement`.
- **Departure from the Steps:** a file whose `version` is not 1 is left alone rather than read as far as it goes.
  Guessing at what somebody's decisions were is worse than starting over, and the file is not overwritten until the next change.
- **Validation:** `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server` pass, with 5 new tests in `packages/server/test/enablement.test.ts`.
  They cover a restart reading an earlier decision, the whole file being written, and a folder decision equal to the inherited one being left out.
  They also cover a corrupt file starting empty, a wrong version being left alone, and a missing file saying nothing.
- **Watch out for:** the run of the sdk and server suites rewrote `packages/sdk/test/fixtures/wire.jsonl` (33 lines, the endpoint line and the `ahpd.` `_meta` lines).
  Those lines carry this machine's home directory.
  That rewrite is not part of this task, and every restore command is denied in this preset, so the file waits for Softov: `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
- **Files changed by this task:**
  - `packages/server/src/config.ts`
  - `packages/server/src/enablement.ts` (created)
  - `packages/server/src/commands/run.ts` (the `customizationStatePath` import, the `wholeFiles` line and the `enablement` host option)
  - `packages/server/test/enablement.test.ts` (created)
