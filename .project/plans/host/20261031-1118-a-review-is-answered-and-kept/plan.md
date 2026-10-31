---
title: A review is answered, and kept as the protocol's reducer applies it
domain: host
status: built
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
refs:
  - git://497bbfa5 - the commit of ahpd this plan was checked at
  - "[code://packages/sdk/src/host/actions.ts#L494-L512](../../../../packages/sdk/src/host/actions.ts#L494-L512) - a client's review, said to everyone when the source says a tick moved and answered with nothing otherwise"
  - "[code://packages/sdk/src/sessions/changes.ts#L1658-L1676](../../../../packages/sdk/src/sessions/changes.ts#L1658-L1676) - `review`, which ticks every id it is handed under the scope as the URI spells it"
  - "[code://packages/sdk/src/sessions/changes.ts#L645-L686](../../../../packages/sdk/src/sessions/changes.ts#L645-L686) - `withTicks` and `rowsOf`, which read a turn's ticks under the turn's id"
  - "[code://packages/sdk/src/sessions/changes.ts#L1492-L1507](../../../../packages/sdk/src/sessions/changes.ts#L1492-L1507) - the reset on an edit, of the turn's and the session's ticks"
  - "[code://packages/sdk/src/sessions/changes.ts#L1368-L1378](../../../../packages/sdk/src/sessions/changes.ts#L1368-L1378) - the working tree's scope, offered without `reviewable`"
  - "[code://packages/sdk/src/types/changes.ts#L435-L443](../../../../packages/sdk/src/types/changes.ts#L435-L443) - `ChangesetSource.review`"
  - "[code://packages/sdk/src/host/changesets.ts#L500-L507](../../../../packages/sdk/src/host/changesets.ts#L500-L507) - `shown`, what every client watching a changeset was last told it holds"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/changesets.md - File Review: the capability, the reducer that ignores ids matching no current file, and the reset the server makes"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30 - a client holds its action until an envelope with its own origin, or a rejection, answers it"
  - "https://github.com/microsoft/vscode/blob/97d01924531421f671b69342f629ba0f9f0f1e2e/src/vs/platform/agentHost/common/state/protocol/channels-changeset/reducer.ts - the reducer: a listed file present in the changeset takes the flag, and nothing else moves"
  - "https://github.com/microsoft/vscode/blob/97d01924531421f671b69342f629ba0f9f0f1e2e/src/vs/platform/agentHost/test/node/e2e/suites/changesetSuite.ts - the reference's conformance case reads a tick back from a fresh snapshot"
---

## Goal

Every review a client sends is answered, and what it ticks is kept as the protocol's reducer applies it.
A review that moves nothing is answered to its sender alone, and one on a changeset that keeps no review is refused.
Only files the changeset holds take the flag, a tick on a turn's changeset is read back, and a branch row's tick goes when a turn changes the file again.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "filesReviewChanged" packages` - one handler, in `actions.ts`, and one gate test that sends a review.
- `rg "review" packages/*/src` - one implementation of `ChangesetSource.review`, in `sessions/changes.ts`.
- `rg "reviewKey|withTicks|rowsOf" packages/sdk/src/sessions/changes.ts` - a tick is written under the scope the host passes and read under the key each scope's rows are built with.
- `git log -S"[turnId, 'session']"` - the reset on an edit came with review (ed8b2556), before the branch's scope (06596413) had ticks.

### Gaps

- A review that moves nothing is answered with nothing, so its sender holds it as pending.
- A review on a changeset whose source keeps no review is dropped in silence.
- A review on the working tree's changeset, offered without the review capability, is ticked and said to every client, while the working tree's rows never show a tick.
- Ids the changeset does not hold are ticked: a review naming only them is said to every client, and a file that later comes into the changeset under one of them shows as reviewed.
- A tick on a turn's changeset is kept under `turn/<id>`, while the turn's rows read and reset ticks under the turn's id, so the tick is gone at the next read.
- A tick on the branch's changeset stands when a turn changes the file again, while the session's and the turn's are reset.
- What the host records each watcher holds keeps the files as they were before a review, so the next change says every reviewed file again as moved.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A review that moves nothing is answered with `echoTo`, to its sender alone, which keeps the source's reason that a client ticking a file already ticked does not make every other client redraw | reconciliation; [code://packages/sdk/src/sessions/changes.ts#L1658-L1665](../../../../packages/sdk/src/sessions/changes.ts#L1658-L1665) | 01 |
| A changeset that keeps no review is refused: a source with no `review`, and a scope offered without `reviewable` | changesets.md: "When the capability is absent, the changeset is not reviewable"; the working tree's own reason, a tick "is bookkeeping about a thing that has moved" | 01 |
| `review` answers whether a tick moved, or the sentence that says why the scope keeps none | `Terminal.write` and `Session.setConfig` answer `true` or a sentence | 01 |
| A review ticks only the files the changeset holds, which are the files its watchers were last told, or the files a read finds when it has none | changesets.md: "Ids that don't match a current file are ignored; the action is a no-op when none match"; `shown` | 01 |
| A turn's tick is kept under the key the turn's rows are read and reset under | the reference's conformance case, which reads `reviewed` back from a fresh snapshot | 01 |
| A branch row's tick is reset by an edit, as the session's and the turn's are | the reset's own reason, "A file that has changed again is not the file that was reviewed"; changesets.md: the server resets review | 01 |
| What every watcher holds is recorded with the review it was told | `shown`: "What every client watching a changeset was last told it holds" | 01 |

## Proposed architecture

- **Event flow** - a review names a changeset (refused when none answers) and the files it holds take the flag through the source's `review`: a sentence is refused, `false` is answered with `echoTo`, and `true` goes to every watcher with the files that moved, recorded in `shown`.
- **Layer responsibilities** - `ChangesetSource.review`: which scopes keep a review, and where each keeps it; actions: which files the changeset holds, and the answer.
- **Source-of-truth files** - [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts), [`code://packages/sdk/src/sessions/changes.ts`](../../../../packages/sdk/src/sessions/changes.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A review is answered, and kept as the protocol's reducer applies it](task-01-a-review-is-answered-and-kept.md) | done | - |

## Risks and tradeoffs

- A review on a changeset nobody has subscribed to reads its state to learn which files it holds, which for the branch's scope is a `git diff`.

## Resume state

- **Done so far:** planned and built 2026-10-31. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** none.

## Final verification checklist

- [x] Each new case fails on `497bbfa5` for the reason it names, and passes after the change.
- [x] The touched suites pass.
- [x] `pnpm run typecheck` and `pnpm run boundary` report no errors.
