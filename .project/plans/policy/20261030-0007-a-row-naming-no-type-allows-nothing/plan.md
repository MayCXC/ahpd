---
title: A row naming no type allows nothing, and POLICY.md says so
domain: policy
status: built
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/sdk/src/access/decide.ts#L118-L142](../../../../packages/sdk/src/access/decide.ts#L118-L142) - `matched`: a row about nothing the request asked for is not a candidate at all"
  - "[code://docs/sdk/POLICY.md#L34-L38](../../../../docs/sdk/POLICY.md#L34-L38) - `*`, a type left out, and an allow as a candidate on what was asked"
---

## Goal

POLICY.md says what a row whose `match` names no type does, as `matched` decides it.

## Reconnaissance

The files read are the `refs` in the frontmatter, each with its note.

### Gaps

- `matched` answers whether the row named a type the request asked for, so a row naming none is never a candidate.
- POLICY.md says a type left out is unconstrained, of a row that names others, and that an allow is a candidate on what was asked. It never says what a row naming no type does, and read alone the first sentence makes such a row allow everything.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A row naming no type is never a candidate | `matched`, its comment and its `about` flag | 01 |
| An allow meant to cover everything names `*` for its kind's own type | POLICY.md's `agent:*` and `model:*` | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - POLICY.md says a row naming no type allows nothing](task-01-policy-md-says-a-row-naming-no-type-allows-nothing.md) | done | - |

## Risks and tradeoffs

- None: the documentation says what the code does.

## Resume state

- **Done so far:** planned and built 2026-10-30. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [x] POLICY.md's paragraph says what `matched` does.
