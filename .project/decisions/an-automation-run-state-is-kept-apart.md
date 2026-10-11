---
title: An automation's run state is kept apart from its file
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/sdk/src/scheduled.ts#L36-L60](../../packages/sdk/src/scheduled.ts#L36-L60) - `Saved`, which holds `runCount` and `nextRunAt` beside the definition"
---

## Context

An automation has fields a person writes, such as its title, message and triggers.
It also has fields the daemon changes on each run: `runCount`, `nextRunAt`, `modifiedAt`.
If both are in one file, each scheduled run rewrites the file a person edits.

## Decision

An automation file holds only what a person writes, and its identity.
The run state of every automation is in one file of the daemon's own, `<configDir>/automations-state.json`.

Source: Softov, 2026-10-10, to "An automation file also carries daemon state that changes on every run (nextRunAt, runCount, modifiedAt). Where should that go?" - "Separate state file".

## Consequences

A run does not change the file a person edits.
A copied automation file carries no run state, so it starts with none used.
A state row whose automation file is gone is removed at the next write.

## Options

- **The run state in the frontmatter.** Rejected: each run rewrites the file a person edits.
