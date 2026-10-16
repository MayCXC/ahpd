---
title: The test scripts run in both shells
status: todo
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
