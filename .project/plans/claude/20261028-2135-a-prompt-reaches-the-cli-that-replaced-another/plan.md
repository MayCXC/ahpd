---
title: A prompt sent while a new Claude CLI starts reaches that CLI
domain: claude
status: built
priority: high
created: 2026-10-28
revalidated: 2026-10-28
requires: []
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/agent-claude/src/session/query.ts#L210-L229](../../../../packages/agent-claude/src/session/query.ts#L210-L229) - `waiting` and `input`, the one list every CLI of the session reads, and the one `wake` a parked reader leaves"
  - "[code://packages/agent-claude/src/session/query.ts#L332](../../../../packages/agent-claude/src/session/query.ts#L332) - each query is handed a reader of its own over that list"
  - "[code://packages/agent-claude/src/session/query.ts#L567-L570](../../../../packages/agent-claude/src/session/query.ts#L567-L570) - `startQuery`, which every query of the session goes through"
  - "[code://packages/agent-claude/src/session/query.ts#L621-L635](../../../../packages/agent-claude/src/session/query.ts#L621-L635) - `switchAgent`, a new CLI for the agent a message picked, before its prompt"
  - "[code://packages/agent-claude/src/session/query.ts#L967-L985](../../../../packages/agent-claude/src/session/query.ts#L967-L985) - `refreshPreset`, a new CLI for an edited record or another login, before the prompt"
  - "[code://packages/agent-claude/src/session/logins.ts#L186-L208](../../../../packages/agent-claude/src/session/logins.ts#L186-L208) - a turn moved to another login runs on a new CLI and sends its prompt again"
  - "[code://packages/agent-claude/src/session/turns.ts#L70-L81](../../../../packages/agent-claude/src/session/turns.ts#L70-L81) - `push`, which adds a prompt to the list and calls the `wake` it finds"
  - "[code://packages/agent-claude/src/session.ts#L304](../../../../packages/agent-claude/src/session.ts#L304) - a closed session wakes the reader so it ends"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `sdk.mjs` `Query.streamInput` reads its input only after `initializeWritten`, and breaks on an aborted query after it has taken the next message; `Query.initialize` with in-process MCP servers awaits `captureSdkMcpServerManifests` before it writes the request
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudePromptQueue.ts#L64-L86 - the reference's prompt iterable returns done once its query is aborted, and parks on a wait the next binding does not share
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudePromptQueue.ts#L163-L172 - `notifyAborted` wakes a parked reader of an aborted query, and `resetForRebind` gives the next binding a fresh wait; the queue itself survives the rebind
  - https://github.com/microsoft/vscode/blob/3a2421399905c0c044dade3048a797d1e9ba33d4/src/vs/platform/agentHost/node/claude/claudeSdkPipeline.ts#L589-L640 - `_rebindQuery`: a new query bound to the same queue, the wait reset
---

## Goal

A turn that starts on a new Claude CLI sends its prompt to that CLI.
The CLI it replaced reads nothing more and its reader ends.

A rebind is the session replacing its CLI with a new one on the same conversation: an agent a message picked, an edited record, another login.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "ctx.wake|input\(\)|startQuery\(" packages/agent-claude/src` - one reader per query over one shared list, one `wake` slot, three paths that close a CLI and start another before the prompt.
- The SDK 0.3.301 source: `Query.streamInput` awaits `initializeWritten`, then for each message checks the abort signal and breaks, dropping the message it took.
- `Query.initialize({ first: true })` awaits `captureSdkMcpServerManifests` when in-process MCP servers are declared, so a session that offers a client's tools writes the new CLI's initialize late.
- A live client run on 2026-10-28 saw a turn on a new CLI sit at "Thinking" for 45 seconds with no parts, its prompt never reaching the CLI.
- The test mocks read a query's prompt at once, so no case covers a late reader.

### Runtime path

```
turn begins -> refreshPreset or switchAgent: close the CLI, startQuery a new one
  -> push the prompt onto `waiting`, call `wake`
  -> `wake` is the replaced CLI's parked reader: it takes the prompt and hands it to its closed query
  -> the SDK drops it; the new CLI's reader starts later and finds `waiting` empty
```

### Gaps

- A reader does not know whether its query is still the session's.
- `wake` names whichever reader parked last, and a rebind leaves it naming the replaced one.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The list of waiting prompts outlives a query, and the query the session runs now is the one that reads it. | The reference's `ClaudePromptQueue`, which survives a rebind (`resetForRebind`) | 01 |
| A reader whose query is no longer the session's takes nothing from the list and ends. | The reference's iterable, which returns done once its query is aborted (claudePromptQueue.ts L64-L86) | 01 |
| `startQuery` wakes the replaced reader so it ends, and clears `wake`, so a prompt pushed before the new reader starts waits for it. | The reference's `notifyAborted` on the old query and `resetForRebind` for the new one (claudePromptQueue.ts L163-L172, claudeSdkPipeline.ts L518-L522 and L626-L629) | 01 |
| A query is numbered by the count of queries the session built, and its reader holds that number. | `(defaulted: every query goes through startQuery, so the count is the binding)` | 01 |
| Nothing else changes: the first query, a closed session and a steering message read as they do. | [code://packages/agent-claude/src/session.ts#L304](../../../../packages/agent-claude/src/session.ts#L304) | 01 |

## Proposed architecture

- **Data flow** - a prompt -> `waiting` -> the reader of the session's current query -> its CLI.
- **Event flow** - `startQuery` numbers the new query, wakes the replaced reader, which ends, and clears `wake`; a push wakes whichever reader parked since.
- **State flow** - `waiting` and the count live in the session's query area; each reader holds the number it was built with.
- **Layer responsibilities** - agent-claude only.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a-prompt-reaches-the-new-cli](task-01-a-prompt-reaches-the-new-cli.md) | done | - |

## Risks and tradeoffs

- A prompt the replaced CLI had already taken before the rebind is that CLI's, as before: the change is only about what is pushed after.

## Resume state

- **Done so far:** task 01, 2026-10-28; [implemented.md](implemented.md) says what exists.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** every path that replaces a CLI goes through `startQuery`; a path that built a query another way would read beside the current one.

## Final verification checklist

- [x] Each new case fails before its task and passes after it.
- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and `pnpm schema` pass.
- [x] The agent-claude, sdk and server suites pass at one worker, once, after the change.
- [x] The spec has the scenario and the changelog the entry.
