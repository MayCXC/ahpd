---
title: The report is a leaf of the ssh machine
status: done
depends: [task-01-the-check-runs-on-a-box.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/provider.ts#L175-L185](../../../../packages/computer/src/provider.ts#L175-L185) - the leaves under a machine"
  - "[code://packages/computer/src/provider.ts#L390-L420](../../../../packages/computer/src/provider.ts#L390-L420) - where a leaf is read"
---

## Objective

An ssh machine has a leaf `server`.
Reading `computer://ssh.<name>/server` runs the check on that box and answers the report as JSON, with each item's fix.
A machine of another runtime has no `server` leaf.

## Files

- `UPDATE: packages/computer/src/runtime.ts:531-669` - an optional `check(id)` on `ComputerRuntime`.
- `UPDATE: packages/computer/src/provider.ts:175-185` - the `server` leaf, listed only for a machine whose runtime has `check`.
- `UPDATE: packages/computer/src/provider.ts:390-420` - a read of `server` calls `check` and answers the report.
- `UPDATE: packages/computer/test/computer-ssh.test.ts` - the cases below.

## Steps

1. Add `check` to the runtime type, and route it through the router by the machine id.
2. List `server` under a machine only when its runtime has `check`.
3. On a read, run the check, add the fixes, and answer the JSON with two spaces of indent.
4. Bound the check by the box's `connectTimeout` plus 20 seconds.
5. Answer a box that does not answer with an error that names the box.
6. Write the tests.

## Validation

- A listing of `computer://ssh.dev02/` holds `server`, and one of a docker machine does not.
- A read of `computer://ssh.dev02/server` against the fake ssh answers the report with its fixes.
- A box that never answers gives the error after the bound.
- `pnpm -s typecheck` passes, and the touched tests pass.

## Resume

- Done on 2026-10-30.
- The runtime has two optional members: `check(id)` runs the check, and `checks(id)` says whether `server` is listed.
- The bound is `connectTimeout` plus 20 seconds, tested with fake timers.
