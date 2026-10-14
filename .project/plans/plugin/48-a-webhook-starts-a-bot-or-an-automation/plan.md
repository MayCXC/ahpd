---
title: A webhook talks to a bot or fires an automation
domain: plugin
status: active
priority: medium
created: 2026-10-13
revalidated: 2026-10-14
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
POST /plugins/%40ahpd/webhook/<endpoint> + bearer -> route -> endpoint record -> bot: thread map -> chat -> turn -> reply
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
| An automation's trigger names the endpoint: its `config` holds `endpoint: <id>`, the host matches `config` against the fire's data in `fired`, and a client form offers the field | Softov, 2026-10-14, asked "How does a webhook call reach one automation?": "Automation names the endpoint" | 03 |
| A bot call is a JSON body `{ thread, text, callback }`; any other body is the raw text, with `thread` and `callback` from the query | Softov, 2026-10-14, asked "Where does a call to a bot carry its thread, text and callback?": "JSON body, with query fallback" | 02 |
| A synchronous reply waits for the plugin option `syncTimeoutSeconds`, default 60, and an endpoint field of the same name overrides it | Softov, 2026-10-14, asked "How long does a sync reply wait, and where is it set?": "Endpoint field, plugin default 60 s" | 02 |
| A bot turn that ends in `chat/error` is reported: the host's `turn_end` carries `status: 'error'` and the error's message, a `sync` call answers with them, and a callback posts them | Softov, 2026-10-14, to "A webhook bot turn that ends in an error raises no turn_end. What should happen?" - "Report the failure" | 02 |
| A `sync` call answers a failed turn with HTTP 502, and a cancelled turn with 200 | Softov, 2026-10-14, to "What HTTP code should that answer use?" - "502" | 02 |
| A call whose chat the host refuses, because the plugin lacks `session:write`, answers 409, and the plugin reports a problem that names `session:write` | Softov, 2026-10-14, to "When the plugin lacks `session:write`, `createChat` throws and the call answers 500. Should that be 409, like a bot the plugin may not read?" - "409, like a bot it cannot read" | 02 |
| `fired` compares only the `config` keys that the fire's data also holds; a `config` key the data does not hold never blocks a run | Softov, 2026-10-14, to "`fired` compares every key of a trigger's `config` with the fire's data. A plugin whose form holds a setting that is not a data field would never run. Should the match cover only the keys that the data holds?" - "Only keys the data has" | 03 |

## Proposed architecture

- **Data flow** - An endpoint record names a bot or marks itself as an automation endpoint, and names its secret and its reply. An automation's trigger names the endpoint in its `config`. The route reads the record, checks the bearer, and acts.
- **Event flow** - For a bot, the plugin sends the body as a turn through its own client connection, and hears the turn end to reply. For an automation, it calls `fireTrigger`.
- **State flow** - The thread map lives in the plugin's records, so it survives a restart.
- **Layer responsibilities** - webhook, a new package: endpoints, route, thread map, reply · sdk: event fields in a prompt, public listener · docs.
- **Source-of-truth files** - `packages/webhook/src/plugin.ts` (new), [`code://packages/sdk/src/host/automations.ts`](../../../../packages/sdk/src/host/automations.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The webhook plugin keeps endpoints and checks the caller](task-01-the-webhook-plugin-keeps-endpoints-and-checks-the-caller.md) | implemented | - |
| [02 - A webhook talks to a bot by thread](task-02-a-webhook-talks-to-a-bot-by-thread.md) | implemented | 01 |
| [03 - A webhook fires an automation, and the run reads the event](task-03-a-webhook-fires-an-automation-and-the-run-reads-the-event.md) | implemented | 01 |
| [04 - Routes can listen on a public port of their own](task-04-routes-can-listen-on-a-public-port-of-their-own.md) | implemented | 01 |

## Risks and tradeoffs

- A callback URL lets a caller make the host call any address - The callback must match a prefix set on the endpoint.
- A turn can wait for a person - The synchronous reply ends with a timeout and says the turn is still running.
- The public listener is a second socket - It serves `/plugins/*` only and never AHP.

## Resume state

- **Done so far:** the plan, 2026-10-13, and its four tasks with the answers, 2026-10-14. All four tasks are implemented, 2026-10-14, and await review.
- **Next action:** Softov reviews the four tasks.
- **Open questions:** none. Softov answered the three planning questions and the build questions of tasks 02 and 03 on 2026-10-14.
- **Watch out for:**
  - The plugin acts as `plugin:@ahpd/webhook`, and its route is `/plugins/%40ahpd/webhook/<endpoint>`, because a plugin's id is its package name. It needs the grants that the operator gives it to read a bot, create a chat and send a turn.
  - The fire's data is kept on the run's origin, which other readers of the run see. A webhook body must carry no secret.
  - A `webhook` trigger with no `config` matches every fire of its event. The form requires `endpoint`, but the host does not refuse a trigger without it.
  - An endpoint is a hand-edited record file. The plan names no scheme or command that makes one.

## Final verification checklist

- [ ] `pnpm exec vitest run packages/webhook packages/sdk packages/server` passes.
- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- [ ] `plans/index.md` updated.
