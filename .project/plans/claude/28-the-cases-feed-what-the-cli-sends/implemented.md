---
title: The Claude cases feed what the CLI sends - implemented
date: 2026-10-28
refs:
  - "[code://packages/sdk/test/host-chats.test.ts](../../../../packages/sdk/test/host-chats.test.ts)"
  - "[code://packages/sdk/test/host-files.test.ts](../../../../packages/sdk/test/host-files.test.ts)"
  - "[code://packages/sdk/test/host-chat-attachment.test.ts](../../../../packages/sdk/test/host-chat-attachment.test.ts)"
  - "[code://packages/sdk/test/conformance.test.ts](../../../../packages/sdk/test/conformance.test.ts)"
---

No case in the sdk suite feeds an echo of a lead turn's prompt.
Each names its conversation with the `init` frame, as the CLI does.

## What was built

- [`code://packages/sdk/test/host-chats.test.ts`](../../../../packages/sdk/test/host-chats.test.ts) - `twice` and the fork case feed `init` in place of the echo.
  `oneTurn` feeds `init` and an answer, so its turn ends at the answer's uuid.
- [`code://packages/sdk/test/host-files.test.ts`](../../../../packages/sdk/test/host-files.test.ts), [`code://packages/sdk/test/host-chat-attachment.test.ts`](../../../../packages/sdk/test/host-chat-attachment.test.ts) - an attachment's turn feeds `init`, and the comment says so.
- [`code://packages/sdk/test/conformance.test.ts`](../../../../packages/sdk/test/conformance.test.ts) - the peer chat's turn feeds `init` for `sdk-2`.

## Verified

- No case in `packages/sdk/test` feeds a `user` frame with a session id.
- The four files pass, and so do the sdk and agent-claude suites at one worker.
  The strict-schema case timed out once in the run and passes alone, in 2.9 s.

## Departures from the plan

- None.

## Left for later

- None.
