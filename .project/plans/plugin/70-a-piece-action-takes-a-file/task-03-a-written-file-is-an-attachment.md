---
title: A written file lands in the attachments
status: done
depends: [task-01-a-call-carries-the-attachments.md]
layer: "activepieces"
refs:
  - "[code://packages/activepieces/src/child.ts#L286](../../../../packages/activepieces/src/child.ts#L286) - `files: refused('files')`, which this task replaces"
  - "[code://packages/sdk/src/host/attachments.ts#L138](../../../../packages/sdk/src/host/attachments.ts#L138) - the pattern: how the host writes into the folder"
  - "[code://docs/plugins/activepieces.md#L5](../../../../docs/plugins/activepieces.md#L5) - the section on how a session binds a connector"
  - npm://@activepieces/pieces-framework@0.32.0 - `FilesService.write({ fileName, data })`, which answers a string
---

## Objective

A piece that calls `files.write` puts the file in the session's attachments folder.
The call answers the file's path, so the action's output names a file the agent can read.
A call with no folder still refuses the write.

## Files

- `UPDATE: packages/activepieces/src/child.ts:286` - write into the call's folder, and answer the path.
- `UPDATE: packages/activepieces/test/child.test.ts` - cases for a write, a name that clashes, a name with a path in it, and a call with no folder.
- `UPDATE: docs/plugins/activepieces.md` - say what a `FILE` value may be, where a written file goes, and which addresses are refused.

## Steps

1. Keep `refused('files')` for a call with no folder.
2. Reduce `fileName` to its base name, and replace any character a file name may not hold.
3. Add a number before the extension when a file of that name exists.
4. Write the bytes with the `wx` flag, so an existing file is never replaced.
5. Answer the written file's absolute path.
6. Add the test cases, and update `docs/plugins/activepieces.md`.

## Validation

- `pnpm exec vitest run packages/activepieces/test/child.test.ts` passes, with the new cases.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** a call with a folder runs with a `files` service. Its `write({ fileName, data })` puts the bytes in that folder and answers the file's absolute path. The name is reduced to its basename, and every character a file name may not hold becomes `-`. When nothing is left, the name is `file`. The name is cut at 80 characters with its extension kept, which is the length the host's own attachments are named to. A name another call already wrote takes a number before its extension. The file is created with the `wx` flag at mode 0400, so an existing file is never replaced and a written file is read-only. A write that fails for any reason other than the name being taken answers `the file could not be written`. That message names neither the path nor the bytes. A call with no folder still runs with `refused('files')`, so the piece is told `this plugin does not offer files`. `docs/plugins/activepieces.md` says what a `FILE` value may be, which addresses are refused, and where a written file goes.
- **Next action:** none. The plan is implemented and active, and no task follows this one.
- **Files:** `packages/activepieces/src/child.ts`, `packages/activepieces/test/child.test.ts`, `packages/activepieces/test/fixtures/piece-run.mjs`, `docs/plugins/activepieces.md`, this task file, the plan and the index. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** a later review asked for the 80 character name. `child.test.ts` has the case: a name of 100 characters with `.txt` lands at 80 and keeps the extension.
- **Watch out for:** the child gets the folder in the run request and never resolves one of its own. There is no path for a piece to name. The write is in the child, so a file an action writes is in the folder the daemon's own attachments live in. It is removed with the session like any other attachment. A written file's bytes never appear in an answer, a problem line or the daemon's output. The action's output names the path, and the piece reads the file if it needs it.
