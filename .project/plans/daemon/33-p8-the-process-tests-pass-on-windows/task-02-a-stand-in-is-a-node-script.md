---
title: A stand-in is a Node script
status: done
depends: []
layer: tests
refs:
  - "[code://packages/computer/test/computer-spawn.test.ts#L25](../../../../packages/computer/test/computer-spawn.test.ts#L25) - `node`, the stand-in a port answers"
  - "[code://packages/sdk/test/nested-process.test.ts#L91](../../../../packages/sdk/test/nested-process.test.ts#L91) - `misfit`, the machine that is not what it should be"
---

## Objective

The stand-ins for a CLI and for a broken machine are this Node running a script, so they run on Windows as on Linux.

## Files

- `UPDATE: packages/computer/test/computer-spawn.test.ts` - `ran(command, args)` becomes `node(script)`, and `cat`, `sleep 30`, `true`, `sh -c printf` and `false` become the same behaviour in Node.
- `UPDATE: packages/sdk/test/nested-process.test.ts:91` - `shell(script)` with `sh -c` becomes `misfit(script)` with `node -e`, for its three uses: a child that exits 3 with a line on stderr, one that closes its stdin and keeps running, and one that leaves a grandchild holding its pipes.

## Steps

1. Write the helper in each file, `{ command: process.execPath, args: ['-e', script] }`.
2. Replace each POSIX program with the script that does the same: `process.stdin.pipe(process.stdout)`, `setTimeout(() => {}, 30000)`, an empty script, `process.stdout.write(...)`, `process.exit(1)`.
3. In `nested-process.test.ts`, close the stdin with `require('node:fs').closeSync(0)`, and leave the grandchild with `spawn(..., { stdio: 'inherit' })`.
4. Run both files on the Windows VM and on this host.

## Validation

- On the Windows VM: `computer-spawn.test.ts` passes 7 of 7, and the stand-in cases of `nested-process.test.ts` pass or say why they skip.
- The Linux jobs pass.

## Resume

Done 2026-10-20. Not reviewed.
On the Windows VM, from `main` at `8ad65e71` with this change copied over: `computer-spawn.test.ts` passes 7 of 7, where it failed 5, and its `kill EINVAL` is gone with the stand-ins.
In `nested-process.test.ts` the child that exits 3 and the one that leaves a grandchild pass.
The child that closes its stdin cannot be seen on Windows: a probe on this Windows host showed a write to its pipe is queued until the child exits, with no `EPIPE`, whether the child calls `closeSync(0)` or `process.stdin.destroy()`. That case skips with its reason, by task 03's rule, and keeps the Node stand-in on POSIX.
