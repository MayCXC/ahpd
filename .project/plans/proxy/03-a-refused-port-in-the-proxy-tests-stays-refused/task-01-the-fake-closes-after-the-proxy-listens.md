---
title: The fake closes after the proxy listens
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/test/proxy-forward.test.ts#L204-L214](../../../../packages/server/test/proxy-forward.test.ts#L204-L214) - the 502 case"
  - "[code://packages/server/test/proxy-forward.test.ts#L347-L360](../../../../packages/server/test/proxy-forward.test.ts#L347-L360) - the 429 and refused case"
  - "[code://packages/server/test/proxy-forward.test.ts#L381-L393](../../../../packages/server/test/proxy-forward.test.ts#L381-L393) - the never-took-the-connection case"
---

## Objective

In each case that needs a refused port, the fake `gone` closes after `proxy` and every other fake listen.
No server in the test process can then take the port of `gone` before the call.

## Files

- `UPDATE: packages/server/test/proxy-forward.test.ts:204-214` - close `gone` after `proxy` listens.
- `UPDATE: packages/server/test/proxy-forward.test.ts:347-360` - close `gone` after `up` and `proxy` listen.
- `UPDATE: packages/server/test/proxy-forward.test.ts:381-393` - close `gone` after `up` and `proxy` listen.

## Steps

1. In each of the three cases, move `await gone.close()` and its `fakes.splice` line after the `proxy` call.
2. Keep `gone.endpoint` in the table, because the endpoint stays the same after the close.
3. Run `proxy-forward.test.ts` 20 times and expect each run to pass.
4. Set this task and the plan row to `implemented`.

## Validation

- `proxy-forward.test.ts` passes 20 times in a row from the repository root.
- `pnpm -s typecheck` passes.

## Resume

- **Done so far:** in each of the three cases, `gone` closes after `proxy` listens. The test file passed 20 of 20 runs from the repository root. `pnpm -s typecheck` passed.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the log assertions name `p0 unreachable` and `p1 unreachable`; they must not change.
