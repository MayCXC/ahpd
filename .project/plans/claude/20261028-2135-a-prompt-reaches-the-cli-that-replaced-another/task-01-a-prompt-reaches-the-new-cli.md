---
title: A prompt sent while a new CLI starts reaches that CLI
status: planned
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L210-L229](../../../../packages/agent-claude/src/session/query.ts#L210-L229) - `input`, the reader each query is handed"
  - "[code://packages/agent-claude/src/session/query.ts#L567-L570](../../../../packages/agent-claude/src/session/query.ts#L567-L570) - `startQuery`"
---

## Objective

A turn that starts on a new CLI sends its prompt to that CLI, however late the SDK starts reading the new CLI's input.
The reader of the CLI it replaced takes nothing and ends.

## Files

- `UPDATE: packages/agent-claude/src/session/query.ts` - `bound`, the number of the query that reads `waiting`; `input` takes the number of its query and reads only while it is current; `startQuery` counts the new query, wakes the replaced reader and clears `wake`.
- `CREATE: packages/agent-claude/test/agent-claude-prompt-after-restart.test.ts` - a fake SDK that reads the first query's input at once and a later query's only when the test says, and drops what a closed query's reader is handed.
- `UPDATE: .project/specs/agent-backends.md` - a scenario for a prompt sent while a new CLI starts.
- `UPDATE: CHANGELOG.md` - the entry under Claude.

## Steps

1. Write the two cases and see both fail on the code before this task.
2. Count the queries in `startQuery`, and hand `input` the count.
3. Read from `waiting` only while the reader's count is the current one, and end otherwise.
4. In `startQuery`, wake the reader parked in `wake` so it ends, and clear `wake`.
5. Run the cases, and the agent-claude cases that read a query's prompt or replace a CLI.
6. Say it in the spec and the changelog.

## Validation

- `agent-claude-prompt-after-restart.test.ts` holds two cases: the new CLI gets the prompt, and the replaced CLI's reader ends with nothing taken.
- Both fail before this task.
- The agent-claude, sdk and server suites at one worker, once, after the change.

## Resume

Not started.
