---
title: The record names a control pipe and key
status: todo
depends: []
layer: "packages/server"
refs:
  - "[code://packages/server/src/daemon.ts#L9-L37](../../../../packages/server/src/daemon.ts#L9-L37) - `Running`"
  - "[code://packages/server/src/daemon.ts#L304-L400](../../../../packages/server/src/daemon.ts#L304-L400) - `start` and `recordOf`"
---

## Objective

On win32, `start` makes a random pipe name and key for each child, gives them to the child, and records them as `control` in `daemon.json`.

## Files

- `UPDATE: packages/server/src/daemon.ts:9-37` - `control?: { pipe: string; key: string }` on `Running`.
- `UPDATE: packages/server/src/daemon.ts:304-400` - `start` makes the control on win32, sets `AHPD_CONTROL`, and passes it to `recordOf`.
- `UPDATE: packages/server/test/daemon.test.ts` - cases for the record with and without `control`.

## Steps

1. Add `CONTROL_ENV = 'AHPD_CONTROL'` beside `DETACHED_ENV` in `daemon.ts`.
2. Add `controlFor(platform)`, which answers `{ pipe, key }` on win32 and nothing elsewhere.
3. Make the pipe `\\.\pipe\ahpd-` and 16 random bytes as hex, and the key 32 random bytes as hex.
4. Let a test give `controlFor` a unix socket path in place of the pipe name.
5. In `start`, set `AHPD_CONTROL` to the JSON of the control in the child's environment.
6. Give the control to `recordOf`, and write it as `control` in the record.
7. Check that no line `start` prints holds the key.

## Validation

- `daemon.test.ts` finds `control` in a record on win32, and no `control` on linux.
- Two starts give two different pipes and two different keys.
- `pnpm -s typecheck` and `pnpm exec vitest run packages/server/test/daemon.test.ts` pass.

## Resume
