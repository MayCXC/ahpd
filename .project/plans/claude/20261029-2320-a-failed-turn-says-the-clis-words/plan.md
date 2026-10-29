---
title: A failed turn says the CLI's words
domain: claude
status: active
priority: high
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - git://c26f1e96 - the commit of `main` the facts were checked at
  - "[code://packages/agent-claude/src/session/query.ts#L803-L808](../../../../packages/agent-claude/src/session/query.ts#L803-L808) - an assistant frame is shown unless a login's refusal hides it"
  - "[code://packages/agent-claude/src/session/query.ts#L838-L842](../../../../packages/agent-claude/src/session/query.ts#L838-L842) - a failed result's words are read from `errors` alone"
  - "[code://packages/agent-claude/src/session/query.ts#L912](../../../../packages/agent-claude/src/session/query.ts#L912) - the same words are the session's error"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeMapSessionEvents.ts#L567-L575 - the reference reads `result` for a `success` with `is_error`, and `errors` for `error_during_execution`
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/claude/claudeMapSessionEvents.ts#L320-L347 - the reference draws no text from a lead assistant frame, so the CLI's notice is not an answer there
---

## Goal

A turn that the CLI fails ends with an error part that says the CLI's own words.
The CLI's notice of the failure is not shown as an answer beside it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "The turn failed" packages/agent-claude/src` - the result branch is the one place that writes it.
- On CLI 2.1.301, a turn with no login ends with two frames.
  The first is an assistant frame with `error: authentication_failed`, model `<synthetic>`, and the words as its text.
  The second is a `result` of subtype `success` with `is_error` and the same words in `result`.
  It has no `errors`.

### Runtime path

```
assistant (error, the words) -> shown as a markdown part
result (success, is_error, result: the words) -> errors is empty -> "The turn failed"
```

### Gaps

- The error part says only "The turn failed".
- The words are shown as an answer.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A `success` with `is_error` says `result`, and an error subtype says `errors` | The reference's `getResultErrorText` | 01 |
| A lead assistant frame with `error` adds no part | The reference draws a lead turn's text from the stream alone | 01 |
| A worker's frame with `error` is shown as before | Its failure ends no turn of the lead | 01 |

## Proposed architecture

- **Data flow** - the result's words go to the error part and to the session's error.
- **Layer responsibilities** - agent-claude: `session/query.ts`.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The error part says the words](task-01-the-error-part-says-the-words.md) | pending | - |

## Risks and tradeoffs

- None.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-error-part-says-the-words.md](task-01-the-error-part-says-the-words.md).
- **Open questions:** none.
- **Watch out for:** the case feeds the two frames the CLI sent, as they came.

## Final verification checklist

- [ ] A turn the CLI failed ends with an error part that holds the CLI's words.
- [ ] The words are not shown as a markdown part.
