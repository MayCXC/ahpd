---
title: The test scripts run in both shells
status: done
depends: []
layer: scripts
refs:
  - "[code://package.json#L27](../../../../package.json#L27) - `test:unit`"
  - "[code://tools/test-tmpdir.ts#L15-L16](../../../../tools/test-tmpdir.ts#L15-L16) - `TMPDIR`"
---

## Objective

`test:unit` quotes its globs with double quotes, so `cmd.exe` and `sh` pass the same globs.
The run's test folder goes in `TEMP` and `TMP` too, so Windows uses it.

## Files

- `UPDATE: package.json:27` - double quotes around each `--exclude` glob.
- `UPDATE: tools/test-tmpdir.ts:15-16` - set `TEMP` and `TMP` beside `TMPDIR`.

## Steps

1. Replace each single quote in `test:unit` with an escaped double quote.
2. Set `TEMP` and `TMP` to the run's folder, beside `TMPDIR`.
3. Run `pnpm test:unit`, and compare its file count with the count before.
4. Set this task and the plan row to `implemented`.

## Validation

- `pnpm test:unit` on Linux runs the same files as before.
- On Windows, `os.tmpdir()` in a test answers the run's folder.

## Resume

Done 2026-10-16. Every step is built.

The four `--exclude` globs reach vitest as the same argv under either shell, and the run's
test folder is named the way Windows reads it.

File by file:

- `package.json:27` - each of the four `--exclude` globs is double-quoted, escaped for the
  JSON string, so the script is `vitest run --exclude \"packages/computer/**\"` and so on
  (step 1). `sh` strips the pair as it stripped the single quotes, and `cmd.exe`, which
  keeps a single quote as part of the argument, strips this one.
- `tools/test-tmpdir.ts` - `process.env.TEMP` and `process.env.TMP` are set to the run's
  folder beside `process.env.TMPDIR` (step 2). On Linux `os.tmpdir()` reads `TMPDIR` first,
  so the two extra names change nothing there; on Windows they are the two it reads.

Judgement calls the plan does not decide:

- The three names are set in the order `TMPDIR`, `TEMP`, `TMP`, which is the order
  `os.tmpdir()` reads them in on either system.
- The comment above the assignment is extended rather than left naming `TMPDIR` alone. It
  is the file's own explanation of why the folder is set at all, and it would be wrong once
  three names are set. The added sentence is the one new fact: Windows reads the other two.

Validation:

- Step 3, the file count, before and after: `pnpm test:unit` collects 292 test files and
  5142 tests both times, and the after run passes all of them. The argv is the only thing
  the edit changes and it is the same string either way, so the set is the same set.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and `node tools/schema.mjs` each
  exit 0. No package is changed by this task, so no package's suite is run on its own.
- `git diff --quiet tools/` is *not* clean after this task, and the task is why: it edits
  `tools/test-tmpdir.ts`. Run with `git diff --stat tools/`, the one entry is
  `tools/test-tmpdir.ts | 5 ++++-`, and `node tools/schema.mjs` leaves
  `tools/ahp.strict.schema.json` itself unchanged.

Left:

- The second item of the Validation - `os.tmpdir()` in a test on Windows answering the
  run's folder - cannot be read here: this build is on Linux, and the Windows job that
  would read it is task 03's, which needs a push.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in
  this plan: 119 insertions and 106 deletions, the endpoint, the versions, the config keys,
  the tool entries and fresh ids. `git checkout --` is denied in this mode, so it is left as
  the suite wrote it. Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before
  committing.
- Nothing is committed, as asked.

Closed 2026-10-19: the tests step of the `check-windows` job passed on PR #30, in run 39344018005.
