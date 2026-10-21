---
title: A put clears pool and cap, and a client imports the limits type
domain: policy
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires: []
refs:
  - "[code://packages/sdk/src/access/policy.ts#L173](../../../../packages/sdk/src/access/policy.ts#L173) - a put merges the body over the row the store holds"
  - "[code://packages/sdk/src/access/policies.ts#L77-L81](../../../../packages/sdk/src/access/policies.ts#L77-L81) - `edgeOf`, which reads `null` as absent: the pattern to reuse"
  - "[code://packages/sdk/src/access/policies.ts#L212-L224](../../../../packages/sdk/src/access/policies.ts#L212-L224) - `checkPolicy` refuses `null` for `pool` and `cap`"
  - "[code://packages/sdk/src/access/policy.ts#L49-L59](../../../../packages/sdk/src/access/policy.ts#L49-L59) - `PolicyLimits`, the answer of `policy://<id>/limits`"
  - "[code://packages/sdk/src/index.ts#L91](../../../../packages/sdk/src/index.ts#L91) - the index exports `PolicyChannels` and `PolicyProvider` only"
  - "[code://packages/sdk/test/policy-scheme.test.ts](../../../../packages/sdk/test/policy-scheme.test.ts) - the scheme tests, where a put is tested"
  - "[code://docs/sdk/POLICY.md#L56-L68](../../../../docs/sdk/POLICY.md#L56-L68) - The scheme, which says a row is written whole"
---

## Goal

A put to `policy://<id>` can remove a row's `pool` or `cap` with `null`, as it can remove `from`, `until` and `limits` today.
A client imports `PolicyLimits` from `@ahpd/sdk` to type what `policy://<id>/limits` answers.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "null" packages/sdk/src/access/policies.ts` - `edgeOf`, the match lists and `limits` read `null` as absent; `pool` and `cap` refuse it.
- `rg -n "null" docs/sdk/POLICY.md` - the doc does not say that `null` removes a field.
- `rg -n "PolicyLimits" packages/sdk/src/index.ts` - nothing.

### Runtime path

```
put policy://<id> { pool: null } -> { ...was, ...body, id } -> checkPolicy -> refuses pool -> the row keeps its pool
```

### Gaps

- A row that has a pool or a cap keeps it until the row is deleted and made again.
- A client copies the shape of `PolicyLimits` by hand.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `null` for `pool` or `cap` in a body is absent, so a put removes the field | ahpw builder report, 2026-10-19; Softov chose "One small plan, dsh builds" | 01 |
| `docs/sdk/POLICY.md` says which fields `null` removes | ahpw builder report, 2026-10-19 | 01 |
| The index exports `PolicyLimits` as a type | ahpw builder report, 2026-10-19 | 02 |
| A release follows only after Softov decides, once this plan merges | Softov, 2026-10-19, chose "Decide after the merge" | - |

## Proposed architecture

- **Data flow** - `checkPolicy` reads `null` for `pool` and `cap` as it reads `undefined`. The merged row then has no such field.
- **Layer responsibilities** - sdk: the check and the export · docs: one sentence in The scheme.
- **Source-of-truth files** - [`code://packages/sdk/src/access/policies.ts`](../../../../packages/sdk/src/access/policies.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - null clears pool and cap](task-01-null-clears-pool-and-cap.md) | done | - |
| [02 - the index exports PolicyLimits](task-02-the-index-exports-policylimits.md) | done | - |

## Risks and tradeoffs

- A client that sent `pool: null` to mean an error now removes the pool. No client did that, because the host refused it.

## Resume state

- **Done so far:** tasks 01 and 02 implemented 2026-10-19. A put with `pool: null` or `cap: null` removes the field. The manifest takes `null` for every field the check reads it for. `docs/sdk/POLICY.md` says what `null` removes, and `@ahpd/sdk` exports `PolicyLimits`.
- **Closed:** commit `d6cab489` is on main, and Softov reviewed tasks 01 and 02 on 2026-10-19. The plan is built; [implemented.md](implemented.md) says what exists.
- **Next action:** none in this plan. A release waits for Softov's call.
- **Open questions:** none.
- **Watch out for:** the manifest also takes `null` for `from`, `until`, `limits` and the lists under `match`. The check already read `null` for them, and a form must not refuse a body the host accepts.

## Final verification checklist

- [x] A put with `pool: null` or `cap: null` removes the field, and a read shows no such field.
- [x] `PolicyLimits` imports from `@ahpd/sdk`.
- [x] The gates pass.
- [ ] `plans/index.md` updated.
