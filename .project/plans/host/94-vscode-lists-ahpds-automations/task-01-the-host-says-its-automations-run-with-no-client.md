---
title: The host says its automations run with no client
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L276-L323](../../../../packages/sdk/src/host/handshake.ts#L276-L323) - the `automations` capability and the `_meta` flags"
  - "[code://packages/sdk/test/automations.test.ts#L416](../../../../packages/sdk/test/automations.test.ts#L416) - the capability case to extend"
---

## Objective

`initialize` on a host with an automation store answers `_meta['vscode.autonomousAutomations']: true`, so VS Code's window offers the host's automations.

## Files

- `UPDATE: packages/sdk/src/host/handshake.ts:303-323` - add `'vscode.autonomousAutomations': true` to `_meta` when `options.automations` is set, with a comment that says what the flag is.
- `UPDATE: packages/sdk/test/automations.test.ts` - the two cases in Validation.

## Steps

1. Write the two tests first.
2. Add the flag to `_meta`, under the same condition as the `automations` capability.
3. Run the gates, and restore `packages/sdk/test/fixtures/wire.jsonl` after the tests.
4. Set the task to `implemented`, and write the Resume section.

## Validation

- A test: a host with automations answers `_meta['vscode.autonomousAutomations']: true` on `initialize`.
- A test: a host with no automation store has no `vscode.autonomousAutomations` key.
- Run `pnpm -s build`, `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk and server.

## Resume

Implemented 2026-10-15.

- `packages/sdk/src/host/handshake.ts` - `initialize` adds `'vscode.autonomousAutomations': true` to `_meta` when `options.automations` is set, with a comment that says what the flag is.
- `packages/sdk/test/automations.test.ts` - two cases after the capability case. A host with automations answers the flag `true`. A host with no automation store has no such key.
- Gates: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass, and `git diff --quiet tools/` is clean.
- Vitest of sdk and server: 203 files and 4030 tests pass, with no flakes. `packages/sdk/test/fixtures/wire.jsonl` is restored.
