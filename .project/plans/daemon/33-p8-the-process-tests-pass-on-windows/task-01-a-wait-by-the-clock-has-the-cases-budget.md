---
title: A wait by the clock has the case's budget
status: implemented
depends: []
layer: tests
refs:
  - "[code://tools/wait.ts#L10](../../../../tools/wait.ts#L10) - `WAIT_MS`"
  - "[code://packages/agent-pi/test/agent-pi-lazy.test.ts#L82](../../../../packages/agent-pi/test/agent-pi-lazy.test.ts#L82) - the plugin's import, given 2 s"
  - "[code://packages/sdk/test/conformance.test.ts#L487](../../../../packages/sdk/test/conformance.test.ts#L487) - the shell's echo, given 100 x 20 ms"
  - "[code://packages/sdk/test/host-terminals.test.ts#L48](../../../../packages/sdk/test/host-terminals.test.ts#L48) - `ended` and four more shell waits by a count"
---

## Objective

Every wait by the clock in these files waits up to `WAIT_MS`, so a Windows host whose shell is Windows PowerShell 5.1, and a cold first import, pass.

## Files

- `UPDATE: packages/agent-pi/test/agent-pi-lazy.test.ts:82` - `within(import('../src/index.js'), 2000)` becomes `WAIT_MS`.
- `UPDATE: packages/sdk/test/conformance.test.ts:487` - the loop of 100 x 20 ms becomes a deadline of `WAIT_MS`.
- `UPDATE: packages/sdk/test/host-terminals.test.ts:48, 318, 488, 532, 654` - the loops of 40 to 80 steps become a deadline of `WAIT_MS`.

## Steps

1. Import `WAIT_MS` from `tools/wait.ts` in each file, first, as the files PR #43 changed do.
2. Turn each `for (let i = 0; i < N; i++)` wait into `for (const until = Date.now() + WAIT_MS; Date.now() < until;)`, keeping its step and its break.
3. Run the three files on the Windows VM and on this host.

## Validation

- On the Windows VM: `agent-pi-lazy.test.ts`, `conformance.test.ts` and `host-terminals.test.ts` pass.
- The Linux jobs pass.

## Resume

Done 2026-10-20. Not reviewed.
Every fixed-count wait in `host-terminals.test.ts` became a deadline, five in all, not only the two that failed.
On the Windows VM, from `main` at `8ad65e71` with this change copied over: `agent-pi-lazy.test.ts` passes 1 of 1, `conformance.test.ts` 24 of 24 and `host-terminals.test.ts` 24 of 24, where they failed 1, 1 and 2 before.
