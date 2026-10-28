---
title: Each case feeds the frames the CLI sends
status: done
depends: []
layer: "sdk tests"
refs:
  - "[code://packages/sdk/test/host-chats.test.ts#L62-L82](../../../../packages/sdk/test/host-chats.test.ts#L62-L82) - `twice`"
  - "[code://packages/sdk/test/host-chats.test.ts#L218-L222](../../../../packages/sdk/test/host-chats.test.ts#L218-L222) - the fork case"
  - "[code://packages/sdk/test/host-chats.test.ts#L280-L293](../../../../packages/sdk/test/host-chats.test.ts#L280-L293) - `oneTurn`"
  - "[code://packages/sdk/test/host-files.test.ts#L403-L406](../../../../packages/sdk/test/host-files.test.ts#L403-L406) - an attachment's turn"
  - "[code://packages/sdk/test/host-chat-attachment.test.ts#L80-L83](../../../../packages/sdk/test/host-chat-attachment.test.ts#L80-L83) - a chat attachment's turn"
  - "[code://packages/sdk/test/conformance.test.ts#L398-L407](../../../../packages/sdk/test/conformance.test.ts#L398-L407) - a peer chat's turn"
---

## Objective

No case in the sdk suite feeds an echo of a lead turn's prompt.
Each case names its conversation with the `init` frame, and its comments say what the CLI sends.

## Files

- `UPDATE: packages/sdk/test/host-chats.test.ts:62-82` - `twice` feeds `init` in place of each echo.
- `UPDATE: packages/sdk/test/host-chats.test.ts:218-222` - the fork case feeds `init`, and its comment says what the CLI sends.
- `UPDATE: packages/sdk/test/host-chats.test.ts:280-293` - `oneTurn` feeds `init` and an answer, and its comment names the answer as the turn's last entry.
- `UPDATE: packages/sdk/test/host-files.test.ts:403-406` - `init` in place of the echo, and the comment.
- `UPDATE: packages/sdk/test/host-chat-attachment.test.ts:80-83` - the same.
- `UPDATE: packages/sdk/test/conformance.test.ts:398-407` - the same, for `sdk-2`.

## Steps

1. Replace each echo with `{ type: 'system', subtype: 'init', session_id }`, keeping its session id.
2. Give `oneTurn` an `assistant` frame after `init`, with a uuid of its own.
3. Rewrite the three comments to name the frames the CLI sends.
4. Run `rg -n "type: 'user', session_id" packages/sdk/test`, and confirm that it finds no echo of a lead turn's prompt.
5. Run the four files, then the sdk and agent-claude suites, at one worker.

## Validation

- The four files pass with no echo.
- `pnpm exec vitest run --maxWorkers=1 packages/sdk packages/agent-claude` passes.

## Resume

- **Done:** 2026-10-28.
  No case depended on an echo's uuid: the turns that a case cuts at end at an answer.
