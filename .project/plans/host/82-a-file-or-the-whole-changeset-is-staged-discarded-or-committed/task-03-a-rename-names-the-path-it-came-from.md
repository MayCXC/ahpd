---
title: A rename names the path it came from
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/changes.ts#L637-L680](../../../../packages/sdk/src/changes.ts#L637-L680) - the loop over `git status` records, which skips a rename's old path"
  - "[code://packages/sdk/src/changes.ts#L173](../../../../packages/sdk/src/changes.ts#L173) - `beforeUri`, the HEAD content of a path"
---

## Objective

A renamed file's row has the old path in `before` and the new path in `after`.
A client then shows it as a rename, as the protocol defines one.

## Files

- `UPDATE: packages/sdk/src/changes.ts:637-680` - keep the old path that `R` and `C` records carry, and use it for `before`.
- `UPDATE: packages/sdk/test/changes-uris.test.ts` - a staged rename, and a rename in a subdirectory.
- `UPDATE: docs/AHP.md:697-710` - a rename's row has two URIs.

## Steps

1. Read the record after an `R` or `C` record as the old path, instead of skipping it.
2. For an `R` record, set `before.uri` to the old path and `before.content.uri` to `beforeUri(dir, old)`.
3. For a `C` record, keep `before` as today, because the source file still exists.
4. Keep the row's `id` as the new path's URI.
5. When the old path is outside the directory, keep the row as an added file.

## Validation

- `git mv a.ts b.ts` gives one row with `before` at `a.ts` and `after` at `b.ts`.
- The `before` content is `a.ts` at HEAD.
- Stage, unstage and discard on the row act on the new path, as before.
- The gates pass.
