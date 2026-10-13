---
title: An ACP question is cancelled and answered in full - implemented
date: 2026-10-13
refs:
  - git://1de1381a
  - "[code://packages/agent-acp/src/mapping.ts](../../../../packages/agent-acp/src/mapping.ts)"
  - "[code://packages/agent-acp/src/session/handlers.ts](../../../../packages/agent-acp/src/session/handlers.ts)"
  - "[code://packages/agent-acp/src/session/context.ts](../../../../packages/agent-acp/src/session/context.ts)"
---

A question that an ACP server withdraws now leaves the chat. A Codex select question can take typed words. The words reach the field that codex-acp reads them from.

## What was built

- [`code://packages/agent-acp/src/session/handlers.ts`](../../../../packages/agent-acp/src/session/handlers.ts) - a withdrawn question is removed from the chat and answered `cancel` (task 01). The elicitation entry stores `typedOf` beside `fields`, and the answer path gives it to `contentOf` (task 02).
- [`code://packages/agent-acp/src/mapping.ts`](../../../../packages/agent-acp/src/mapping.ts) - `_meta.codex.isOther` gives `allowFreeformInput: true`. `notesOf` finds a note field by `role: 'user_note'` and `questionId`, and `questionsFor` does not draw it. `contentOf` puts typed words in the note field and the pick in the question's field, with `None of the above` when only words were typed. A question with no note field gets the words in its own field.
- [`code://packages/agent-acp/src/session/context.ts`](../../../../packages/agent-acp/src/session/context.ts) - the entry type gains `typed`.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp`: 4309 of 4309 tests pass in 240 files.
- New cases in `agent-acp-ports.test.ts` use the `elicitother` fixture script, whose note field is `mode_note2`. They cover the flag, the note field, a pick, typed words with no pick, a question with no note field, and a blank question.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.

## Departures from the plan

- Task 02 also changes `handlers.ts` and `context.ts`, which the first version of its Files line did not name. Step 10 and a plan row were added before the build.
- The review found that a blank flagged question was answered `None of the above`. Now that option stands for a pick only beside typed words.

## Left for later

- Nothing.
