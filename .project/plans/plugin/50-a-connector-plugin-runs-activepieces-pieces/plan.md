---
title: A connector plugin runs Activepieces pieces as tools
domain: plugin
status: draft
priority: medium
created: 2026-10-13
revalidated: 2026-10-13
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
decisions:
refs:
  - "[code://packages/sdk/src/types/host.ts#L676](../../../../packages/sdk/src/types/host.ts#L676) - `forSession`, which sees only `titleStrategy`, so a tool cannot be offered per session"
  - "[code://packages/sdk/src/host/tooling.ts#L310](../../../../packages/sdk/src/host/tooling.ts#L310) - one caller of `forSession`"
  - "[code://packages/sdk/src/host/tooling.ts#L1372](../../../../packages/sdk/src/host/tooling.ts#L1372) - the other caller, in the offered tools"
  - "[code://packages/sdk/src/types/plugin.ts#L586](../../../../packages/sdk/src/types/plugin.ts#L586) - `secret()`, read only; a connection names a secret the person put in the vault"
  - "[code://packages/sdk/src/types/plugin.ts#L686](../../../../packages/sdk/src/types/plugin.ts#L686) - `registerSessionConfig`, the session key that names connections"
  - npm://@activepieces/pieces-framework@0.32.0 - the shape of a piece; an action's `run(context)` is callable outside the engine
  - https://github.com/activepieces/activepieces - the community pieces are MIT
---

## Goal

A person installs an Activepieces piece, adds a connection with its key, and a bot or a session gets the piece's actions as tools.
Two connections of one piece are two accounts, so one bot can use two accounts, or two bots one each.
The plugin runs the pieces in a child process, with no Activepieces server and no Docker.
This plan covers a piece whose auth is a secret text; OAuth and Instagram come in the next plan.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
The [connectors idea](../../../ideas/connectors-come-from-activepieces-pieces.md) has the probe of 2026-10-06 and the piece's shape.

### Searches performed

- `rg "forSession" packages/sdk/src` - two callers, both pass only the title strategy.
- `rg "NODE_TLS_REJECT_UNAUTHORIZED" node_modules/@activepieces` - the bundled http client sets it on every request.

### Runtime path

```
session offered tools -> forSession(session) -> connections of the bot or the session key -> tool call -> child process -> piece action run(context) -> answer
```

### Gaps

- A tool cannot be offered to one session and not another.
- A piece turns off TLS checks for the whole process, so it cannot run in the daemon.
- No plugin loads a piece.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A plugin may contribute a session config key](../../../../docs/PLUGINS.md) | The decision file |
| 2 | [A secret is named in the host's, a team's or a person's scope](../../../../docs/DAEMON.md) | The decision file |

| What | Source | Task |
| --- | --- | --- |
| The first piece needs only a secret-text key; OAuth and Instagram come in the next plan | Softov, 2026-10-13, "A secret-text piece" | 03 |
| A connection binds to a bot, or to a session config key | Softov, 2026-10-13, "A bot, or a session key" | 04 |
| Tools are offered per session, so `forSession` sees the session | Softov, 2026-10-13, "A bot, or a session key" | 01 |
| A connection names a vault secret, so the plugin writes no secret | (defaulted: `secret()` is read only, and a write waits on vault 02) | 03 |
| The pieces run in a child process, with `NODE_TLS_REJECT_UNAUTHORIZED` pinned | The idea: a piece turns off TLS checks for its process | 02 |
| A piece is installed by naming its package in the plugin's options | (defaulted: no new command) | 02 |

## Proposed architecture

- **Data flow** - A connection record holds the piece, a name, the secret's name and its binding. A tool is `<connection>__<action>`, and its input schema comes from the action's props.
- **Event flow** - A tool call goes to the child process with the action, the props and the secret's value. The child calls `run(context)` and sends back the answer.
- **Layer responsibilities** - sdk: `forSession` sees the session's uri and config · connector-activepieces, a new package: pieces, connections, child process · docs.
- **Source-of-truth files** - [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts), `packages/connector-activepieces/src/plugin.ts` (new)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| 01 - A tool is offered per session | not written | - |
| 02 - The plugin runs a piece in a child process | not written | - |
| 03 - A connection holds a secret-text key | not written | 02 |
| 04 - A bot or a session key chooses its connections | not written | 01, 03 |

## Risks and tradeoffs

- A piece is npm code that runs on this host - The person names each package, and a call gets only its own secret.
- Each piece's license must be checked - The plugin reads the package license and refuses a piece with none.
- The pieces framework changes its context shape - Pin the framework version the child builds the context for.

## Resume state

- **Done so far:** the plan, 2026-10-13.
- **Next action:** choose the first piece, then write the four task files.
- **Open questions:** none.
- **Watch out for:** `forSession` runs on every tool list; it must not read the disk.

## Final verification checklist

- [ ] `pnpm vitest run packages/connector-activepieces packages/sdk` passes.
- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- [ ] `plans/index.md` updated.
