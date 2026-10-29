---
title: A transcript with no message starts under its id - implemented
date: 2026-10-29
refs:
  - git://3dac04a5 - the change
  - "[code://packages/agent-claude/src/catalog.ts#L140-L168](../../../../packages/agent-claude/src/catalog.ts#L140-L168) - the SDK's test of a transcript that holds a conversation"
  - "[code://packages/agent-claude/src/catalog.ts#L202-L207](../../../../packages/agent-claude/src/catalog.ts#L202-L207) - `clearFor`"
  - "[code://packages/agent-claude/src/session/query.ts#L212-L216](../../../../packages/agent-claude/src/session/query.ts#L212-L216) - `namedUnder` clears the transcript first"
---

A Claude session that the host resumes picks up a conversation only when its transcript holds an entry of one.
Any other id names a new conversation on a clean transcript, so the CLI takes the id.

## What was built

- [`code://packages/agent-claude/src/catalog.ts`](../../../../packages/agent-claude/src/catalog.ts) - `conversation(file)`, the SDK's test, read as the SDK reads it.
  `written` reads each transcript with it.
  `clearFor(id, folder)` deletes a transcript with no entry from the folder's project.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - `namedUnder` calls `clearFor` for a session that is not in a machine.
- [`code://packages/agent-claude/test/agent-claude-resume.test.ts`](../../../../packages/agent-claude/test/agent-claude-resume.test.ts) - three cases over the lines a CLI 2.1.301 left on a daemon.
  The helpers that write a conversation write the CLI's own first entry.
- [`code://packages/sdk/test/support/claude-sdk.ts`](../../../../packages/sdk/test/support/claude-sdk.ts) - `wrote` writes the CLI's own first entry.

## Verified

- On the code before the change, the case that resumes the transcript fails with `resume` in the options.
  The case that starts a session under its id fails with the transcript still there.
  The case that keeps a written conversation passes.
- After the change, `agent-claude-resume.test.ts` passes, 8 of 8, and `agent-claude-read-ends.test.ts` passes, 4 of 4.
- The sdk files that call `wrote` pass, 220 cases in six files.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
