---
title: A watched changeset gets its files when a turn ends
domain: host
status: active
priority: high
created: 2026-10-13
revalidated: 2026-10-13
refs:
  - "[code://packages/sdk/src/host/facts.ts#L505-L530](../../../../packages/sdk/src/host/facts.ts#L505-L530) - `readFacts`, which re-reads git at the end of a turn and tells the session row, but never the changeset channel"
  - "[code://packages/sdk/src/host/facts.ts#L325-L361](../../../../packages/sdk/src/host/facts.ts#L325-L361) - `refreshWatched`, which re-reads git and calls `contentMoved` for each session in `toldIn`"
  - "[code://packages/sdk/src/host/facts.ts#L263-L274](../../../../packages/sdk/src/host/facts.ts#L263-L274) - `toldIn`, the sessions a move of a directory's changesets is told to"
  - "[code://packages/sdk/src/host/changesets.ts#L554-L590](../../../../packages/sdk/src/host/changesets.ts#L554-L590) - `contentMoved`, which sends `fileSet`, `fileRemoved`, `cleared` or `contentChanged` on each watched changeset channel"
  - "[code://packages/sdk/src/host/spawn.ts#L926-L942](../../../../packages/sdk/src/host/spawn.ts#L926-L942) - the end of a turn: `refreshFacts`, or `bringBackOf` then `refreshFacts` in a machine, and `operationsMoved`"
  - "[code://packages/sdk/src/host/spawn.ts#L776-L779](../../../../packages/sdk/src/host/spawn.ts#L776-L779) - a tool call that completes mid-turn calls `refreshWatched`, which does push the files"
  - "[code://packages/sdk/test/changes-refresh.test.ts#L363-L383](../../../../packages/sdk/test/changes-refresh.test.ts#L363-L383) - the mid-turn case, the pattern for the new test"
  - git://32bbe1b8cba - VS Code `src/vs/platform/agentHost/node/agentHostChangesetService.ts:1457-1484`: `onTurnComplete` recomputes every subscribed changeset, and the recompute dispatches `ChangesetContentChanged` at :2099
---

## Goal

A client that watches a changeset sees the files a turn changed when the turn ends, without a refresh by hand.
Today the session row shows the new counts, but the Changes pane keeps its last list until the person presses its own refresh.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "'changeset/(fileSet|fileRemoved|contentChanged)'" packages/sdk/src` - only `told` in `changesets.ts` sends them, through `contentMoved`.
- `rg "refreshWatched\(|readFacts\(|refreshFacts\(" packages/sdk/src` - a tool call, a client write and a terminal call `refreshWatched`; the end of a turn, a resource method and the catalogue call `readFacts`.

### Runtime path

```
chat/turnComplete -> spawn.ts refreshFacts -> facts.ts readFacts -> changes.refresh -> session/changesetsChanged + summary -> (missing) contentMoved -> changeset channel
```

### Gaps

- `readFacts` re-reads git and tells the session row, but sends nothing on a watched changeset channel.
- `readFacts` takes the move: `changes.refresh` then answers `false` to the watcher's `refreshWatched`, so that path pushes nothing either.
- No test ends a turn with a changeset channel watched.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| When a turn ends, each watched changeset of the sessions in that directory gets its new files on its own channel | VS Code `agentHostChangesetService.ts:1457-1484`, `onTurnComplete`; Softov, 2026-10-13, "ok write the plan" | 01 |
| `readFacts` pushes the files the same way `refreshWatched` does, with `contentMoved` for each session in `toldIn`, so every caller of `readFacts` gets the fix | (defaulted: one place re-reads git and tells everyone, as `refreshWatched` already does) | 01 |

## Proposed architecture

- **Data flow** - `readFacts` keeps its `changes.refresh` and its `session/changesetsChanged`; when the files moved, it also calls `contentMoved` for each session in `toldIn(dir)`.
- **Event flow** - the end of a turn now sends `changeset/fileSet`, `fileRemoved`, `cleared` or `contentChanged` on each watched changeset channel, after `operationsChanged`.
- **Layer responsibilities** - sdk: `facts.ts` only. No change to the protocol, a backend or a client.
- **Source-of-truth files** - [`code://packages/sdk/src/host/facts.ts`](../../../../packages/sdk/src/host/facts.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A turn's end pushes the files of a watched changeset](task-01-a-turns-end-pushes-the-files.md) | implemented | - |

## Risks and tradeoffs

- `contentMoved` runs `changes.state` for each watched channel, which is `git status` and `git diff` - it runs only where a client watches, as in `refreshWatched`.
- `readFacts` and `refreshWatched` can run at the same time for one directory. `told` compares with what each channel got last, so a second push of the same files sends only `operationsChanged`.

## Resume state

- **Done so far:** [task-01-a-turns-end-pushes-the-files.md](task-01-a-turns-end-pushes-the-files.md) implemented - `readFacts` pushes the files of every watched changeset, with three cases in `changes-refresh.test.ts`. Uncommitted, awaiting review.
- **Next action:** the check by hand: in ahpw or VS Code, the Changes pane shows a turn's files when the turn ends.
- **Open questions:** none.
- **Watch out for:** `readFacts` also runs when a session is subscribed (`snapshots.ts`) and for the catalogue (`catalogue.ts`). A push there is right too, because a watched channel holds an old list.

## Final verification checklist

- [ ] A turn that writes a file ends with the new file on the watched changeset channel.
- [ ] A session in a machine gets the same push after `bringBackOf`.
- [ ] `plans/index.md` updated.
