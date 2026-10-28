---
title: A conversation the CLI never wrote starts under its id - implemented
date: 2026-10-28
refs:
  - "[code://packages/agent-claude/src/catalog.ts](../../../../packages/agent-claude/src/catalog.ts)"
  - "[code://packages/agent-claude/src/claude.ts](../../../../packages/agent-claude/src/claude.ts)"
  - "[code://packages/agent-claude/test/agent-claude-resume.test.ts](../../../../packages/agent-claude/test/agent-claude-resume.test.ts)"
---

A Claude session that the host resumes picks up a conversation only when the CLI wrote one under that id.
Any other id names the new conversation, so the chat starts instead of failing at startup.

## What was built

- [`code://packages/agent-claude/src/catalog.ts`](../../../../packages/agent-claude/src/catalog.ts) - `written(id, folder)`: the folder's own project first, then every project under the projects folder.
  `hasTranscript` and `written` share one file-name guard and one read of a transcript's size.
- [`code://packages/agent-claude/src/claude.ts`](../../../../packages/agent-claude/src/claude.ts) - `create` reads `written` once for the host's `resume`.
  It passes `resume`, `forkAt` and `rewindAt` only for a written conversation, and otherwise names the new one by the chat's id or the asked id.

## Verified

- `packages/agent-claude/test/agent-claude-resume.test.ts`: five cases over a temporary `CLAUDE_CONFIG_DIR`.
  The three for an id with no transcript fail on the code before this plan, and pass now.
  The two for a written conversation, under the folder's own project and under another one, pass on both.
- The sdk suite drives Claude through a fake SDK, which keeps the CLI's conversations in a `CLAUDE_CONFIG_DIR` of its own.
  Five of its cases resume a conversation: the catalogue's, a name's, a rewind, a fork and a directory added.
  Each now says that the CLI wrote the conversation, and each fails without that line.
- The agent-claude suite passes, 372 cases, and so does the sdk suite at one worker.
  Boundary, typecheck, build and schema pass.

## Departures from the plan

- A session in a machine is resumed as the host asks, because the CLI's files are in the machine and not on this host.
- The sdk suite's fake SDK gained `wrote(id, cwd)` and a configuration folder of its own, for the five cases above.

## Left for later

- None.
