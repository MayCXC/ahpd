---
title: The docs name every kind of input request
status: todo
depends: []
layer: "docs"
refs:
  - "[code://docs/AHP.md#L443-L451](../../../../docs/AHP.md#L443-L451) - the input request table"
  - "[code://packages/sdk/src/tools/clientcalls.ts#L228-L230](../../../../packages/sdk/src/tools/clientcalls.ts#L228-L230) - `toolClientExecution`, raised by the client call holder"
---

## Objective

`docs/AHP.md` names the four kinds of input request that the host serves, and the code that raises each one.

## Files

- `UPDATE: docs/AHP.md:443-451` - the table with four rows, and the sentence above it.

## Steps

1. Find the code that raises `toolConfirmation`, `chatInput`, `toolClientExecution` and `toolAuthentication`.
2. Replace the sentence above the table with one that names four kinds.
3. Add a row for each kind, with the code that raises it and the action that answers it.

## Validation

- Each row names a kind that `rg "kind: '<kind>'" packages` finds.
- `node <do-spec>/scripts/lint-prose.mjs docs/AHP.md` reports nothing new on the lines this task wrote.

## Resume
