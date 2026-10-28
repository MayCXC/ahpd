---
title: A turn's prompt carries the turn's id
status: done
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L62-L68](../../../../packages/agent-claude/src/session/turns.ts#L62-L68) - `push`"
  - "[code://packages/agent-claude/src/session/turns.ts#L613-L617](../../../../packages/agent-claude/src/session/turns.ts#L613-L617) - the prompt of a turn sent again"
  - "[code://packages/agent-claude/src/session/query.ts#L769-L787](../../../../packages/agent-claude/src/session/query.ts#L769-L787) - the report from the first `user` frame"
  - "[code://packages/agent-claude/test/agent-claude-turn-recorded.test.ts](../../../../packages/agent-claude/test/agent-claude-turn-recorded.test.ts) - the cases for `onTurnRecorded`"
  - "[code://packages/sdk/test/host-local-turns.test.ts#L451-L490](../../../../packages/sdk/test/host-local-turns.test.ts#L451-L490) - p1's Claude case"
---

## Objective

A Claude turn's prompt goes to the CLI with the `uuid` that the transcript names the turn by.
The host learns that uuid when it differs from the turn's id.

## Files

- `UPDATE: packages/agent-claude/src/session/common.ts` - `UUID`, moved from `query.ts`.
- `UPDATE: packages/agent-claude/src/session/turns.ts:62-68` - `push` takes the uuid of a prompt.
- `UPDATE: packages/agent-claude/src/session/turns.ts:262` - the first prompt of a turn carries the turn's uuid.
- `UPDATE: packages/agent-claude/src/session/turns.ts:613-617` - a turn sent again carries a new uuid.
- `UPDATE: packages/agent-claude/src/session/query.ts:537-545` - remove `reported`.
- `UPDATE: packages/agent-claude/src/session/query.ts:769-787` - remove the report from the first `user` frame.
- `UPDATE: packages/sdk/src/host/spawn.ts:1539-1558` - say how Claude names a turn.
- `UPDATE: packages/sdk/src/types/agent.ts:517-531` - say how Claude names a turn.
- `UPDATE: packages/agent-claude/test/agent-claude-turn-recorded.test.ts` - read the prompts the session sends, and drop the echo.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts:451-490` - p1's Claude case without the echo.
- `UPDATE: .project/specs/agent-backends.md` - the scenario for a Claude turn's id.
- `UPDATE: CHANGELOG.md` - the Claude half of the entry for this plan.

## Steps

1. Move `UUID` from `query.ts` to `common.ts`, and import it in both files.
2. Give `push` an optional `uuid`, and put it on the message when the caller gives one.
3. Add `writtenAs(turnId, again)`, which answers the turn's id when it is a UUID and `again` is false.
4. Make `writtenAs` answer a new uuid otherwise, and call `onTurnRecorded` with the turn's id and that uuid.
5. Send a turn's first prompt with `writtenAs(turnId, false)`.
6. Send a failed turn's prompt again with `writtenAs(turnId, true)`.
7. Remove `reported` and the report from the first `user` frame.
8. Rewrite the two comments that say how Claude names a turn.
9. Rewrite the agent-claude cases to read the messages that the session puts on the CLI's input.
10. Make p1's Claude case write the transcript under the uuid that the prompt carried, and send no echo.

## Validation

- A turn with a UUID id sends its prompt with that `uuid`, and calls `onTurnRecorded` for nothing.
- A turn with another id sends a new `uuid`, and calls `onTurnRecorded` once with the pair.
- A `user` frame from the CLI, a worker's prompt or a tool result, calls `onTurnRecorded` for nothing.
- A failed turn sent again carries a new `uuid`, and `onTurnRecorded` names the pair.
- p1's Claude case anchors the `!` turn to the uuid of the Claude prompt.
- p1's Claude case has the `!` turn back after a restart.
- `pnpm exec vitest run packages/agent-claude packages/sdk/test/host-local-turns.test.ts` passes.

## Resume

- **Done:** 2026-10-28.
  The sdk suite's fake SDK records the uuid each prompt carried, which p1's Claude case reads.
