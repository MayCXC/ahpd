---
title: A session's changes are kept under two keys
status: open
date: 2026-10-19
severity: major
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L578-L582](../../packages/sdk/src/host/spawn.ts#L578-L582) - `checkpointOf` writes the checkpoints under `idOf(uri)`"
  - "[code://packages/sdk/src/host/spawn.ts#L1437-L1441](../../packages/sdk/src/host/spawn.ts#L1437-L1441) - `onFileEdit` hands `observe` the channel URI"
  - "[code://packages/sdk/src/changes.ts#L1477-L1482](../../packages/sdk/src/changes.ts#L1477-L1482) - `observe` keys the edit tracker `seen` by the session it is given"
  - "[code://packages/sdk/src/changes.ts#L622-L624](../../packages/sdk/src/changes.ts#L622-L624) - `across`, the tracker's files of one key"
  - "[code://packages/sdk/src/changes.ts#L747-L767](../../packages/sdk/src/changes.ts#L747-L767) - `inCheckpoints` and `sessionFiles`, which read both under one key"
  - "[code://packages/sdk/src/changes.ts#L1445-L1448](../../packages/sdk/src/changes.ts#L1445-L1448) - `state` for the `session` scope calls `sessionFiles` with the key it gets"
  - "[code://packages/sdk/src/changes.ts#L1580](../../packages/sdk/src/changes.ts#L1580) - `sessionSummary` calls `sessionFiles` with the key it gets"
  - "[code://packages/sdk/src/host/changesets.ts#L114-L121](../../packages/sdk/src/host/changesets.ts#L114-L121) - `changesetAt` names the channel URI as `owner`"
  - "[code://packages/sdk/src/host/changesets.ts#L591](../../packages/sdk/src/host/changesets.ts#L591) - `state` gets `at.owner`, the URI"
  - "[code://packages/sdk/src/host/snapshots.ts#L195](../../packages/sdk/src/host/snapshots.ts#L195) - the snapshot of a changeset gets `at.owner` too"
  - "[code://packages/sdk/src/host/catalogue.ts#L653-L657](../../packages/sdk/src/host/catalogue.ts#L653-L657) - `summaryKept` calls `sessionSummary` with `idOf(uri)`"
  - "[code://packages/sdk/src/checkpoints.ts#L48-L56](../../packages/sdk/src/checkpoints.ts#L48-L56) - a checkpoint ref is `refs/agents/<key>/checkpoints/`"
  - git://06596413 - host/103, which added the checkpoints and `sessionSummary`
---

## Symptom

A session's `session` changeset never shows a file that only a checkpoint holds, such as a file a shell command wrote.
A row's counts never use the edit tracker, so a session in a folder that is not a git repository has no counts.
Found in host/103 task 04, and confirmed in the code 2026-10-19.

## Cause

`changes.ts` keeps the two sources of a session's changes under two different keys.
The checkpoints are git refs under the session id, because `checkpointOf` and `removeCheckpoints` get `idOf(uri)`.
The edit tracker `seen` is keyed by the channel URI, because `onFileEdit` hands `observe` the URI.
`sessionFiles(dir, session)` reads the checkpoints and the tracker under the one key it gets.
`state` gets the URI from `changesetAt`, so `inCheckpoints` finds no ref and only the tracker answers.
`sessionSummary` gets the id from `summaryKept`, so `across` finds no tracker entry and only the checkpoints answer.
No task in host/103 says which spelling is canonical.

## Impact

The "This Session" changeset of a live session shows only the files the agent's tools wrote.
A row's counts in a folder with no git are empty, but the plan's risk note says the tracker answers there.
The row and the changeset of one session can show different files.
This blocks the host/103 check that a file a shell command wrote is counted in the changeset.

## Workaround

none.

## Fix

- Key `observe` and `state` by `idOf(uri)`, as the checkpoints are.
- Or key every call by the URI, and let `checkpoints.ts` make the ref name from it.
- Or make `sessionFiles` take both keys, and read the checkpoints under the id and the tracker under the URI.
