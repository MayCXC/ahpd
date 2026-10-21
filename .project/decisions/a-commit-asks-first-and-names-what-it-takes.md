---
title: The commit operation asks first, naming what it takes, and commits the index when anything is staged
status: accepted
date: 2026-09-27
refs:
  - "[code://packages/sdk/src/sessions/changes.ts#L121-L129](../../packages/sdk/src/sessions/changes.ts#L121-L129) - `COMMIT`, declared with no `confirmation`"
  - file:///github/externals/vscode - `src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionChangesets.ts` shows an operation's `confirmation` before invoking it; `src/vs/platform/agentHost/node/agentHostCommitOperationProvider.ts` declares the reference host's `commit` with none
  - file:///github/externals/agent-host-protocol/types/channels-changeset/state.ts - `ChangesetOperation.confirmation`: the client MUST show it and invoke only after the user accepts
  - file:///github/externals/vscode - `src/vs/platform/agentHost/node/agentHostGitService.ts` `commitAll`: the reference host always runs `git add -A -- :/` before committing
  - "git://611c90b5 - the merged decision: the commit operation commits the index when anything is staged, and everything when nothing is"
---

## Context

The `commit` operation on an `uncommitted` changeset commits on one click in VS Code, as the reference host's does.
The reference host writes the message with Copilot from the diff; this host commits under the session title, or "Changes from an agent session", and the session's directory can hold work that is not the session's.
On 2026-09-27 one click committed another session's uncommitted files under "Changes from an agent session".

The reference host's `commit` stages the whole working tree with `add -A` and commits it, whatever the index held.
VS Code's session view has no staging: it lists one changeset per kind and never reads a staging mark on a file.
VS Code's own Source Control view does stage and unstage files in git's index, so a person can stage by hand first.

## Decision

`commit` carries a `confirmation` that names the subject line it will use and the files it will take, counting the untracked ones, for example "Commit 4 files, 1 untracked, as 'Changes from an agent session'?".
It runs `git commit` on the index as it is when the index holds any change.
When the index holds none, it stages everything with `add -A`, untracked files included, and commits it all.
Its confirmation says which of the two it will do, beside the subject line and the files it will take.
When the changeset's files, the index or the session title change, the operation is re-declared so the sentence stays true.

Source: Softov, 2026-09-27, asked "ahpd's Commit ran on one click. Should it ask first, through the operation's confirmation (VS Code shows it)?": "Ask, naming what".
Asked "What should ahpd's Commit take when you have already staged something (in VS Code's Source Control)?": "Staged if any".

## Consequences

A commit is a deliberate act in every client that honours `confirmation`, which the protocol requires.
The protocol reads a `confirmation` as marking a destructive operation, so VS Code styles the button as a warning.
The operation list changes whenever the changeset or the index does, which is more `changeset/operationsChanged` traffic.
A person stages in VS Code's Source Control and commits from the session.
Exactly what they staged is committed.
With nothing staged the operation behaves as the reference host's.
A client that sends a file selection in `_meta` has nothing to select with: staging is the selection.

## Options

- **A fixed sentence** ("Commit every change in this directory, untracked files included?"): no re-declaring, but it does not say what is about to happen.
- **No confirmation, as the reference host**: parity, and the click that committed another session's work stays one click.
- **Always everything, as the reference host**: parity, but what a person staged by hand is swept in with the rest.
