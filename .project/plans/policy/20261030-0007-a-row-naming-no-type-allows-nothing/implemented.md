---
title: A row naming no type allows nothing, and POLICY.md says so - implemented
date: 2026-10-30
refs:
  - "[code://docs/sdk/POLICY.md#L40](../../../../docs/sdk/POLICY.md#L40) - the paragraph"
---

POLICY.md says that a row whose `match` names no type is never a candidate, as `matched` decides it, and that an allow meant to cover everything of its kind names `*` for the kind's own type.

## What was built

- [`code://docs/sdk/POLICY.md`](../../../../docs/sdk/POLICY.md) - the paragraph after the one on a type the request did not ask for.

## Verified

- `matched` returns its `about` flag, which only a type the row names and the request asked for sets, so a row naming no type returns false.

## Departures from the plan

- none.

## Left for later

- ahpw starts a new row with an empty `match` and shows an empty `match` as "Anything" (src/resources/policies/PolicyPage.tsx `FRESH`, src/resources/policies/words.ts `matchLine`). That is ahpw's to change.
