---
title: A Claude session fails cleanly
domain: claude
status: built
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
refs:
  - "[code://packages/agent-claude/src/session/asking.ts#L169](../../../../packages/agent-claude/src/session/asking.ts#L169) - `canUseTool`, which does not read the SDK's abort signal"
  - "[code://packages/agent-claude/src/session/query.ts#L687-L715](../../../../packages/agent-claude/src/session/query.ts#L687-L715) - the `consume` catch, which keeps the SDK's message as it is"
  - "[code://packages/agent-claude/src/spawn.ts#L73-L80](../../../../packages/agent-claude/src/spawn.ts#L73-L80) - `settle`, which hands a spawn failure to the SDK"
  - "[code://packages/agent-claude/src/session.ts#L141-L142](../../../../packages/agent-claude/src/session.ts#L141-L142) - the query is built at creation, and `describe` does not wait for it"
  - "[code://packages/agent-claude/src/plugin.ts#L38-L58](../../../../packages/agent-claude/src/plugin.ts#L38-L58) - the plugin options"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278 - a spawn failure carries `code` and `errorClass`; `canUseTool` gets a `signal`
---

## Goal

A Claude session that fails says so in plain words, and leaves nothing open.
A cancelled tool call closes its confirmation, and a spawn failure names its cause without a path.
A CLI that does not start fails the turn.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "initializationResult" packages/agent-claude/src` - only `describe` and the probe call it, and no turn waits for it.
- `rg "ctx.pending" packages/agent-claude/src` - a stop, a subagent end and a close each settle the pending inputs.

### Runtime path

```
startQuery -> the CLI starts -> initializationResult -> consume reads frames -> a turn
canUseTool -> a confirmation in ctx.pending -> an answer, or a stop -> the entry is removed
```

### Gaps

- The SDK cancels a confirmation with its signal, and the card stays open until the turn ends.
- A spawn hook that fails gives the SDK's message, which blames the bundled binary and libc and shows a host path.
- A CLI that hangs at start leaves the turn running until a person stops it.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The CLI has 120 seconds to answer its handshake, and a plugin option changes that | Softov, 2026-10-11, to "How long should a Claude session wait for the CLI's handshake?" - "120 seconds" | 03 |
| A CLI that misses the bound is a CLI that died, on the path the `consume` catch takes, with no failure state of its own | [`code://packages/agent-claude/src/session/query.ts#L687-L715`](../../../../packages/agent-claude/src/session/query.ts#L687-L715) | 03 |

## Proposed architecture

- **Event flow** - an abort removes the input-needed entry, as an answer does.
  A spawn failure and a missed handshake fail the active turn, as a dead CLI does.
- **Layer responsibilities** - `packages/agent-claude`: all three; the host is not changed.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A cancelled call closes its confirmation](task-01-a-cancelled-call-closes-its-confirmation.md) | done | - |
| [02 - A spawn failure names its cause, not a path](task-02-a-spawn-failure-names-its-cause.md) | done | - |
| [03 - The CLI's handshake has a bound](task-03-the-handshake-has-a-bound.md) | done | 02 |

## Risks and tradeoffs

- A cold start with many MCP servers is slow - the bound is 120 seconds, and an operator can raise it.
- An abort that arrives after the answer must not remove an entry twice - task 01 settles once, whichever comes first.

## Resume state

- **Done so far:** built 2026-10-11; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/agent-claude` pass - 29 files, 279 cases.
- [x] A session whose CLI path names no file fails its turn with the short message - `agent-claude-spawn-failure.test.ts`.
- [x] `plans/index.md` updated.
