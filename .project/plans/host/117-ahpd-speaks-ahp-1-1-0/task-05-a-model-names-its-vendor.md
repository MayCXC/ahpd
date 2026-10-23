---
title: A model names its vendor
status: todo
depends: [01]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L664-L686](../../../../packages/sdk/src/host/catalogue.ts#L664-L686) - `learnModels`, which compares ids only"
  - "git://github.com/microsoft/agent-host-protocol@65114f22 - optional `SessionModelInfo.vendor`"
---

## Objective

A `vendor` that a backend puts on a model reaches the client, and a changed vendor counts as a changed list.

## Files

- `UPDATE: packages/sdk/test/host-catalogue.test.ts` - the vendor comparison cases.
- `UPDATE: packages/sdk/src/host/catalogue.ts:664-686` - the comparison includes `vendor`.

## Steps

1. Change the comparison in `learnModels` to compare `vendor` beside `id`.
2. Keep each backend's `models()` as it is, since no backend fills `vendor` yet.

## Validation

- `packages/sdk/test/host-catalogue.test.ts` - a vendor change dispatches `root/agentsChanged`, and an equal list dispatches nothing.
- The sdk vitest suite passes.

## Resume

