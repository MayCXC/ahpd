---
title: A review is answered, and kept as the protocol's reducer applies it - implemented
date: 2026-10-31
refs:
  - "[code://packages/sdk/src/host/actions.ts#L494-L554](../../../../packages/sdk/src/host/actions.ts#L494-L554) - a client's review, answered"
  - "[code://packages/sdk/src/sessions/changes.ts#L1658-L1680](../../../../packages/sdk/src/sessions/changes.ts#L1658-L1680) - `review`, which scopes keep a review and where"
  - "[code://packages/sdk/src/types/changes.ts#L435-L445](../../../../packages/sdk/src/types/changes.ts#L435-L445) - `ChangesetSource.review`"
---

Every review a client sends is answered, and what it ticks is kept as the protocol's reducer applies it.
A review that moves nothing is answered to its sender alone, one on a changeset that keeps no review is refused, and only the files the changeset holds take the flag.
A tick on a turn's changeset is read back, a branch row's tick goes when a turn changes the file again, and what the host records each watcher holds follows the review.

## What was built

- [`code://packages/sdk/src/types/changes.ts#L435-L445`](../../../../packages/sdk/src/types/changes.ts#L435-L445) - `review` is handed the files the changeset holds, and answers whether a tick moved, or the sentence that says why the scope keeps no review.
- [`code://packages/sdk/src/sessions/changes.ts#L1658-L1680`](../../../../packages/sdk/src/sessions/changes.ts#L1658-L1680) - the working tree's scope answers with its sentence, and a turn's ticks are kept under the turn's id, which its rows are read and reset under.
- [`code://packages/sdk/src/sessions/changes.ts#L1493-L1507`](../../../../packages/sdk/src/sessions/changes.ts#L1493-L1507) - an edit a turn makes takes the tick off the file's branch row, as it does off the session's and the turn's.
- [`code://packages/sdk/src/host/actions.ts#L494-L554`](../../../../packages/sdk/src/host/actions.ts#L494-L554) - the changeset the channel names, by `changesetAt`; the files it holds, from `shown` or a read of its state; a source with no `review`, no changeset and a sentence refused; no move answered with `echoTo`; a move said to every watcher with the files it holds and this client's origin, and recorded in `shown` as the next read gives it.
- [`code://docs/sdk/AHP.md#L341`](../../../../docs/sdk/AHP.md#L341), the `changeset/filesReviewChanged` row, and [`code://docs/sdk/AHP.md#L757-L759`](../../../../docs/sdk/AHP.md#L757-L759) under "An action that changes nothing is not a change".
- [`code://docs/sdk/BUILD-A-HOST.md#L127`](../../../../docs/sdk/BUILD-A-HOST.md#L127) and [`#L144-L146`](../../../../docs/sdk/BUILD-A-HOST.md#L144-L146) - `review`'s answer.
- `changes-review.test.ts`: three cases on the git source (a turn's tick read back, a branch row's tick taken off by an edit, the working tree refused in its words) and five on the host with two clients (a tick on a file already ticked answered to its sender alone, a source with no `review` refused, a source's sentence refused in its words, only held files ticked with a review of none answered to its sender alone, and a later change saying only the file that changed after a tick and after a clear).

## Verified

- On `497bbfa5` the eight cases fail for the reasons they name: a turn's tick is gone at the next read, a branch row's tick stands through an edit, the working tree is ticked, a review that moves nothing and one on a source with no `review` or a sentence are answered with nothing, a file the changeset does not hold is ticked and said to every client, and a reviewed file is said again by the next change.
- After the change, `changes-review`, `changes-refresh`, `changes-branch`, `changes-uris`, `users-gate-sessions`, `users-gate-dispatch`, `operations` and `conformance` pass with 151 tests, and `ahp-test-cases` with 647.
- The round's full run, with the machine's I/O waiting on a nearly full disk: `test:unit` 13 failed and `test:processes` 475 failed, every one a timeout or a process killed or unannounced at one. Run one file at a time, the process suite passes 689 tests with 30 skipped and six timeouts in two files; those two files and the eight unit files that timed out again pass when rerun, 220 tests with one timeout whose file passes alone (25).
- `pnpm run typecheck` and `pnpm run boundary` pass.

## Departures from the plan

- none.

## Left for later

- none.
