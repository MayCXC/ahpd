---
title: The wait and the cases give a slow start room
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/test/daemon-backend.test.ts#L35-L60](../../../../packages/server/test/daemon-backend.test.ts#L35-L60) - `run` and its wait"
  - "[code://vitest.config.ts#L25-L34](../../../../vitest.config.ts#L25-L34) - the suite's timeout"
---

## Objective

`run` waits 40 s for its daemon to end before it stops it, and every case in the file may take 60 s.

## Files

- `UPDATE: packages/server/test/daemon-backend.test.ts:20` - add the wait and the case's timeout as constants, with why each is what it is.
- `UPDATE: packages/server/test/daemon-backend.test.ts:57` - wait for the constant.
- `UPDATE: packages/server/test/daemon-backend.test.ts:62-146` - give each case the constant as its timeout.

## Steps

1. Run the file pinned to one CPU that busy loops share, and see cases fail at 4 s.
2. Add the two constants after `REPO`. Their comment names the wait, the start it outlasts, and the timeout above it.
3. Wait for the first constant in `run`.
4. End each of the seven cases with the second constant.
5. Run the file pinned the same way again, and see every case pass.

## Validation

- Pinned beside busy loops, the file fails before step 2, and passes after step 4.
- Idle, the file passes before and after.
- Run `pnpm -s typecheck`, and see it exit 0.

## Resume

