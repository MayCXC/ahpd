---
title: A client's tools reach the agent whole and on time
domain: claude
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L18-L25](../../../../packages/agent-claude/src/session/clienttools.ts#L18-L25) - `shaped()`, which turns an object into a string and drops enums"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L435-L446](../../../../packages/agent-claude/src/session/clienttools.ts#L435-L446) - `setTools`, which keeps the new list before the SDK has taken it"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L337-L346](../../../../packages/agent-claude/src/session/clienttools.ts#L337-L346) - `openCall`, which drops a call whose tool is no longer on offer"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L817-L852](../../../../packages/sdk/src/host/sessionmethods.ts#L817-L852) - the creator's presence, recorded after `openSession`"
  - "[code://docs/sdk/AHP.md#L443-L452](../../../../docs/sdk/AHP.md#L443-L452) - the input request table, which names two kinds of four"
  - npm://zod@^4.4.3 - `z.fromJSONSchema` reads a JSON Schema into zod
---

## Goal

A tool that a client offers reaches Claude with its whole schema, from the first turn of the session that client made.
A tool list that the SDK did not take is sent again, and a call to a client that has left ends at once.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "clientGone" packages` - the Claude session spreads `calls.methods.clientGone`, which ends only the calls already open.
- `rg "initializationResult|activeClient" packages/sdk/src/host` - the creator's presence is set in one place, after the backend opens the session.

### Runtime path

```
session/create with activeClient -> openSession -> boundTools -> setTools -> setMcpServers
  -> the CLI calls mcp__ahp__<clientId>__<name> -> ranByClient -> openCall -> calls.wait -> the client answers
```

### Gaps

- A nested object, an array of objects and an enum reach the model as a string.
- A tool list that `setMcpServers` refused is "no change" when it comes again, so it is never sent.
- The first `boundTools` of a new session has no creator, so its client tools miss the first turn.
- A handler that the CLI started for a client that then left waits until the turn is stopped.
- `docs/sdk/AHP.md` names two input request kinds, and the host serves four.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The schema is read with `z.fromJSONSchema`, and a schema it cannot read stays a string | Softov, 2026-10-11, to "How should a client tool's JSON Schema become the zod the SDK takes?" - "zod's fromJSONSchema" | 01 |
| The owner is already part of the tool name, so a claim by name is a claim inside one client's tools | [`code://packages/agent-claude/src/session/clienttools.ts#L189-L197`](../../../../packages/agent-claude/src/session/clienttools.ts#L189-L197) | 04 |

## Proposed architecture

- **Data flow** - a client's tool list goes to the SDK whole, and the session keeps it only once the SDK has taken it.
- **Event flow** - a client that leaves ends each join that waits on one of its tools, with the same refusal a stopped turn gives.
- **Layer responsibilities** - `packages/sdk`: presence before the session opens · `packages/agent-claude`: the schema, the tool list and the joins · `docs`: the input request table.
- **Source-of-truth files** - [`code://packages/agent-claude/src/session/clienttools.ts`](../../../../packages/agent-claude/src/session/clienttools.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A nested schema reaches the model](task-01-a-nested-schema-reaches-the-model.md) | done | - |
| [02 - A tool list the SDK refused is sent again](task-02-a-refused-tool-list-is-sent-again.md) | done | - |
| [03 - The creator's tools are there on the first turn](task-03-creators-tools-are-there-on-first-turn.md) | done | - |
| [04 - A call to a client that left ends at once](task-04-call-to-a-departed-client-ends-at-once.md) | done | - |
| [05 - The docs name every kind of input request](task-05-docs-name-every-kind-of-input-request.md) | done | - |

## Risks and tradeoffs

- `z.fromJSONSchema` may give a zod that the SDK turns back into a different JSON Schema - task 01 tests the round trip, not only the zod.
- A backend that reads presence while it opens now sees the creator - a rollback on a throw leaves no client behind.

## Resume state

- **Done so far:** built 2026-10-11; see [implemented.md](implemented.md).
- **Next action:** the check by hand in VS Code.
- **Open questions:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/agent-claude` pass.
- [ ] A VS Code tool with a nested object argument runs from a Claude session on the first turn.
- [x] `plans/index.md` updated.
