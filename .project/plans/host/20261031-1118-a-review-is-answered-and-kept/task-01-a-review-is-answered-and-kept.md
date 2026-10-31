---
title: A review is answered, and kept as the protocol's reducer applies it
status: done
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host/actions.ts#L494-L512](../../../../packages/sdk/src/host/actions.ts#L494-L512) - a client's review"
  - "[code://packages/sdk/src/sessions/changes.ts#L1658-L1676](../../../../packages/sdk/src/sessions/changes.ts#L1658-L1676) - `review`"
---

## Objective

Every review a client sends is answered, and what it ticks is kept as the protocol's reducer applies it: a review that moves nothing answered to its sender alone, a changeset that keeps no review refused, only the files the changeset holds ticked, a turn's tick read back, and a branch row's tick reset by an edit.

## Files

- `UPDATE: packages/sdk/src/types/changes.ts:435-443` - `review` answers whether a tick moved, or the sentence that says why the scope keeps none.
- `UPDATE: packages/sdk/src/sessions/changes.ts:1658-1676` - the working tree's scope answered with its sentence, and a turn's ticks kept under the turn's id.
- `UPDATE: packages/sdk/src/sessions/changes.ts:1492-1507` - the branch's ticks reset by an edit, with the session's and the turn's.
- `UPDATE: packages/sdk/src/host/actions.ts:494-512` - the changeset the channel names, the files it holds, and the answer: refused, `echoTo`, or said to every watcher and recorded in `shown`.
- `UPDATE: docs/sdk/AHP.md` - the `changeset/filesReviewChanged` row, and a review under "An action that changes nothing is not a change".
- `UPDATE: docs/sdk/BUILD-A-HOST.md:127` - `review`'s answer.
- `CREATE: packages/sdk/test/changes-review.test.ts` - the source's answers on each scope, and the host's answers to two clients.

## Steps

1. Write the cases and run them on `497bbfa5` to see a review that moves nothing unanswered, a source with no `review` and the working tree's changeset unrefused, absent ids ticked and said to everyone, a turn's tick lost at the next read, a branch row's tick kept through an edit, and a reviewed file said again by the next change.
2. Have `review` answer for a scope that keeps no review, keep a turn's ticks under the turn's id, and reset the branch's ticks on an edit.
3. Answer the client in the handler, from the files the changeset holds, and record the review in `shown`.
4. Bring AHP.md and BUILD-A-HOST.md to what the host does.

## Validation

- The new cases fail on `497bbfa5` and pass after the change.
- `changes-review`, `changes-refresh`, `changes-branch`, `changes-uris`, `users-gate-sessions`, `users-gate-dispatch`, `operations` and `conformance` pass.
- `pnpm run typecheck` and `pnpm run boundary` report no errors.

## Resume

Done 2026-10-31.
Every step is built, and the touched suites, the type check and the boundary check pass.
