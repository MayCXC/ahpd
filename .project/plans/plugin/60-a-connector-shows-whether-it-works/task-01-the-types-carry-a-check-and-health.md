---
title: The types carry a check and health
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L103-L143](../../../../packages/sdk/src/types/connectors.ts#L103-L143) - `Adapter`, where `check` goes"
  - "[code://packages/sdk/src/access/vault.ts#L64-L70](../../../../packages/sdk/src/access/vault.ts#L64-L70) - `secretRef`, the pattern for `envRef`"
---

## Objective

The sdk has the types the channel needs: an adapter's optional `check`, the health a row carries, and the environment reference.

## Files

- `UPDATE: packages/sdk/src/types/connectors.ts:103-143` - add `check?` to `Adapter`, and the types `CheckResult`, `CallOutcome` and `ConnectorHealth`.
- `UPDATE: packages/sdk/src/access/vault.ts:64-70` - add the type `EnvRef` and the function `envRef`, beside `secretRef`.
- `UPDATE: packages/sdk/src/index.ts` - export the new types and `envRef`.
- `UPDATE: packages/sdk/test/` - cases for `envRef`, in the test file that covers `secretRef`.

## Steps

1. Add `check?(connector: Connector): Promise<CheckResult>` to `Adapter`, with a doc comment that says when the host calls it.
2. Define `CheckResult` as `{ result: 'ok' | 'denied' | 'unreachable' | 'failed'; message?: string }`.
3. Define `CallOutcome` as `{ at: string; ok: boolean; status?: number; error?: string }`, with `at` as an ISO time.
4. Define `ConnectorHealth` as `{ check?: CheckResult & { at: string }; lastCall?: CallOutcome; lastFailure?: CallOutcome }`.
5. Add `EnvRef` as `{ $env: string }`, and `envRef(value)`, which answers the name or `undefined`, as `secretRef` does.
6. Accept only a name that matches `^[A-Za-z_][A-Za-z0-9_]*$` in `envRef`.
7. Export the new types and `envRef` from the sdk root.
8. Add `envRef` cases for a good name, a bad name, an extra key and a value that is no object.

## Validation

- The new `envRef` cases pass.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary` passes.

## Resume
