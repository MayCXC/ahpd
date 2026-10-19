---
title: The update and control tests run on Windows
status: implemented
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: tests
refs:
  - "[code://packages/server/test/selfupdate-place.test.ts](../../../../packages/server/test/selfupdate-place.test.ts) - the layout cases, in the paths of the machine they name"
  - "[code://packages/server/test/server-update.test.ts](../../../../packages/server/test/server-update.test.ts) - `install`, a Linux machine's global install"
  - "[code://packages/server/test/host-update-method.test.ts](../../../../packages/server/test/host-update-method.test.ts) - `install`, the same"
  - "[code://packages/server/test/control.test.ts](../../../../packages/server/test/control.test.ts) - `here`, a named pipe on Windows"
---

## Objective

daemon/35's update tests and the control tests pass on Windows, each checking the flow it was written for.

## Files

- `UPDATE: packages/server/test/selfupdate-place.test.ts` - the Linux layout cases use POSIX paths and answered folder checks, and the link case makes a junction on Windows.
- `UPDATE: packages/server/test/server-update.test.ts` and `packages/server/test/host-update-method.test.ts` - the made-up install is a Linux machine's, under the test's folder written with forward slashes.
- `UPDATE: packages/server/test/control.test.ts` - on Windows the control listens on a named pipe a start would make.

## Steps

1. Reproduce: the update tests are refused with "is not an npm install", and every control case that talks over the pipe times out.
2. Find the causes: the fixtures paired `platform: 'linux'` with native Windows paths, and the control test listened on a path in a folder, which Windows cannot.
3. Write the Linux layout in POSIX paths under the test's folder, so the in-process install is checked on any system, the fake npm writes only there, and the Windows hand-over keeps its own case.
4. Use `controlFor('win32')` with no path on Windows, which names a pipe the way a start does.
5. Run the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- `selfupdate-place.test.ts`, `server-update.test.ts`, `host-update-method.test.ts` and `control.test.ts` pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine: the update tests pass (30) and the control tests pass (16).
`installPlace` reads Windows' own layout correctly; no product change was needed.
The control cases are the first run of the Windows half, a real named pipe, which the file had left to a hand check.
A first version used `/usr/local` as the prefix: the fake npm writes what it installs under the prefix, which the Linux runner refused with `EACCES` and which on Windows landed on the drive's root.
The prefix is the test's own folder now.
The Linux half of Validation is the CI run of the branch.
