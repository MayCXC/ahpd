---
title: A turn's end pushes the files of a watched changeset
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/facts.ts#L505-L530](../../../../packages/sdk/src/host/facts.ts#L505-L530) - `readFacts`, where the push is added"
  - "[code://packages/sdk/src/host/facts.ts#L348-L359](../../../../packages/sdk/src/host/facts.ts#L348-L359) - the loop in `refreshWatched` to copy"
  - "[code://packages/sdk/test/changes-refresh.test.ts#L363-L383](../../../../packages/sdk/test/changes-refresh.test.ts#L363-L383) - the mid-turn case, the pattern for the new cases"
---

## Objective

When `readFacts` finds that the files moved, each watched changeset of the sessions in that directory gets the new files on its own channel.
The end of a turn is the main caller, so a watched Changes pane shows a turn's files when the turn ends.

## Files

- `UPDATE: packages/sdk/src/host/facts.ts:505-530` - `readFacts` calls `contentMoved` for each session in `toldIn(dir)` when `changes.refresh` answers that the files moved.
- `UPDATE: packages/sdk/test/changes-refresh.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* rows.
2. In `readFacts`, keep the `session/changesetsChanged` and `summaryMoved` loop over `inThere(dir)` as it is.
3. After that loop, call `await contentMoved(uri)` for each session in `toldIn(dir)`, as `refreshWatched` does.
4. Catch a failure of `contentMoved` so that `readFacts` still answers `true`, as `refreshWatched` ends its loop on a failure.
5. Remove the comment in `readFacts` that says a watching client re-reads the changeset from its own channel.
6. Add the test cases below, from the mid-turn case in `changes-refresh.test.ts`.

## Validation

- `changes-refresh.test.ts`: a turn writes a file and completes, and the watched channel gets the new file.
- `changes-refresh.test.ts`: the turn's end sends the new file even when no tool call completed in the turn.
- `changes-refresh.test.ts`: a turn's end with no watched changeset runs no `changes.state`.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.
- By hand: in ahpw or VS Code, the Changes pane shows a turn's files when the turn ends.

## Resume

Done 2026-10-13, reviewed and checked by hand by Softov, commit `8831b833`. `readFacts` now pushes the files of every watched changeset, so the end of a turn reaches a Changes pane without a refresh by hand.

### What changed, file by file

- `packages/sdk/src/host/facts.ts` - `readFacts` keeps its `changes.refresh` and its `session/changesetsChanged` + `summaryMoved` loop over `inThere(dir)` unchanged (step 2), and after it, when the files moved, awaits `contentMoved(uri)` for each session in `toldIn(dir)` (step 3) - the same loop `refreshWatched` runs, from the same place, so every caller of `readFacts` gets the fix and not only the turn's end. The loop is wrapped in its own `try`/`catch` (step 4) for the reason `refreshWatched` gives: a directory removed while the read ran fails the reads that describe it, and the facts are still the facts, so a failure there leaves `readFacts` answering `true` as it does for a failed `changes.refresh`. The block comment above `files` said the opposite of what the code now does - that a watching client "re-reads it from its own channel" and that sending the files here "would be the same answer from two places" - and is replaced by one that says what the two sends are for (step 5).
- `packages/sdk/test/changes-refresh.test.ts` - three cases after the mid-turn one (step 6), plus `endable()` (an echo backend whose emitter the test holds, which the two turn cases share), `actionsOf()` (every action the peer was sent, whichever channel) and `carriedFiles()`. Both turn cases use `counting()`, whose watch never fires, so no `fs.watch` event can be what pushes the file.

### The three cases

- *pushes the files of a watched changeset when a turn ends* - a tool call that wrote nothing completes and its own mid-turn re-read settles first, then the file is written and `chat/turnComplete` is emitted: the turn's end is the only thing left that can push it, and the channel gets `from-turn.txt`.
- *pushes a turn's files when no tool call completed in the turn* - the file is written and the turn ends with `chat/turnComplete` alone; the channel gets the file, and no `chat/toolCallComplete` was sent at all.
- *runs no changeset read when a turn ends with no watched changeset* - the session is subscribed and no changeset is, the source's `refresh` always says the files moved and its `state` is counted: a turn's end moves the list and reads no changeset, so `changes.state` is not called at all.

All three were run against the unfixed `readFacts` first: the two turn cases fail with `the change never arrived`, and the third passes either way, which is what it is for.

### Where the plan and the code agree

- Every step matched the code as written, including the two line ranges in the refs (`readFacts` at the old :505-530, the `refreshWatched` loop at :348-359, the mid-turn case at :363). Nothing had to be guessed.

### Seen, and not this task's

- `readFacts` also runs on a session's first subscribe (`snapshots.ts`) and for the catalogue (`catalogue.ts`). Both now push the files too. That is the plan's own note under *Watch out for* and is the point of putting the change in `readFacts` rather than at the turn's end.
- `contentMoved` runs `changes.state` once per watched channel, which is `git status` and `git diff`. It runs only where a connection watches a changeset of a session in that directory, which is what keeps the untriggered case free - the third case above is the guard.

### Validation

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` all exit 0. The schema is byte-identical (508 definitions from 506 exported types) and is not in the diff.
- vitest, `--maxWorkers=2 --testTimeout=15000`, over the four packages in one run: 4341 passed in 241 files. `changes-refresh.test.ts` is 32 of them, three new.
- VS Code's `agentHostChangesetService.ts:1457-1484` is the same shape: `onTurnComplete` recomputes the uncommitted changeset when `_hasSubscription` says a client watches it. That recompute dispatches `ChangesetContentChanged` at :2099, and here `contentMoved` is where it lands.

### Left

- By hand: in ahpw or VS Code, the Changes pane shows a turn's files when the turn ends. Not done here.
- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by this run - 33 lines, the known endpoint-and-`_meta` churn, none of it this task's. The restore command is denied in this session: it needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` from somebody who can run one.
- Nothing is committed. This task's own files are the two above.

