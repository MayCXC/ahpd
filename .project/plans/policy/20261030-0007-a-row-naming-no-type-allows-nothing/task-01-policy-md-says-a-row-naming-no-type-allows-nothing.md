---
title: POLICY.md says a row naming no type allows nothing
status: done
depends: []
layer: docs
refs:
  - "[code://packages/sdk/src/access/decide.ts#L149-L173](../../../../packages/sdk/src/access/decide.ts#L149-L173) - `matched`"
  - "[code://docs/sdk/POLICY.md#L34-L38](../../../../docs/sdk/POLICY.md#L34-L38) - what a `match` holds"
---

## Objective

POLICY.md says that a row whose `match` names no type is never a candidate, and how an allow covers everything of its kind.

## Files

- `UPDATE: docs/sdk/POLICY.md:38` - a paragraph after the one on a type the request did not ask for.

## Steps

1. Add the paragraph, in the words of `matched`'s comment and POLICY.md's own `*` examples.

## Validation

- The paragraph says what `matched` does: a row naming no type returns false.

## Resume

Done 2026-10-30.
