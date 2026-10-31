---
title: A failed pi turn is resumed
created: 2026-10-31
refs:
  - git://4e122781 - the commit of ahpd the facts were checked at
  - git://171e90619c7 - the commit of VS Code the facts were checked at
  - "[code://packages/sdk/src/host/chatactions.ts#L1081-L1090](../../packages/sdk/src/host/chatactions.ts#L1081-L1090) - the host's `chat/turnResume`: refused when `session.resume` is absent or returns `false`, and nothing else"
  - "[code://packages/sdk/src/types/session.ts#L590-L600](../../packages/sdk/src/types/session.ts#L590-L600) - `Session.resume`, optional, runs the latest errored turn again without a new message"
  - "[code://packages/sdk/src/host/gate.ts#L168](../../packages/sdk/src/host/gate.ts#L168) - `chat/turnResume` needs the `chat:send` operation"
  - "[code://packages/agent-claude/src/session/turns.ts#L744-L780](../../packages/agent-claude/src/session/turns.ts#L744-L780) - the Claude backend's `resume`, the sibling to copy"
  - "[code://packages/agent-claude/src/session/parts.ts#L320-L322](../../packages/agent-claude/src/session/parts.ts#L320-L322) - the Claude backend's error part has no `resumable`"
  - "[code://packages/sdk/src/sessions/nested.ts#L1247-L1252](../../packages/sdk/src/sessions/nested.ts#L1247-L1252) - the nested session's `resume`, which passes `chat/turnResume` on to the inner host"
  - "[code://docs/sdk/AHP.md#L278](../../docs/sdk/AHP.md#L278) - ahpd's support row for `chat/turnResume`"
  - "[code://packages/agent-pi/src/session.ts#L657-L701](../../packages/agent-pi/src/session.ts#L657-L701) - `finish`, which ends a pi turn and sends `chat/error` with no `resumable`"
  - "[code://packages/agent-pi/src/session.ts#L786-L805](../../packages/agent-pi/src/session.ts#L786-L805) - `agent_settled`, where a pi turn ends in `error` when the last answer stopped with `error`"
  - "[code://packages/agent-pi/src/session.ts#L979-L1104](../../packages/agent-pi/src/session.ts#L979-L1104) - `begin`, which opens a turn and calls `backend.prompt`"
  - "[code://packages/agent-pi/src/session.ts#L1284-L1298](../../packages/agent-pi/src/session.ts#L1284-L1298) - the session's `begin` method; the object has no `resume`"
  - "[code://packages/agent-pi/src/backend.ts#L34-L102](../../packages/agent-pi/src/backend.ts#L34-L102) - `PiBackend`, all that a pi session may ask of pi"
  - "[code://packages/agent-pi/src/backend.ts#L433-L436](../../packages/agent-pi/src/backend.ts#L433-L436) - `rewind`, which calls pi's `navigateTree`"
  - "[code://packages/agent-pi/src/replay.ts#L103-L105](../../packages/agent-pi/src/replay.ts#L103-L105) - a failed turn read back from pi's file gets an error part with no `resumable`"
  - npm://@earendil-works/pi-coding-agent@1.3.0 - the pi SDK version installed; `AgentSession` in `dist/core/agent-session.d.ts` and `.js`
  - npm://@earendil-works/pi-agent-core@1.3.0 - `Agent.continue()` in `dist/agent.d.ts`
  - npm://@microsoft/agent-host-protocol@1.0.0 - `ErrorResponsePart.resumable`, `ChatTurnResumeAction` and the chat reducer, in the version ahpd depends on
  - https://github.com/microsoft/agent-host-protocol/blob/2c37a04f/docs/specification/chat-channel.md - *Error recovery* and the validation table row for `chat/turnResume`, checked at 2c37a04f
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/agentService.ts#L12721-L12748 - `_getResumableTurn`, the host's check before a resume
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/agentService.ts#L12798-L12805 - a resume that fails the check is rejected before it is applied
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/agentSideEffects.ts#L1802-L1860 - the side effect that calls the provider's `resumeTurn`, and marks its failure resumable
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/common/agent.ts#L1261-L1262 - `resumeTurn`, optional on a provider
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/common/state/sessionState.ts#L129-L135 - `createErrorResponsePart`, not resumable unless asked
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L3539-L3552 - the Copilot session ends a failed turn with a resumable error
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L6053-L6094 - the Copilot session's `resume`, a send with zero messages
---

# A failed pi turn is resumed

Softov's goal: "pi - Resume a failed turn".
A pi turn that failed, for example on a model provider error, can be continued with AHP `chat/turnResume`, without a new message.
Today ahpd refuses that action on a pi session.

## What others do

### The protocol

- `ErrorResponsePart` has an optional `resumable`. Only `true` lets a client dispatch `chat/turnResume`.
- A client may resume only the latest turn, in state `error`, whose last response part is a resumable error.
- The reducer reopens the same turn as the active turn, with its message, response parts and usage.
  It is a no-op when the last part is not a resumable error.
- The host then resumes the provider's work for that turn.
  A success ends the turn as complete. A new failure appends one more error part, so every failure stays in order.
- The server must validate the resume before it calls the provider.
  It must reject a resume while a turn is active, and a resume of any other turn or of a part that is not resumable.

### VS Code's agent host

- `_getResumableTurn` checks the chat before the action is applied: no active turn, the latest turn, state `error`, `resumable: true`, and a provider with `resumeTurn`.
  A resume that fails the check is rejected and has no effect.
- A provider's `resumeTurn` is optional. Only the Copilot provider has it; VS Code's Claude provider does not.
- The side effect calls `resumeTurn` with the turn id. A failure of that call ends the turn with a new error part, marked resumable.
- `createErrorResponsePart` leaves `resumable` out unless the caller passes `true`.
- The Copilot session ends every failed turn with a resumable error part.
- The Copilot session's `resume` sends the SDK `sendMessages({ messages: [] })`, a continuation with no new message.

## What ahpd has today

### The host

- `chat/turnResume` is refused with "this backend cannot run a turn again" when the session has no `resume`.
  It is refused with "is not a turn that can be resumed" when `resume` returns `false`.
- The host does not check `resumable`, and it dispatches no action when `resume` returns `true`.
- `Session.resume` is optional. Its comment says it runs the latest errored turn again without a new message.
- Two sessions have `resume`: the Claude backend and the nested session. `agent-acp`, `agent-cofold` and `agent-pi` have none.

### The Claude backend, the sibling

- `resume` returns `false` while a turn runs, or when the last turn is not the one named, or is not in `error`.
- Otherwise it takes the turn off the history and deletes its `state` and `duration`.
  It makes the turn the active turn, clears `failed`, and sets the activity to "Thinking".
- It then sends the turn's message text to the CLI again, as a new user message.
- It emits no `chat/turnResume`.
- Its error part has no `resumable`. The comment says "this host cannot resume a turn".

### The nested session

- `resume` makes the same check on the inner chat, and passes `chat/turnResume` on to the inner host.

### The pi backend

- `finish` ends every pi turn. On `error` it sets `failed` and emits `chat/error` with `{ kind: 'error', error: { errorType: 'turnFailed', message } }`, with no `resumable`.
- A turn ends in `error` at `agent_settled` when the last assistant message has `stopReason` `error`.
  It also ends in `error` when `begin` throws, for example on a model pi does not have.
- pi retries some errors itself before it settles. `agent_end` with `willRetry` only sets the activity to "Retrying".
- The session object has `begin`, `steer`, `cancel` and `confirm`, and no `resume`. So the host refuses `chat/turnResume` on every pi session.
- `PiBackend` has `prompt`, `steer`, `abort` and `rewind`, and nothing that continues a run without a message.
- A failed turn read back from pi's file gets an error part with no `resumable`.

### The pi SDK, version 1.3.0

- `AgentSession` has no public call that continues a run without a new message.
- `Agent.continue()` in `pi-agent-core` continues from the current transcript. The last message must be a user or a tool result message.
- `AgentSession.agent` is public and `readonly`.
- `AgentSession.prompt()` runs through a private loop, `_startRun`. That loop calls `agent.continue()` for its own retries and emits `agent_settled` at its end.
- pi writes every assistant message to its file at `message_end`, a failed one too.
- pi's own retry keeps the failed message in the file and removes it from the model's context. It calls the private `_omitRecoveryAttempt`, which appends a context edit with `null`.
- `SessionManager.appendContextEdit(targetId, null)` is public, and removes the target from the model's context. `AgentSession.refreshContext()` is public too.
- `AgentSession.navigateTree(targetId)` moves the conversation to an earlier entry, in the same file. ahpd's `rewind` uses it.

## Who writes

- `maycxc/host/20261030-0559-a-late-answer-is-refused` changes `confirm` in `packages/agent-pi/src/session.ts`, and `confirm` and `answer` in `chatactions.ts`, `types/session.ts` and `nested.ts`.
  These are other functions in the same files as the change. The second branch to merge rebases.
- `maycxc/host/124-an-agents-shell-is-a-terminal-the-person-sees` changes `packages/agent-pi/src/tools.ts`, its test and its README. The change does not touch these files.
- No worktree changes `packages/agent-pi` or the `chat/turnResume` code, committed or not.
- No other unmerged branch changes these files.
- `origin/main` moved to `2a43705e` while this was checked. That merge changes CI only, not these files.

## The change

- The pi error part is `resumable: true` on the `chat/error` action and on the turn the snapshot holds.
- The pi session gets `resume(turnId)`, in the shape of the Claude backend's.
  It returns `false` while a turn runs, or when the latest turn is not `turnId` in `error` with a resumable last part.
- `resume` reopens the turn: off the history, without `state` and `duration`, as the active turn, with its message and parts.
  It clears `failed`, sets the activity to "Thinking" and opens the turn's mapping on the same parts.
- `resume` then continues pi without a new message, and the failed reply is not in the model's context.
  pi's usual events then end the turn through `finish`, as complete or with one more error part.

## Open points

- How pi continues. Two ways use the SDK as it is:
  - Continue from the failed call: `appendContextEdit(failedEntryId, null)`, `refreshContext()`, then `session.agent.continue()`.
    This keeps the tool calls the turn already ran, as pi's own retry does. It is outside `_startRun`, so pi raises no `agent_settled` and makes no retry of its own.
  - Run the prompt again on a branch: `navigateTree` to the entry before the prompt, then `prompt` with the same text.
    This uses only the public calls that ahpd already wraps. The whole turn runs again, as on the Claude backend.
- Which pi failures are resumable: every `error` ending, or only a failed model call. A failure in `begin` before the prompt has no failed reply to drop.
- Whether a failed turn read back from pi's file after a restart is resumable.
- Whether the pi session emits `chat/turnResume` for the other clients, as the nested session does, or the host does it for every backend.
- Not in this brief: the Claude backend's error part has no `resumable`, so the protocol's reducer ignores a resume of a Claude turn too.
  The host does not reject a resume of a part that is not resumable, which the protocol says it must.
- Not checked: whether `agent.continue()` called outside `_startRun` writes its messages to pi's file and raises the events that ahpd reads.
- Not checked: how the host learns the new prompt entry when the prompt runs again on a branch, through `onTurnRecorded`.
- Not checked: whether the client that sent `chat/turnResume` gets an echo when `resume` returns `true`.
