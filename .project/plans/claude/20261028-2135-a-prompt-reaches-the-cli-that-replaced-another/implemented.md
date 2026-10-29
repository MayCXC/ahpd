---
title: A prompt sent while a new Claude CLI starts reaches that CLI - implemented
date: 2026-10-28
refs:
  - git://f7707b2f
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts)"
---

A turn that starts on a new Claude CLI sends its prompt to that CLI, however late the SDK starts reading the new CLI's input.
The reader of the CLI it replaced takes nothing more and ends.

## What was built

- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - `bound`, the number of the query that reads `waiting`.
  `input` takes the number of its query, reads only while that query is the current one, and ends otherwise.
  `startQuery` counts each new query, wakes the replaced reader so it ends, and clears `wake`.
- [`code://packages/agent-claude/test/agent-claude-prompt-after-restart.test.ts`](../../../../packages/agent-claude/test/agent-claude-prompt-after-restart.test.ts) - two cases over a fake SDK that reads a later query's input only when the test says, and drops what a closed query's reader is handed.

## Verified

- `agent-claude-prompt-after-restart.test.ts`: both cases failed on the code before the task, and pass.
- The agent-claude cases that read a query's prompt or replace a CLI pass: agent pick, presets, logins, subagents, attachments, recorded turns, refusals, resume, close and cancel.
- agent-claude 428 passed, sdk 3683 passed and 2 skipped, server 1632 passed and 2 skipped, at one worker, once, with the plan that makes a turn wait for its tools beside this one.
- Typecheck, boundary, the build of every package and the schema are clean.

## Departures from the plan

- None.

## Left for later

- None.
