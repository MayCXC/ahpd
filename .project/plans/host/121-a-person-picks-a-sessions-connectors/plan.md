---
title: A person picks the connectors a session may use
domain: host
status: planned
priority: medium
created: 2026-10-24
revalidated: 2026-10-24
requires:
  - plans/host/118-a-connector-action-runs-as-a-tool/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/connectors/bindings.ts#L61-L106](../../../../packages/sdk/src/connectors/bindings.ts#L61-L106) - `bindingsOf` and `checkBindings`, which read only the alias map"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L236-L244](../../../../packages/sdk/src/host/sessionconfig.ts#L236-L244) - `connectors` declared as a map with `sessionMutable: false`"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L504-L519](../../../../packages/sdk/src/host/sessionconfig.ts#L504-L519) - `isAliasMap` and `mineOf`, which say the key back only as a map"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1486](../../../../packages/sdk/src/host/sessionmethods.ts#L1486) - `scoping(connection.principal)`, the picker built for the person asking"
  - "[code://packages/sdk/src/host/tooling.ts#L512-L517](../../../../packages/sdk/src/host/tooling.ts#L512-L517) - the tool list reads the session's bindings as a map"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1707](../../../../packages/sdk/src/host/lifecycle.ts#L1707) - `createSession` checks the bindings"
  - "[code://packages/sdk/src/host/chatactions.ts#L681](../../../../packages/sdk/src/host/chatactions.ts#L681) - `session/configChanged`, the path a live change takes"
  - "[code://packages/sdk/src/connectors/channel.ts#L168](../../../../packages/sdk/src/connectors/channel.ts#L168) - `refs()`, every connector with its adapter and owner"
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the binding section under An action offered as a tool"
  - file:///github/ahp-review/briefs/session-connectors.md - the brief and its answers
---

## Goal

A person can pick connectors in the new-session form, and change them while the session runs. Today only a bot can bind a connector to a session. The host offers the picker in its session schema, so ahpw and ahpc draw it with no client change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "BINDINGS_KEY" packages/*/src` - read in `tooling.ts` and checked in `lifecycle.ts`, nowhere else.
- `rg "registerSessionConfig|enumDynamic" packages/sdk/src` - the contributed-key picker and the branch picker are the patterns.
- `rg "session/configChanged" packages/sdk/src/host` - one path for a running session, with a `sessionMutable` check.

### Runtime path

```
resolveSessionConfig -> connectors picker (own and host, with actions) -> createSession or session/configChanged -> checkBindings -> tool list -> tools changed
```

### Gaps

- `connectors` takes only a map, which a client form cannot draw.
- The host declares `connectors` but offers no values, so a client draws nothing to pick.
- `connectors` is `sessionMutable: false`, and a change is not checked against the owner.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A connector picked from a list has its id as its alias | Softov, 2026-10-24 ("The connector's id") | 01 |
| `connectors` takes the alias map as now, or a list of `connectors://` URIs | Softov, 2026-10-24 ("Take both") | 01 |
| A person can change the connectors of a running session | Softov, 2026-10-24 ("Live too") | 03 |
| The picker lists the connectors the person may read whose adapter has an `action` capability | Softov, 2026-10-24 ("Readable with actions") | 02 |
| Readable means the person's own and the host's, as `checkBindings` accepts. Team connectors are not listed | Softov, 2026-10-24 ("Own and host only") | 02 |
| A bot's `connectors` field stays a map | file:///github/ahp-review/briefs/session-connectors.md | - |
| ahpc `--set` with a JSON value is not in this plan | (defaulted: ahpc is another repository) | - |
| A picker row's label is the connector's title, then its id | (defaulted: the connectors page shows the title) | 02 |
| A change that names a connector the owner may not use is refused, and the old binding stays | (defaulted: as `createSession` refuses it) | 03 |

## Proposed architecture

- **Data flow** - the host reads `connectors` as a map or a list, and turns a list into a map with the id as alias. Every reader goes through that one function.
- **Event flow** - a `session/configChanged` with `connectors` is checked, kept, and followed by a new tool list for the session.
- **State flow** - the session config keeps what the client sent. Nothing new is stored.
- **Layer responsibilities** - sdk: the reading, the picker, the check and the change. docs: the binding section.
- **Source-of-truth files** - [`code://packages/sdk/src/connectors/bindings.ts`](../../../../packages/sdk/src/connectors/bindings.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The connectors key takes a list](task-01-the-connectors-key-takes-a-list.md) | todo | - |
| [02 - The session form offers connectors](task-02-the-session-form-offers-connectors.md) | todo | 01 |
| [03 - A running session changes its connectors](task-03-a-session-changes-its-connectors.md) | todo | 01 |
| [04 - The docs say how a person binds one](task-04-the-docs-say-how-a-person-binds.md) | todo | 02, 03 |

## Risks and tradeoffs

- A client must draw an `array` whose `items` carry an `enum` as a multi-select. If ahpw draws it as a list of text boxes, the cause is fixed in the form, not here.
- The connector id is the alias, so a model sees the id. The id is a slug the owner chose, not a secret.
- A live change ends no turn. A tool call running when the binding leaves fails at its next check, as for a bot edit.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-connectors-key-takes-a-list.md](task-01-the-connectors-key-takes-a-list.md).
- **Open questions:** none.
- **Watch out for:** `tooling.ts` reads the bindings itself, not through `bindingsOf`. Move it to the shared reader, or a list binds nothing.

## Final verification checklist

- [ ] In ahpw, a new session offers the Telegram connector, and the session's model gets its tools.
- [ ] A running session that removes the connector loses its tools at the next tool list.
- [ ] `plans/index.md` updated.
