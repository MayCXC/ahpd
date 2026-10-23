---
title: A bot session starts with its actions
domain: host
status: planned
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires:
  - plans/host/118-a-connector-action-runs-as-a-tool/plan.md
refs:
  - "[code://packages/sdk/src/host/automations.ts#L686-L697](../../../../packages/sdk/src/host/automations.ts#L686-L697) - `beginSession` names the URI, then makes the tree and spawns"
  - "[code://packages/sdk/src/host/automations.ts#L969-L970](../../../../packages/sdk/src/host/automations.ts#L969-L970) - `startForPlugin`, the plugin's road into `beginSession`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1128-L1135](../../../../packages/sdk/src/plugins/plugins.ts#L1128-L1135) - the plugin's `startSession`, checked here and started there"
  - "[code://packages/sdk/src/types/plugin.ts#L230](../../../../packages/sdk/src/types/plugin.ts#L230) - `PluginStarts.start`"
  - "[code://packages/sdk/src/types/plugin.ts#L851](../../../../packages/sdk/src/types/plugin.ts#L851) - `PluginHost.startSession`"
  - "[code://packages/sdk/src/host/tooling.ts#L495-L510](../../../../packages/sdk/src/host/tooling.ts#L495-L510) - `sessionBindings` asks each plugin's reader when it builds a tool list"
  - "[code://packages/bot/src/wake.ts#L340-L343](../../../../packages/bot/src/wake.ts#L340-L343) - the bot learns its session's URI only after the start answers"
  - "[code://packages/bot/src/wake.ts#L396-L412](../../../../packages/bot/src/wake.ts#L396-L412) - `bindings`, the bot's reader, which needs the URI in `started`"
---

## Goal

A session that a bot starts has the bot's connector actions in its first tool list.
Today the first list has none of them, so a bot cannot use a connector in its first turn.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "retool\(" packages/sdk/src` - a setting change, a client that leaves, a session made with an active client, and an automation retool. Nothing retools a bot's session after its start.
- `rg "started\.set" packages/bot/src` - the bot fills the map after the start answers, and when the wake is built.

### Runtime path

```
bot wake -> host.startSession -> beginSession names the URI -> spawn -> first tool list -> sessionBindings -> bot reader -> undefined
```

### Gaps

- The host builds the first tool list before the plugin knows the session's URI.
- The bot's reader answers nothing for a URI it does not know, so the list has no action tools.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host tells the plugin the session's URI at the start, so the first tool list has the action tools | Softov, 2026-10-23, chose "Host door at start" | 01, 02 |
| The door is a second argument to `startSession`: a function the host calls with the URI before it makes the tree or spawns | (defaulted: the one road a plugin's start takes) | 01 |
| A start that fails after the call removes the bot's entry for that URI | (defaulted: the session does not exist, so it has no owner) | 02 |
| `sessionFor` does not name the connectors in the config | [code://packages/bot/src/wake.ts#L212-L225](../../../../packages/bot/src/wake.ts#L212-L225) and host 118 task 04, a config key wins a shared alias over the reader | 02 |

## Proposed architecture

- **Data flow** - the URI goes from `beginSession` to the plugin before the spawn, and the bot keeps it in `started`.
- **Event flow** - no new event. The first tool list asks the reader, as every list does.
- **State flow** - the bot's `started` map, as now. It is filled earlier.
- **Layer responsibilities** - sdk host: call the door with the URI. bot: keep the URI under the bot.
- **Source-of-truth files** - [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts), [`code://packages/bot/src/wake.ts`](../../../../packages/bot/src/wake.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host names a plugin's session first](task-01-the-host-names-a-plugins-session-first.md) | todo | - |
| [02 - A bot owns its session from the start](task-02-a-bot-owns-its-session-from-the-start.md) | todo | 01 |

## Risks and tradeoffs

- The door runs inside the host's start - the host catches a throw from it and reports it, and the start goes on.
- A running session sees an edit to its bot's connectors at its next retool - a revoke works at once, because each call checks the binding.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-host-names-a-plugins-session-first.md](task-01-the-host-names-a-plugins-session-first.md).
- **Open questions:** none.
- **Watch out for:** do not seed `config.connectors` in `sessionFor`. Call the door before `isolated`, because the tree can take seconds and the spawn follows it.

## Final verification checklist

- [ ] A bot bound to `work` starts a session whose first tool list has the `work` action.
- [ ] A start that fails leaves no entry in `started`.
- [ ] `plans/index.md` updated.
