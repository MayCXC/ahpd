---
title: A webhook talks to a bot or fires an automation
domain: plugin
status: draft
priority: medium
created: 2026-10-13
revalidated: 2026-10-13
requires:
  - plans/plugin/21-a-plugin-serves-an-http-route/plan.md
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
  - plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p1-the-host-gives-a-record-store/plan.md
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L801](../../../../packages/sdk/src/types/plugin.ts#L801) - `registerRoute`, which serves `/plugins/<name>/` on the daemon port; no plugin uses it yet"
  - "[code://packages/sdk/src/types/plugin.ts#L828-L842](../../../../packages/sdk/src/types/plugin.ts#L828-L842) - `registerTriggerType` and `fireTrigger`"
  - "[code://packages/sdk/src/host/automations.ts#L1135](../../../../packages/sdk/src/host/automations.ts#L1135) - the fire's `data` is kept on the run's origin, and nothing reads it"
  - "[code://packages/sdk/src/wakemessage.ts#L34-L62](../../../../packages/sdk/src/wakemessage.ts#L34-L62) - the `{{word}}` filler of a wake message, to reuse for the event's fields"
  - "[code://packages/sdk/src/types/plugin.ts#L586](../../../../packages/sdk/src/types/plugin.ts#L586) - `secret()`, which reads a vault secret by name"
  - "[code://packages/sdk/src/types/plugin.ts#L629](../../../../packages/sdk/src/types/plugin.ts#L629) - `records()`, where the endpoints and the thread map are kept"
  - "[code://packages/sdk/src/types/plugin.ts#L669](../../../../packages/sdk/src/types/plugin.ts#L669) - `connect()`, how a plugin sends a turn and hears its end, as push does"
---

## Goal

A program outside the host can talk to a bot or fire an automation by calling a URL.
A call to a bot carries a thread id, and the next call with the same thread id continues the same chat.
A call to an automation starts a run, and the run's prompt can name the fields of the call.
Each endpoint has its own secret, so the host knows the caller.
This is the first initiator from [the idea](../../../ideas/initiators-start-sessions.md); issue and chat initiators come later on the same shape.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "registerRoute\(" packages` - the host serves routes, and no plugin registers one.
- `rg "registerTriggerType\(" packages` - no plugin registers a trigger type.
- `rg "origin.event" packages/sdk/src` - nothing reads the fire's data after the run starts.

### Runtime path

```
POST /plugins/webhook/<endpoint> + bearer -> route -> endpoint record -> bot: thread map -> chat -> turn -> reply
                                                                      -> automation: fireTrigger -> run prompt with {{event.<field>}}
```

### Gaps

- No plugin serves a webhook.
- A run cannot read the event that fired it.
- The host has no listener for public routes only.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| One plugin serves both kinds: a webhook to a bot, and a webhook to an automation | Softov, 2026-10-13, "Both in one plugin" | 01 |
| Each endpoint has its own secret, named in the vault, sent as a bearer header | Softov, 2026-10-13, "Secret per endpoint" | 01 |
| The port is configurable; the default is the daemon port, and the other value is a listener for public routes only | Softov, 2026-10-13, "configurable, default daemon port" | 04 |
| The reply is configurable; the default is a callback URL at turn end, and the other values are a synchronous answer and none | Softov, 2026-10-13, "configurable, default to callback url" | 02 |
| A thread id maps to one chat of the bot's session, kept in the plugin's records | The idea: a mapping kept so the next event finds the same session | 02 |
| A callback URL must start with a prefix set on its endpoint | (defaulted: else a caller makes the host call any address) | 02 |
| A synchronous reply ends at a timeout and says the turn still runs | (defaulted: a turn can wait for a person) | 02 |
| A run's prompt names the event's fields as `{{event.<field>}}`, with the wake filler | (defaulted: reuse the one filler the host has) | 03 |

## Proposed architecture

- **Data flow** - An endpoint record names its target, a bot or an automation, its secret and its reply. The route reads the record, checks the bearer, and acts.
- **Event flow** - For a bot, the plugin sends the body as a turn through its own client connection, and hears the turn end to reply. For an automation, it calls `fireTrigger`.
- **State flow** - The thread map lives in the plugin's records, so it survives a restart.
- **Layer responsibilities** - webhook, a new package: endpoints, route, thread map, reply · sdk: event fields in a prompt, public listener · docs.
- **Source-of-truth files** - `packages/webhook/src/plugin.ts` (new), [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| 01 - The webhook plugin keeps endpoints and checks the caller | not written | - |
| 02 - A webhook talks to a bot by thread | not written | 01 |
| 03 - A webhook fires an automation, and the run reads the event | not written | 01 |
| 04 - Routes can listen on a public port of their own | not written | 01 |

## Risks and tradeoffs

- A callback URL lets a caller make the host call any address - The callback must match a prefix set on the endpoint.
- A turn can wait for a person - The synchronous reply ends with a timeout and says the turn is still running.
- The public listener is a second socket - It serves `/plugins/*` only and never AHP.

## Resume state

- **Done so far:** the plan, 2026-10-13.
- **Next action:** write the four task files.
- **Open questions:** none.
- **Watch out for:** the plugin acts as `plugin:webhook`; it must start a turn in a bot's session with the grants the operator gave it.

## Final verification checklist

- [ ] `pnpm vitest run packages/webhook packages/sdk` passes.
- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `plans/index.md` updated.
