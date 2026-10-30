---
title: A failed turn says the CLI's words - implemented
date: 2026-10-29
refs:
  - git://2d933026 - the change
  - "[code://packages/agent-claude/src/session/query.ts#L813](../../../../packages/agent-claude/src/session/query.ts#L813) - a lead frame with `error` adds no part"
  - "[code://packages/agent-claude/src/session/query.ts#L850](../../../../packages/agent-claude/src/session/query.ts#L850) - a failed result's words, by its subtype"
---

A turn that the CLI fails ends with an error part that says the CLI's own words.
The CLI's notice of the failure is not shown as an answer beside it.

## What was built

- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - the words come from `result` for a `success` with `is_error`, and from `errors` otherwise.
  A lead assistant frame with `error` is skipped, and a worker's is shown as before.
- [`code://packages/agent-claude/test/agent-claude-failed-turn.test.ts`](../../../../packages/agent-claude/test/agent-claude-failed-turn.test.ts) - the two frames a CLI 2.1.301 sent for a turn with no login.

## Verified

- On the code before the change, the case fails: the error part does not hold the words.
- After the change, the case passes.
- `agent-claude-logins.test.ts`, which feeds failure notices, passes, 19 of 19.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
