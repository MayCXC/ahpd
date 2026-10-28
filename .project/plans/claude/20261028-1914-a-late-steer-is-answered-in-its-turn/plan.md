---
title: A steering message is answered in the turn it steers
domain: claude
status: built
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L529-L545](../../../../packages/agent-claude/src/session/turns.ts#L529-L545) - `steer`, a steering message pushed onto the CLI's input with no uuid"
  - "[code://packages/agent-claude/src/session/turns.ts#L63-L73](../../../../packages/agent-claude/src/session/turns.ts#L63-L73) - `push`, the one door every prompt goes through to the CLI"
  - "[code://packages/agent-claude/src/session/turns.ts#L88-L92](../../../../packages/agent-claude/src/session/turns.ts#L88-L92) - `writtenAs`, the uuid a turn's prompt is written under"
  - "[code://packages/agent-claude/src/session/turns.ts#L661-L720](../../../../packages/agent-claude/src/session/turns.ts#L661-L720) - `cancel`, which interrupts the CLI and ends the turn"
  - "[code://packages/agent-claude/src/session/query.ts#L192-L205](../../../../packages/agent-claude/src/session/query.ts#L192-L205) - the input generator, which takes a steering message out of the state when it hands it over"
  - "[code://packages/agent-claude/src/session/query.ts#L772-L858](../../../../packages/agent-claude/src/session/query.ts#L772-L858) - the result branch, which ends the active turn and starts the queue at every result"
  - "[code://packages/agent-claude/src/session/query.ts#L530-L533](../../../../packages/agent-claude/src/session/query.ts#L530-L533) - `startQuery`, every new CLI for the conversation"
  - "[code://packages/agent-claude/src/session/parts.ts#L227-L257](../../../../packages/agent-claude/src/session/parts.ts#L227-L257) - `openTurn`, a turn nobody began, opened with an empty message from the agent"
  - "[code://packages/agent-claude/src/session/stream.ts#L108-L116](../../../../packages/agent-claude/src/session/stream.ts#L108-L116) - `message_start` opens a turn when none is active"
  - "[code://packages/agent-claude/test/agent-claude-cancelled-turn.test.ts](../../../../packages/agent-claude/test/agent-claude-cancelled-turn.test.ts) - the pattern for a case that pushes frames between session calls"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `user_message_uuids` on frames and results, `command_lifecycle` frames, and the interrupt receipt's `still_queued`
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1595-L1609 - a steering message is not a turn boundary, and its answer shows in the turn it steered
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L688-L705 - each result settles one prompt, and the turn completes only when no prompt is left
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudePromptQueue.ts#L128-L148 - `settleHead`, an intermediate result holds the turn open
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L457-L482 - `injectSteering`, a steering message takes the in-progress turn as its parent
  - https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/specification/chat-channel.md#steering-messages - the host consumes a steering message into the model context of the active turn
---

## Goal

A steering message goes into the turn that is running.
Sometimes it reaches the Claude CLI after the turn's last tool call.
The CLI then ends the turn and runs the message as a turn of its own.
Today the backend ends the steered turn at the first result, and the answer opens a second turn with an empty message from the agent.
A queued message waiting behind the turn starts in between, and the steer's answer is then shown as the answer to the queued message.
With this plan, the steered turn stays open until the CLI has answered every prompt it was handed in it.
The answer shows in the steered turn.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- A probe on SDK 0.3.301 with model `haiku` pushed a second prompt at the first text delta of a turn with no tool call.
  The CLI sent the first result, a second `system/init`, the second answer and a second result.
- The same probe pushed a prompt at the tool call of a turn running `sleep 4`.
  The CLI folded it into that turn: one result, whose `user_message_uuids` named both prompts.
- A third probe interrupted a turn after the CLI queued a second prompt.
  The interrupt's receipt listed the prompt in `still_queued`, and the CLI then ran it as a turn of its own.
- Every frame and result of an answer names the prompts it answers in `user_message_uuids`.
  `command_lifecycle` frames say when each prompt was queued, started, completed or cancelled.
- Fed these frames, today's backend ends the steered turn at the first result.
  The answer then opens a turn with an empty message from the agent.

### Runtime path

```
a client steers -> steer() pushes the message to the CLI -> the CLI answers after the turn's result
  -> query.ts ends the active turn at the first result -> the answer opens a turn nobody began
```

### Gaps

- The steering message carries no uuid, so nothing the CLI sends can be matched to it.
- The result branch ends the active turn and starts the queue at every result, whatever the CLI still owes.
- A turn opened for an answer nobody began has an empty message, even when the backend knows which prompt it answers.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A steering message is answered in the turn it steers, and the turn completes when the CLI has answered every prompt it was handed in it. | [the reference's CONTEXT.md, M10](https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1595-L1609); [the reference's pipeline](https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L688-L705); AHP 1.0.0, *Steering Messages* | 01 |
| A steering message is sent under its own id when that id is a UUID, and under a new uuid otherwise, as a turn's prompt is. | [code://packages/agent-claude/src/session/turns.ts#L88-L92](../../../../packages/agent-claude/src/session/turns.ts#L88-L92); the reference sends a steering message under its id | 01 |
| A result names the prompts it answered in `user_message_uuids`, or in `user_message_uuid`; a result that names none answers them all, as the backend reads a result today. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, measured | 01 |
| A successful result whose turn still owes a prompt does not end the turn; a result that reports a failure ends it as today. | The reference ends a turn at an error result; `(defaulted: a failure is shown when it happens)` | 01 |
| The queue starts only when the CLI owes no prompt. | The reference completes a turn only when its queue drains | 01 |
| A CLI that is put away or that dies takes the prompts it owed with it. | [code://packages/agent-claude/src/session/query.ts#L530-L533](../../../../packages/agent-claude/src/session/query.ts#L530-L533) | 01 |
| The CLI keeps the priority it gives a prompt by default, and folds a steering message in at the next tool call; the reference's `priority: 'now'`, which stops the answer being written, is not taken. | AHP 1.0.0, `ChatState.steeringMessage`: "Message to inject into the current turn at a convenient point"; [code://packages/agent-claude/src/session/context.ts#L228-L236](../../../../packages/agent-claude/src/session/context.ts#L228-L236) | - |
| An answer to a prompt that arrives when no turn is open opens a turn carrying that prompt's message, under the uuid it was sent with. | AHP 1.1.0, *Steering Messages*: consumption "represented as a new presentation turn"; measured, the CLI runs a queued prompt after an interrupt | 02 |
| The rest of a stopped turn's answer, the frames that name its own prompt, joins no turn and opens none; the interrupted result takes the prompt out of the map. | Measured: the CLI sends the stopped answer's last frames and its interrupted result after the stop; [docs/sdk/CHATS.md](../../../../docs/sdk/CHATS.md#turns), "A turn that has ended takes no more results" | 02 |

## Proposed architecture

- **Data flow** - `push` records each prompt the CLI is handed, with its message, in the session's `owed` map; a result removes the prompts it names.
- **Event flow** - a result ends the active turn only when the map is empty or the result reports a failure. The queue starts only when the map is empty.
- **State flow** - a frame that answers an owed prompt while no turn is open opens one with that prompt's message.
- **Layer responsibilities** - agent-claude only.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts), [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A steered turn ends when its prompts are answered](task-01-a-steered-turn-ends-when-answered.md) | done | - |
| [02 - A late answer opens a turn with its prompt](task-02-a-late-answer-opens-its-own-turn.md) | done | 01 |

## Risks and tradeoffs

- A CLI that never answers a prompt it was handed holds the turn open. A CLI that dies or is put away clears the map, and a stop ends the turn as before.
- After a restart, a late steering message reads back from the transcript as a turn of its own. This plan does not change the read-back.
- The union merges this branch with the logins branch, which starts a new CLI for a turn. `startQuery` clears the map, so that path needs no change.

## Resume state

- **Done so far:** planned and built 2026-10-28; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a case that keeps the actions a session emits must copy them, because a part announced empty is filled in place afterwards.

## Final verification checklist

- [x] Each case in `agent-claude-late-steer.test.ts` fails on the code before its task, except the folded steer, which guards.
- [x] agent-claude, sdk and server suites pass at one worker.
- [x] Boundary, typecheck, build and schema are clean.
- [x] `packages/sdk/test/fixtures/wire.jsonl` is unchanged in every commit.
