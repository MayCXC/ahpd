---
title: A terminal case ends the shell it started
status: done
depends: []
layer: tests
refs:
  - "[code://packages/sdk/test/pty.test.ts#L430-L494](../../../../packages/sdk/test/pty.test.ts#L430-L494) - \"a terminal ended by hand\", whose stand-ins catch the kill"
  - "[code://tools/test-tmpdir.ts#L37-L38](../../../../tools/test-tmpdir.ts#L37-L38) - the run's folder, removed when the run ends"
---

## Objective

The two cases of "a terminal ended by hand" that catch the kill end their shell themselves, so the run's folder can be removed on Windows.

## Files

- `UPDATE: packages/sdk/test/pty.test.ts` - "ends the shell's tree with taskkill on Windows" and "sends SIGKILL to the group off Windows" end the Node they started and wait for its exit.

## Steps

1. After the assertions, end the shell by the pid the stand-in was given, and wait for `waitForExit`.
2. Run `pty.test.ts` on this host and on the Windows VM, and look for `EBUSY` or `EPERM` in the teardown.

## Validation

- `pty.test.ts` exits 0 on Windows, with no error in the global teardown.
- The Linux jobs pass.

## Resume

Done 2026-10-20. Not reviewed.
Found while task 04 ran: `pty.test.ts` passed every case and still exited 1, on this host with `EPERM` and on the VM with `EBUSY`, from the removal of the run's folder.
Run block by block, only "a terminal ended by hand" left it; its stand-in `run` and its mocked `process.kill` meant no kill reached the Node child, which kept the run's folder as its working directory.
It was there on `main` too, and the `check-windows` job did not show it.
After: two runs on this host and one on the VM exit 0 with no teardown error.
