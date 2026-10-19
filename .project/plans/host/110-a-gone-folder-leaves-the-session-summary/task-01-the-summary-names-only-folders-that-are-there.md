---
title: The summary names only folders that are there
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L478-L490](../../../../packages/sdk/src/host/catalogue.ts#L478-L490) - `summaryOf`, the first caller"
  - "[code://packages/sdk/src/host/catalogue.ts#L948-L971](../../../../packages/sdk/src/host/catalogue.ts#L948-L971) - `adopt`, the second caller"
  - "[code://packages/sdk/src/fileuri.ts#L65](../../../../packages/sdk/src/fileuri.ts#L65) - `localPath`"
---

## Objective

A session summary names only the `file:` folders that are directories on this host.
The store record and `wheres` keep every folder.

## Files

- `UPDATE: packages/sdk/src/host/catalogue.ts` - a filter for `workingDirectories`, used in `summaryOf` and in `adopt`.
- `UPDATE: docs/sdk/SESSIONS.md` - one sentence: a summary leaves out a folder that is not there.
- `CREATE: packages/sdk/test/catalogue-gone-folder.test.ts` - the removed, made again and non-`file:` cases.

## Steps

1. Read how a session inside a computer names its folder, in plugin 11 and `lifecycle.ts`.
2. Write a filter that keeps a URI that is not `file:`, and a `file:` URI whose `localPath` is a directory.
3. Use `statSync` with `throwIfNoEntry: false`, and treat any other error as a folder that is there.
4. Apply the filter to `workingDirectories` in `summaryOf`.
5. Apply the filter to the summary that `adopt` returns, and keep `row.workingDirectories` in `wheres` and the store.
6. Add the sentence to `docs/sdk/SESSIONS.md`.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- Test that the next listing gives no folder for a session whose folder you removed.
- Test that the summary names the folder again after you make it again.
- Test that the summary keeps a URI that is not `file:`.
- Test that the store record still holds the folder after the removal.
- Run the gates.

## Resume
