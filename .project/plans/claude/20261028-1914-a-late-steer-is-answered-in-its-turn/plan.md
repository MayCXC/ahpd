---
title: A steering message is answered in the turn it steers
domain: claude
status: active
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/agent-backends.md
  - specs/sessions-and-chats.md
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
  - "[code://packages/agent-claude/src/transcript.ts#L274-L406](../../../../packages/agent-claude/src/transcript.ts#L274-L406) - `buildTurns`, which opens a turn at every prompt a transcript holds"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1352-L1353](../../../../packages/sdk/src/host/lifecycle.ts#L1352-L1353) - the host refuses a turn while the chat has an active one"
  - "[code://packages/agent-claude/test/agent-claude-cancelled-turn.test.ts](../../../../packages/agent-claude/test/agent-claude-cancelled-turn.test.ts) - the pattern for a case that pushes frames between session calls"
  - "[code://packages/agent-claude/test/agent-claude-transcript.test.ts](../../../../packages/agent-claude/test/agent-claude-transcript.test.ts) - the pattern for a case that reads a transcript back"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `user_message_uuids` on frames and results, `command_lifecycle` frames, and the interrupt receipt's `still_queued`
  - npm://@anthropic-ai/claude-agent-sdk-linux-arm64@0.3.301 - the CLI, 2.1.301, which reads a user text that starts with `[Request interrupted by user` as no prompt
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1595-L1609 - a steering message is not a turn boundary, and its answer shows in the turn it steered
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1597-L1606 - a transcript read back folds a steering message into the turn it steered
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeReplayMapper.ts#L280-L292 - the reference's read-back opens a turn at every prompt, with no fold
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L688-L705 - each result settles one prompt, and the turn completes only when no prompt is left
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudePromptQueue.ts#L128-L148 - `settleHead`, an intermediate result holds the turn open
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L457-L482 - `injectSteering`, a steering message takes the in-progress turn as its parent
  - https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/specification/chat-channel.md#steering-messages - the host consumes a steering message into the model context of the active turn
  - https://github.com/microsoft/agent-host-protocol/blob/main/docs/specification/chat-channel.md#steering-messages - AHP 1.1.0, a consumption shown as a new presentation turn, `chat/turnStarted` with the steering id as `queuedMessageId`
  - "[docs/sdk/AGENT.md](../../../../docs/sdk/AGENT.md#agent-in-the-order-the-host-asks) - *A turn is read back under the id your transcript gives it*: `onTurnRecorded`, ahpd's record of how a backend wrote a turn down"
  - "[code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts) - `keepLocalTurn` and `withLocalTurns`: a `!` turn kept per chat in the session's folder and put back after its anchor on every read"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts) - the backend's `emit`, which sees every `chat/turnStarted`, and `onTurnRecorded`"
  - "[code://packages/agent-pi/src/mapping.ts](../../../../packages/agent-pi/src/mapping.ts) - `addUsage`, how a call's usage is added to its turn's"
  - https://github.com/microsoft/vscode/blob/41c37d126aa93bece57534a18f0750e4dcb6b38c/src/vs/platform/agentHost/node/agentHostLocalTurns.ts - the reference's local turns, which the host's own copy
---

## Goal

A steering message goes into the turn that is running.
Sometimes it reaches the Claude CLI after the turn's last tool call.
The CLI then ends the turn and runs the message as a turn of its own.
Today the backend ends the steered turn at the first result, and the answer opens a second turn with an empty message from the agent.
A queued message waiting behind the turn starts in between, and the steer's answer is then shown as the answer to the queued message.
With this plan, the steered turn stays open until the CLI has answered every prompt it was handed in it.
The answer shows in the steered turn, and a transcript read after a restart shows the same turns.
A turn begun after a stop gets only its own answer, while the stopped turn's steering message is answered in a turn of its own.

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
- The transcript writes a late steering message as a prompt of its own, with a new `promptId` and `turnIndex`.
  Nothing else in it ties the message to the turn it steered.
- The transcript also writes a `queue-operation` record for each prompt, which the SDK's reader leaves out.
  Measured, a late steering message's record comes after the steered turn's last entry, and it leaves the queue 38 ms later.
  A prompt sent after a turn has ended looks the same.
- ahpd's record of how a backend wrote a turn down is `onTurnRecorded`, said only for a turn written under an id of the backend's own.
  The host kept what it says in memory, and `transcript` is handed no record of the turns a chat began.
- The SDK's reader returns a message the CLI took in at a tool call as a user message marked `isQueuedCommand`.
  It returns the CLI's interrupt marker, `[Request interrupted by user]`, as plain user text.
- Read back, today's backend opens a turn for a late steering message, for a folded one and for the interrupt marker.
- A probe interrupted a turn with a steering message queued and sent a new prompt at once.
  The CLI ran both in one turn: one result named both, and the answer was the new prompt's alone.
- A probe interrupted a turn with nothing queued and sent a new prompt at once.
  The stopped turn's result came first and named only the stopped prompt; today's backend ended the new turn with it as a failure.
- A probe interrupted a turn while its tool call ran, with a steering message queued.
  The CLI wrote the rejected tool's result and then `[Request interrupted by user for tool use]`, and ran the steering message after the stop.
- A probe ended a turn at its turn limit with a steering message queued.
  The failed result named only the turn's own prompt, and the CLI then ran the steering message as a turn of its own.
  The transcript records the failure in an attachment that the SDK's reader does not return.

### Runtime path

```
a client steers -> steer() pushes the message to the CLI -> the CLI answers after the turn's result
  -> query.ts ends the active turn at the first result -> the answer opens a turn nobody began
a client stops a turn -> cancel() ends it -> a new turn begins -> the CLI answers the steering message first
  -> query.ts puts that answer into the new turn
```

### Gaps

- The steering message carries no uuid, so nothing the CLI sends can be matched to it.
- The result branch ends the active turn and starts the queue at every result, whatever the CLI still owes.
- A turn opened for an answer nobody began has an empty message, even when the backend knows which prompt it answers.
- The read-back opens a turn at every user text, whatever the CLI wrote it for.
- The host keeps no record of the turns a chat began that a read could use.
- After a stop, no turn is active until the steering message's answer arrives, so a new turn can begin in between.

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
| Read back, a message the reader marks `isQueuedCommand` joins the open turn. | [the reference's CONTEXT.md, M10](https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1597-L1606): the read-back folds a steering message into its turn | 03 |
| Read back, the CLI's interrupt marker opens no turn and ends the open turn as cancelled. | The CLI reads a user text that starts with `[Request interrupted by user` as no prompt; a stopped turn is `cancelled` live | 03 |
| The host records, per chat in the session's folder beside its local turns, the transcript id each turn began under: its own id at its `chat/turnStarted`, whoever opened it, and what `onTurnRecorded` says. | [docs/sdk/AGENT.md](../../../../docs/sdk/AGENT.md#agent-in-the-order-the-host-asks), *A turn is read back under the id your transcript gives it*: `onTurnRecorded` is ahpd's record of how a backend wrote a turn down; [code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts) `keepLocalTurn`, one file a kept turn under its chat | 03 |
| After the backend's read and before the local turns go back, a turn the record holds no beginning for, or holds as the same turn as the one before, is read back inside the turn before it. Turns before the first one the record holds stay as they are. | [the reference's CONTEXT.md, M10](https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/CONTEXT.md#L1597-L1606): a steering message is not a turn boundary; [code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts) `withLocalTurns`, the host's pass after a read | 03 |
| A joined turn keeps the first one's id and message, takes both answers, ends as the later one ended, and adds up what both spent. | [code://packages/agent-pi/src/mapping.ts](../../../../packages/agent-pi/src/mapping.ts) `addUsage`, a call's usage added to its turn's | 03 |
| The record follows a truncation, a fork, a removal and a move, and a local turn anchored to a joined turn goes after the turn it joined. | [code://packages/sdk/src/host/localturns.ts](../../../../packages/sdk/src/host/localturns.ts) `forgetLocalTurns`, `copyLocalTurns`, `forgetChatLocalTurns`, `moveChatLocalTurns` | 03 |
| A resumed Claude session ends a turn read back with others inside it where the last of them ends, up to the rewind point. | [code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts) `ends`: a cut keeps a turn's last chain entry; `(defaulted: ours, from the read's own order)` | 03 |
| Each prompt the CLI owes belongs to a turn: a turn's own prompt and its steering messages to that turn. A frame or a result about a turn that is not running changes nothing in the one that is. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, `user_message_uuids` on every frame and result that answers; measured, a stopped turn's result arrives after a new turn begins | 04 |
| A turn that ends by a stop or a failure while the CLI holds its steering messages opens the turn that answers them at once. It carries the first message, with its id as `queuedMessageId`, and the others join it. | AHP 1.1.0, *Steering Messages*: consumption "represented as a new presentation turn"; [code://packages/sdk/src/host/lifecycle.ts#L1352-L1353](../../../../packages/sdk/src/host/lifecycle.ts#L1352-L1353); measured, the CLI merges a prompt it gets while such a message waits into one turn with it | 04 |
| The CLI holds a prompt from its `queued` lifecycle until its `started` one; one with neither is still on its way and opens its turn when its answer comes. | npm://@anthropic-ai/claude-agent-sdk@0.3.301, the `command_lifecycle` frame its interrupt documents; measured | 04 |
| A result that names a stopped turn's prompt is the stop's: a turn it also ends is cancelled, and nothing reads it as a failure. | [code://packages/agent-claude/src/session/context.ts#L186-L193](../../../../packages/agent-claude/src/session/context.ts#L186-L193), `interrupted`: a stop is not a failure | 04 |

## Proposed architecture

- **Data flow** - `push` records each prompt the CLI is handed in the session's `owed` map, with its message and the turn it belongs to.
  A result removes the prompts it names, and a `command_lifecycle` frame records whether the CLI holds a prompt or has started it.
- **Event flow** - a result ends the active turn only when the turn owes nothing or the result reports a failure. The queue starts only when the map is empty.
  A turn that ends by a stop or a failure hands the steering messages the CLI holds to a turn opened at once.
- **State flow** - a frame that answers an owed steering message while no turn is open opens one with that message.
  A frame or a result about a turn that is not running changes nothing.
- **Read-back** - the host records the transcript id each turn began under.
  It reads a turn it holds no beginning for back inside the turn before it.
  `buildTurns` keeps a message the reader marks `isQueuedCommand` in its turn and ends a stopped turn as cancelled.
- **Layer responsibilities** - agent-claude, and the host's record of the turns a chat began.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts), [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts), [`code://packages/agent-claude/src/transcript.ts`](../../../../packages/agent-claude/src/transcript.ts), [`code://packages/sdk/src/host/localturns.ts`](../../../../packages/sdk/src/host/localturns.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A steered turn ends when its prompts are answered](task-01-a-steered-turn-ends-when-answered.md) | done | - |
| [02 - A late answer opens a turn with its prompt](task-02-a-late-answer-opens-its-own-turn.md) | done | 01 |
| [03 - The read-back folds a steering message](task-03-the-read-back-folds-a-steer.md) | done | 02 |
| [04 - A stop opens the turn of its steering messages](task-04-a-stop-opens-the-steers-turn.md) | done | 03 |

## Risks and tradeoffs

- A CLI that never answers a prompt it was handed holds the turn open. A CLI that dies or is put away clears the map, and a stop ends the turn as before.
- A chat from before the record holds no beginnings, so its late steering messages still read back as turns of their own.
- A Claude session in a machine says how it wrote a turn down to the host inside the machine, not to this one.
  There, a client's turn id that is no UUID goes to the CLI under a uuid of the backend's own.
  Where this host reads that session's files back, such a turn reads back inside the turn before it.
- A steering message the CLI takes in at the moment of a stop opens its turn, which the stop's result then ends as cancelled.
- The union merges this branch with the logins branch, which starts a new CLI for a turn. `startQuery` clears the map, so that path needs no change.

## Resume state

- **Done so far:** tasks 01 and 02 built 2026-10-28; see [implemented.md](implemented.md).
  Task 03 built 2026-10-28: a transcript read back shows the turns a client saw live.
  Task 04 built 2026-10-28: a stop or a failure opens the turn that answers the steering messages the CLI holds.
- **Next action:** the agent-claude, sdk and server suites once, at one worker, then the implemented record.
- **Open questions:** none.
- **Watch out for:** a case that keeps the actions a session emits must copy them, because a part announced empty is filled in place afterwards.

## Final verification checklist

- [ ] Each case in `agent-claude-late-steer.test.ts` fails on the code before its task, except the folded steer, which guards.
- [ ] agent-claude, sdk and server suites pass at one worker.
- [ ] Boundary, typecheck, build and schema are clean.
- [ ] `packages/sdk/test/fixtures/wire.jsonl` is unchanged in every commit.
