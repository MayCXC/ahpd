---
title: A stopped turn tells Claude it was stopped
domain: claude
status: built
priority: high
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/agent-claude/src/session/turns.ts#L782-L823](../../../../packages/agent-claude/src/session/turns.ts#L782-L823) - `cancel` answers the calls the session holds and interrupts the CLI"
  - "[code://packages/agent-claude/src/session/query.ts#L742-L753](../../../../packages/agent-claude/src/session/query.ts#L742-L753) - the reader, where a stop's interrupt waits for the CLI's report of those answers"
  - "[code://packages/agent-claude/src/session/asking.ts#L41-L50](../../../../packages/agent-claude/src/session/asking.ts#L41-L50) - what the model is told about a call it did not run says what happened, and nobody declined anything"
  - "https://github.com/microsoft/agent-host-protocol/blob/5f16d81bb7045b66d7bc768d244feab75002d943/types/channels-chat/actions.ts#L452 - `chat/turnCancelled`: the turn was aborted"
  - "https://github.com/microsoft/agent-host-protocol/blob/5f16d81bb7045b66d7bc768d244feab75002d943/types/channels-chat/reducer.ts#L178-L209 - `endTurn` closes a call still open as cancelled and skipped, never denied"
  - "https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts - a stop denies every pending permission, then aborts the query"
---

## Goal

A turn stopped while a call waits on a person, or while a client runs a call for it, tells Claude
"The turn was stopped" for that call, and never that a person refused it.

## Reconnaissance

The files read are the `refs` in the frontmatter, each with its note.

### Runtime path

```
chat/turnCancelled -> cancel -> each held call answered "The turn was stopped" -> interrupt
                     the SDK writes an answer once the promise it awaited settles; an interrupt at once
                     -> the interrupt reaches the CLI first -> the CLI writes its own text for the call
```

### Gaps

- `cancel` answers a call waiting on a person with a deny and a call a client is running with a failed
  result, then asks the SDK to interrupt in the same step. The SDK writes the answer to `canUseTool`
  only after `await` on the promise the session returned, and the interrupt request at once, so the
  interrupt always reaches the CLI first. The CLI then records its own text as the call's result:
  "The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file
  edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to
  tell you how to proceed." The session's own answer reaches the model nowhere.
- A model reading that text takes the stop for a person refusing the call and waits to be told how to
  go on. A Claude chat in a chat room, stopped once while its call to post in the room waited, refused
  every later message in the room the same way.
- Measured on the CLI the SDK 0.3.301 runs, through a stand-in for the Messages API that records what
  the model's next request carries:

| How the stop reaches the CLI | What the model reads for the call |
| --- | --- |
| the answer, then an interrupt in the same step (as built) | the CLI's refusal text |
| a deny with `interrupt: true`, alone | the CLI's refusal text |
| the answer, then an interrupt a macrotask later | the refusal text for a deny; the answer for a client call |
| the answer, then an interrupt once the CLI reports the call's result | "The turn was stopped", then "[Request interrupted by user]" |

- A call the CLI runs itself, such as `Bash`, gets the refusal text from any interrupt. Aborting the
  query instead, as the reference does, gives "[Tool call interrupted: the session ended before this
  call's result was recorded ...]", but it also ends a shell an earlier turn left running in the
  background, which an interrupt leaves running (measured the same way, on a CLI kept open across
  turns as this backend keeps it).

## Answers

| What | Source | Task |
| --- | --- | --- |
| A stop ends the turn and closes a call still open as skipped, not denied | `chat/turnCancelled`, `endTurn` | 01 |
| The model is told what happened to a call it did not run, and nobody declined anything | `CANCELLED` in `asking.ts` | 01 |
| Every pending permission is answered before the query is torn down | the reference's stop, which denies before it aborts | 01 |
| The interrupt goes out once the CLI has reported a result for each call the stop answered | the measurement above | 01 |
| With a call the CLI runs itself still open, the interrupt goes out at once: only the interrupt stops that call, and any interrupt gives it the CLI's text | the measurement above | 01 |
| The stop keeps interrupting the query rather than aborting it, so background work an earlier turn started keeps running | `cancel`'s workers comment; the measurement above | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A stop's interrupt waits for the CLI to record the stop's answers](task-01-a-stops-interrupt-waits-for-the-cli-to-record-its-answers.md) | done | - |

## Risks and tradeoffs

- A call the CLI runs itself still reads the CLI's own text after a stop. The way out of it, aborting
  the query, ends background shells an earlier turn started.
- A stop that answered a call and then sees the CLI start on anything other than reporting it sends
  the interrupt then, so a CLI that never reports the result does not hold the stop.

## Resume state

Built 2026-10-30. Each branch's checks pass; the union and a live stop through a chat room follow.
