---
title: A written file lands in the attachments
status: todo
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
