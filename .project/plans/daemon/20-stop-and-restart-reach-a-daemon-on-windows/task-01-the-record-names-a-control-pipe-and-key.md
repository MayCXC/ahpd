---
title: The record names a control pipe and key
status: done
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

- **Status:** implemented, and not committed. The files this task changed are `packages/server/src/daemon.ts` and `packages/server/test/daemon.test.ts`.
- **Done:** `Control` is `{ pipe, key }`, and `Running` carries it as `control?`, absent on a platform whose signals reach a daemon.
  `CONTROL_ENV` is `AHPD_CONTROL`, beside `DETACHED_ENV`.
  `controlFor(platform, pipe?)` answers a pipe and a key on win32, and nothing elsewhere.
  The pipe is `\\.\pipe\ahpd-` and 16 random bytes as hex, and the key is 32 random bytes as hex.
  The second argument lets a test give a unix socket path in place of the pipe name.
  `start` makes the control, hands it to the child in `AHPD_CONTROL`, and passes it to `recordOf`.
  `recordOf` writes it as `control`, and writes no field when it is given none.
  No line a verb prints comes from it: the key stays in the 0600 record.
- **Verified:** `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/server` pass, 925 cases in 47 files.
  Six cases are new: three for `controlFor`, two for `control` in `recordOf`, and one for a start with no control here.
- **Left by hand:** the Windows half, that `AHPD_CONTROL` reaches the child there and the record holds `control`.
  This machine is Linux, so `controlFor('win32')` is driven from a case instead.
- **Next action:** task 02, the control server in the daemon.
