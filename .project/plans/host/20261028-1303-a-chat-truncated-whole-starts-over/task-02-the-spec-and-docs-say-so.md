---
title: The spec and the docs say what a truncation with no turn does
status: done
depends: [task-01-the-host-starts-a-chat-over.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L293](../../../../docs/sdk/AHP.md#L293) - the `chat/truncated` row"
  - "[code://docs/sdk/CHATS.md#L63](../../../../docs/sdk/CHATS.md#L63) - a truncation, and what it refuses"
---

## Objective

The spec has the scenario of a chat that starts over.
The docs say when the host starts a chat over, and when it refuses.

## Files

- `UPDATE: .project/specs/sessions-and-chats.md` - the scenario of a chat truncated whole, and the cut at a local turn with no turn before it.
- `UPDATE: docs/sdk/AHP.md:293` - the `chat/truncated` row.
- `UPDATE: docs/sdk/CHATS.md:63` - the paragraph on a truncation.

## Steps

1. Write the scenario into the spec, with the reference named.
2. Correct the scenario of a cut at a local turn.
3. Write the start-over into the `chat/truncated` row of `AHP.md`.
4. Write it into the paragraph of `CHATS.md`.

## Validation

- Run `lint-prose.mjs` on the spec scenario, and expect no finding.
- Read each changed paragraph against the code of task 01.

## Resume

Done 2026-10-28.

