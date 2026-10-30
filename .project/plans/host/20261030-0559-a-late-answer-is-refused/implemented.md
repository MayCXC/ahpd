---
title: An answer or a confirmation nothing waits on is refused - implemented
date: 2026-10-30
refs:
  - git://391ddeb6 - the change
  - "[code://packages/sdk/src/host/chatactions.ts#L1423-L1436](../../../../packages/sdk/src/host/chatactions.ts#L1423-L1436) - `chat/toolCallConfirmed` refused when `confirm` did not take it"
  - "[code://packages/sdk/src/host/chatactions.ts#L1461-L1469](../../../../packages/sdk/src/host/chatactions.ts#L1461-L1469) - `chat/inputCompleted` refused when `answer` did not take it"
  - "[code://packages/sdk/src/types/session.ts#L649](../../../../packages/sdk/src/types/session.ts#L649) - `confirm` answers whether a call was waiting on a confirmation"
---

A client's confirmation of a call that waits on no confirmation, and its answer to a request nothing waits on, are refused to that client with a reason.
The client lets go of an action the host never applied, and a client that sends its unechoed actions again after a reconnect stops sending it.

## What was built

- [`code://packages/sdk/src/types/session.ts#L649`](../../../../packages/sdk/src/types/session.ts#L649) - `confirm` answers a boolean, false when no call by that id waits on a confirmation; `answer`'s documentation says the host refuses its false.
- [`code://packages/sdk/src/host/chatactions.ts#L1423`](../../../../packages/sdk/src/host/chatactions.ts#L1423) - `chat/toolCallConfirmed` is refused with "`<id>` is not a call this chat is waiting to have confirmed", and `chat/inputCompleted` with "`<id>` is not a question this chat is waiting on", the words `chat/inputAnswerChanged` is refused with for the same request.
- Each backend's `confirm` answers false where it returned without acting and true where it took the confirmation: agent-claude's `asking.ts`, agent-cofold's `pauses.ts`, agent-pi's `session.ts`, agent-acp's `handlers.ts`, the bot's `chat.ts`, and the echo and notes examples.
  [`code://packages/sdk/src/sessions/nested.ts#L1013`](../../../../packages/sdk/src/sessions/nested.ts#L1013) - the nested session takes one for a call of its running inner turn in `pending-confirmation`, and [`code://packages/bot/src/chat.ts#L1054`](../../../../packages/bot/src/chat.ts#L1054) the bot one for a call it asked about that still waits.
- [`code://packages/sdk/test/host-input.test.ts#L354`](../../../../packages/sdk/test/host-input.test.ts#L354) - "refuses an answer to a request nothing is waiting on, to its sender alone", and "refuses a confirmation of a call that waits on none".
- [`code://packages/agent-cofold/test/agent-cofold-approval.test.ts#L782`](../../../../packages/agent-cofold/test/agent-cofold-approval.test.ts#L782) - "refuses a decision for a turn that already ended to its sender, and throws nothing", and the approved-tool case asserts the refusal of its decision for a call that is not open.
- [`code://packages/sdk/test/ahp-test-cases.test.ts#L523`](../../../../packages/sdk/test/ahp-test-cases.test.ts#L523) - the protocol's cases 096, 235 (a declined request) and 237 (an unknown id) are refused with the others this host has no state for.
- The test sessions of `subagent-chat.test.ts` and `subagent-link.test.ts` answer `confirm`.

## Verified

- Against the host before the change, the two host-input cases, the two cofold cases and the three protocol cases fail; with it, all three files pass (693 of 693).
- The type check passes.
- The files that timed out in a run of every suite at once pass alone: agent-acp's catalog, ports and turn, agent-pi's truncate, the sdk's changes-refresh, nested-start and wire.

## Departures from the plan

- The cofold approval cases and the protocol's case lists change with the host's answer, since both asserted the silence.

## Left for later

- none.
