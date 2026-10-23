---
title: A connector action runs as a tool
domain: host
status: active
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires:
  - plans/plugin/53-a-client-sees-plugins-and-connectors/plan.md
changes:
  - specs/host-tools.md
  - specs/bots.md
creates: []
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L1-L12](../../../../packages/sdk/src/types/connectors.ts#L1-L12) - the header says that nothing runs a capability, and that an action as a tool is a later plan"
  - "[code://packages/sdk/src/types/connectors.ts#L25-L49](../../../../packages/sdk/src/types/connectors.ts#L25-L49) - `Capability`, with the `input` schema of an action"
  - "[code://packages/sdk/src/types/connectors.ts#L101-L120](../../../../packages/sdk/src/types/connectors.ts#L101-L120) - `Adapter`, which has `open` and no way to run an action"
  - "[code://packages/sdk/src/connectors/channel.ts#L94-L112](../../../../packages/sdk/src/connectors/channel.ts#L94-L112) - `ConnectorsChannel`, the port the host reads connectors through"
  - "[code://packages/sdk/src/connectors/channel.ts#L274-L282](../../../../packages/sdk/src/connectors/channel.ts#L274-L282) - `mayRead`, the check a call makes for the session's owner"
  - "[code://packages/sdk/src/connectors/channel.ts#L312-L348](../../../../packages/sdk/src/connectors/channel.ts#L312-L348) - `resolved` reads the secrets back, and `openOne` opens a connector with them"
  - "[code://packages/sdk/src/types/host.ts#L145-L152](../../../../packages/sdk/src/types/host.ts#L145-L152) - `HostOptions.adapters`, the adapters the fold gives the host"
  - "[code://packages/sdk/src/types/host.ts#L800-L808](../../../../packages/sdk/src/types/host.ts#L800-L808) - `forSession`, which sees only `titleStrategy` today"
  - "[code://packages/sdk/src/host/tooling.ts#L379-L395](../../../../packages/sdk/src/host/tooling.ts#L379-L395) - `permitted` and `contributed`, where the host builds its tool set"
  - "[code://packages/sdk/src/host/tooling.ts#L440-L463](../../../../packages/sdk/src/host/tooling.ts#L440-L463) - `contributingTo` and `shapedDefinition`, the filter for each session"
  - "[code://packages/sdk/src/host.ts#L1242-L1247](../../../../packages/sdk/src/host.ts#L1242-L1247) - `setTools` replaces `contributed`, so the action tools must not live there"
  - "[code://packages/sdk/src/types/sessions.ts#L173-L174](../../../../packages/sdk/src/types/sessions.ts#L173-L174) - `config(id)`, the settings a session runs under, which the host keeps"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L241](../../../../packages/sdk/src/host/sessionconfig.ts#L241) - `hostSchema`, the host's own session config keys"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1358](../../../../packages/sdk/src/host/lifecycle.ts#L1358) - `principalFor` of a session's owner, the pattern for the live check"
  - "[code://packages/sdk/src/automations/automations.ts#L310-L345](../../../../packages/sdk/src/automations/automations.ts#L310-L345) - `checkReferences` and `x-ahpd-connector`, the pattern for a field that names a connector"
  - "[code://packages/sdk/src/plugins/validate.ts#L535-L565](../../../../packages/sdk/src/plugins/validate.ts#L535-L565) - `checkAdapter`, which checks each capability"
  - "[code://packages/server/src/commands/run.ts#L702-L720](../../../../packages/server/src/commands/run.ts#L702-L720) - the daemon builds the connectors channel"
  - "[code://packages/server/src/commands/run.ts#L1166](../../../../packages/server/src/commands/run.ts#L1166) - the adapters the fold gave"
  - "[code://packages/bot/src/record.ts#L89-L122](../../../../packages/bot/src/record.ts#L89-L122) - `BotKept`, which has no connector field"
  - "[code://packages/bot/src/record.ts#L189-L200](../../../../packages/bot/src/record.ts#L189-L200) - `FIELDS`, the keys a bot body may carry"
  - "[code://packages/bot/src/wake.ts#L202-L215](../../../../packages/bot/src/wake.ts#L202-L215) - `sessionFor`, the request a bot starts a session with"
  - "[code://docs/plugins/PLUGINS.md#L500-L540](../../../../docs/plugins/PLUGINS.md#L500-L540) - \"An adapter of your own\", the docs this plan extends"
---

## Goal

A connector's `action` capability runs as a tool, for a session or a bot that binds the connector.
The tool belongs to the adapter, so one tool serves every connector of that adapter.
A session names its connectors by an alias, and the model names the alias, never the connector.
The host resolves the alias, checks the binding live on every call, and keeps the credentials away from the model.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
This plan is the host half that [plugin/50](../../plugin/50-a-connector-plugin-runs-activepieces-pieces/plan.md) needs: the Activepieces adapters declare actions, and this plan runs them.

### Searches performed

- `rg -n "registerAdapter|ServedAdapter" packages/sdk/src` - adapters reach the host as `HostOptions.adapters`, and only the connectors channel opens them.
- `rg -n "forSession" packages/sdk/src` - three readers in `tooling.ts`, and each one passes only the title strategy.
- `rg -n "setTools" packages/sdk/src` - `setTools` replaces `contributed` whole, so a tool built from the adapters must be kept beside it.
- `rg -n "config\(id" packages/sdk/src/types/sessions.ts` - the host keeps the config a session runs under, by session id.
- `rg -n "x-ahpd-connector" packages` - the one pattern for a value that names a connector, checked at save.

### Runtime path

```
fold -> HostOptions.adapters -> host builds one tool for each action capability
session list -> forSession({ config }) -> offered only with a compatible binding -> connector enum, or none for one binding
tool call -> alias -> session config.connectors -> connectors://<adapter>/<id> -> channel.run(id, owner) -> live checks -> adapter.run -> answer
```

### Gaps

- `Adapter` has no way to run an action.
- `forSession` sees only the title strategy, so a tool cannot be offered by the session's bindings.
- No session config key names connectors, and a bot record has no connector field.
- The connectors channel keeps the stop function of an open connector, and not the connector it opened.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The tool belongs to the adapter, and the connector gives the identity, the credentials and the configuration | Softov, 2026-10-23, "The tool belongs to the connector kind. The connector instance provides the identity, credentials, and configuration." | 03 |
| The host registers each action tool once, at load | Softov, 2026-10-23, "Register tools once." | 03 |
| A session sees a tool only with a compatible binding | Softov, 2026-10-23, "Filter by bindings. A session sees the tool only if it has access to at least one compatible connector." | 03 |
| The host resolves the alias, and no credential reaches the model | Softov, 2026-10-23, "Resolve server-side. The connector argument identifies a bound instance; credentials never reach the model." | 03 |
| The host checks the binding on every call | Softov, 2026-10-23, "Validate authorization per call. Never trust the connector name supplied by the model without checking the session's permissions." | 01, 03 |
| With one compatible binding, the schema has no `connector` argument, and the host fills it | Softov, 2026-10-23, "Handle single bindings automatically. If only `work` is bound, you can omit the connector argument from the model-facing schema and inject it internally." | 03 |
| A binding is an alias, so two bots can bind one account under two names | Softov, 2026-10-23, "Rather than using the connector's global name, expose a binding alias." Example `{ connectors: { work: "connectors://resend/account-123", personal: "connectors://resend/account-456" } }`. "This enables two bots to bind the same account under different names." | 02 |
| No tool for each binding | Softov, 2026-10-23, "I would not create `work_send_email` and `personal_send_email`." | 03 |
| A session that a bot starts takes the bot's bindings, and each call checks them live | Softov, 2026-10-23, "I lean toward inherited bindings with authorization checked live, so revoking an account takes effect immediately." | 01, 04 |
| One tool for each adapter action, with binding aliases and the host's resolve | Softov, 2026-10-23, "Final choice: Option 1, with binding aliases and server-side connector resolution." | 03 |
| Bindings come from a bot record field and from a session config key | Softov, 2026-10-13, plan 50, "A bot, or a session key" | 02, 04 |
| An adapter runs an action through `run?(connector, action, input)`, which answers a promise of the result | (defaulted: one optional member beside `open`, and an adapter with no `run` offers no action tool) | 01 |
| The channel keeps the connector it opened beside its stop, and a call uses that connector | (defaulted: a call uses what `open` got, and a put that opens it again replaces it) | 01 |
| A call checks that the connector exists, is open, is of the tool's adapter, and that the session's owner passes `mayRead` | (defaulted: the four facts a revoke or a remove changes) | 01 |
| The session config key is `connectors`, an object from alias to `connectors://<adapter>/<id>` | (defaulted: Softov's example of 2026-10-23) | 02 |
| An alias is a lowercase slug, and the key is set when the session starts | (defaulted: `sessionMutable: false`, like the host's other keys; a later plan can make it editable) | 02 |
| `forSession` also sees the session's config | (defaulted: one more field on its argument, and the title strategy stays) | 02 |
| A tool's name is `<adapter>_<action>`, with each character outside `[A-Za-z0-9_]` written as `_` | (defaulted: `ap-resend` and `send_email` give `ap_resend_send_email`) | 03 |
| Two actions that give one tool name keep the first, and the host reports the second | (defaulted: the fold reports a duplicate adapter the same way) | 03 |
| With two or more compatible bindings, `connector` is a required string with an `enum` of the aliases | (defaulted: the model sees the names it may use) | 03 |
| An action tool is not opt-in, and a binding is what offers it | (defaulted: a session with no binding sees no action tool) | 03 |
| A failed check answers an error that names the alias and the reason, and never the connector id | (defaulted: the alias is the model's own name for it) | 03 |
| The action tools live beside `contributed`, so `setTools` keeps them | (defaulted: `setTools` replaces the host's own set, and the adapters do not change while the daemon runs) | 03 |
| A bot keeps `connectors` in its record, and a session it started reads the bot's current map live, so a bot edit reaches a running session | Softov, 2026-10-23, chose "Yes, read live" for "If you later change the bot's bindings, should a session that is already running see the change?" | 02, 04 |
| A plugin answers a session's bindings through `registerBindings(read)`, a synchronous reader the host asks at each tool list and each call | (defaulted: `forSession` is synchronous, and the sdk does not read a bot record) | 02, 04 |
| The host reads connector refs through `HostOptions.connectors`, which task 02 adds as `{ refs }` and task 03 extends with `run`; the server passes `connectorLists.refs()` | (defaulted: the automation store reads the same listing, `code://packages/server/src/commands/run.ts`) | 02, 03 |
| A session's bindings are the plugin readers' maps and the session's `connectors` key; on a shared alias, the session key wins | (defaulted: a key the session was started with is the most specific) | 02 |
| A removed binding fails at the next call; an added one shows in the next tool list that the host builds for the session | (defaulted: a backend binds its tools when it builds the list) | 03, 04 |
| A session that a session creates does not take its parent's bindings | (defaulted: out of scope, and the child can name its own) | - |
| A UI or a tool that edits bindings is out of scope | Softov's directive, 2026-10-23 | - |

## Proposed architecture

- **Data flow** - A session's config holds `connectors: { <alias>: "connectors://<adapter>/<id>" }`. A bot record holds the same map, and the bot plugin answers it for each session it started, through `registerBindings`.
- **Event flow** - At load, the host builds one `HostTool` for each `action` capability of each adapter that has `run`. On a call, the tool reads the alias, resolves it from the session's bindings, read live, and calls `ConnectorsChannel.run` with the owner's principal.
- **State flow** - The channel keeps each open connector beside its stop. A remove or a close takes it out, so the next call fails at once.
- **Layer responsibilities** - sdk: `Adapter.run`, the live checks, the tools and the key · server: the wiring · bot: the field and the reader · docs.
- **Source-of-truth files** - [`code://packages/sdk/src/types/connectors.ts`](../../../../packages/sdk/src/types/connectors.ts), [`code://packages/sdk/src/connectors/channel.ts`](../../../../packages/sdk/src/connectors/channel.ts), [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An adapter runs an action](task-01-an-adapter-runs-an-action.md) | implemented | - |
| [02 - A session names its connectors](task-02-a-session-names-its-connectors.md) | implemented | - |
| [03 - An action is a host tool](task-03-an-action-is-a-host-tool.md) | implemented | 01, 02 |
| [04 - A bot binds its connectors](task-04-a-bot-binds-its-connectors.md) | implemented | 02 |
| [05 - The docs say how an action runs](task-05-the-docs-say-how-an-action-runs.md) | implemented | 03, 04 |

## Risks and tradeoffs

- A model can name an alias of another session - The tool reads only this session's config, and the channel checks the owner on every call.
- An added binding waits for the next tool list - A removal and a revoke take effect at the next call.
- An action's answer can hold data from the account - The host passes the answer on, and the adapter must not echo a secret.
- `forSession` runs on every tool list - It reads the kept config and the readers' maps in memory, and never the disk or the vault.

## Resume state

- **Done so far:** the plan, 2026-10-23. Every task, 01 to 05, is implemented.
- **Next action:** the final verification checklist, by hand.
- **Open questions:** a bot's session is not handed the action tools at the list its backend is started with: the session's URI is minted inside `host.startSession`, which spawns before it answers, so the reader cannot know which bot owns the session at that first list. Every list after it has them. Task 04's Resume has the two ways out, and both are forks the Answers table does not settle.
- **Watch out for:** the three `forSession` readers in `tooling.ts`, for the definitions, the bound tools and the instructions, must all pass the config. And the bot plugin's `filled` read opens each bot's `sessions` collection when the plugin applies, which is the first thing that does.

## Final verification checklist

- [ ] A session bound to `work` sees `<adapter>_<action>` with no `connector` argument, and a call runs on that connector.
- [ ] A session bound to `work` and `personal` sees one tool with a `connector` enum of the two aliases.
- [ ] A session with no compatible binding does not see the tool.
- [ ] A call after the connector is removed, or after its owner loses `connector:list`, answers an error.
- [ ] A bot with `connectors` starts a session that has them.
- [ ] `specs/host-tools.md`, `specs/bots.md`, `docs/plugins/PLUGINS.md` and `plans/index.md` updated.
