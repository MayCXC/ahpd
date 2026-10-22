---
title: A client sees the plugins and the connectors
domain: plugin
status: active
priority: medium
created: 2026-10-21
revalidated: 2026-10-21
requires:
  - plans/plugin/44-a-plugin-serves-a-channel/plan.md
  - plans/plugin/48-a-webhook-starts-a-bot-or-an-automation/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L654-L1033](../../../../packages/sdk/src/types/plugin.ts#L654-L1033) - `PluginHost`, every register method a contract names"
  - "[code://packages/sdk/src/types/plugin.ts#L1047](../../../../packages/sdk/src/types/plugin.ts#L1047) - `Plugin`, the module export a file plugin adds its manifest to"
  - "[code://packages/sdk/src/plugins/plugins.ts#L804](../../../../packages/sdk/src/plugins/plugins.ts#L804) - `pluginHost`, where each register method calls `open()` first"
  - "[code://packages/server/src/plugins.ts#L276-L361](../../../../packages/server/src/plugins.ts#L276-L361) - `Manifest`, `readManifest` and `checkManifest`, the `ahpd` field of package.json today"
  - "[code://packages/server/src/plugins.ts#L771-L973](../../../../packages/server/src/plugins.ts#L771-L973) - `loadOne`, which reads the module and calls `pluginHost`"
  - "[code://packages/server/src/plugins.ts#L1197-L1240](../../../../packages/server/src/plugins.ts#L1197-L1240) - `PluginRow` and `describePlugin`, the listing `ahpd plugin list` prints"
  - "[code://packages/server/src/commands/plugin.ts#L401-L438](../../../../packages/server/src/commands/plugin.ts#L401-L438) - `enable`, `disable` and `set`, what the plugin methods call"
  - "[code://packages/server/src/commands/run.ts#L632-L647](../../../../packages/server/src/commands/run.ts#L632-L647) - `servedRecords('ahpd', ...)`, where the daemon serves its own channels"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L72](../../../../packages/sdk/src/resources/recordschannel.ts#L72) - `recordsChannel`, with `ownerOf` and `?owner=me`, the listing pattern both channels reuse"
  - "[code://packages/server/src/records.ts#L118-L130](../../../../packages/server/src/records.ts#L118-L130) - `fileRecords`, which writes only `.md` today"
  - "[code://packages/sdk/src/types/vault.ts#L18-L26](../../../../packages/sdk/src/types/vault.ts#L18-L26) - `Vault.set`, where a connector's secret is written"
  - "[code://packages/webhook/src/plugin.ts#L217-L226](../../../../packages/webhook/src/plugin.ts#L217-L226) - the trigger type, the `webhooks` records and the route"
  - "[code://packages/webhook/src/record.ts#L16-L31](../../../../packages/webhook/src/record.ts#L16-L31) - `Endpoint`, the fields the `webhook` kind's schema holds"
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the registration kinds and the `ahpd` field"
---

## Goal

A client shows what each plugin adds before a person uses it.
A plugin declares a manifest: a description, categories, links, and a contract for each kind it registers.
The host refuses a registration that the contracts do not list.
A client lists the installed plugins on a channel, and enables, disables and configures them there.
A plugin registers connector kinds, and a person makes connectors of each kind from a client.
A connector kind declares its configuration as a JSON Schema, so a client draws the form.
It declares its capabilities, so a client shows what a connector does.
The webhook endpoint is the first connector kind.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "x-ahpd-plugins|x-ahpd-connectors" packages docs` - not found; a client sees a plugin only as the root configuration key `plugins.<id>`.
- `rg -n "registerConnector|connector" packages/sdk/src` - no connector kind exists.
- `rg -n "inside\?\.\w+" packages/server/src/plugins.ts` - the `ahpd` field holds only `entry`, `title` and `options`.
- `rg -n "records\('webhooks'\)" packages/webhook/src` - webhook endpoints are `.md` records that a person writes by hand.
- `rg -n "servedRecords\(" packages/server/src` - the daemon serves the people and policy channels through one call in `run.ts`.

### Runtime path

```
package.json ahpd | module manifest -> loadOne -> pluginHost(contracts) -> register* -> contract check
registerConnector(kind) -> contribution.connectors -> HostOptions.connectorKinds -> x-ahpd-connectors { kinds, connectors }
client -> x-ahpd/connectors/put -> schema check -> vault.set(secret) -> connectors/<id>.json -> kind.open(connector)
client -> x-ahpd-plugins -> PluginRow + manifest -> x-ahpd/plugins/enable | disable | options -> configuration file
```

### Gaps

- No manifest type and no contract check; a plugin can register any kind.
- No channel lists the plugins and their load state.
- No connector kind, no connector record, and no channel for them.
- The record store has no JSON collection.
- A webhook endpoint is a file a person writes by hand.

## Answers

| What | Source | Task |
| --- | --- | --- |
| An npm plugin declares its manifest in the `ahpd` field of package.json; a file plugin exports `manifest` from its module | Softov, 2026-10-21, "for a package.json to work. a plugin loaded by file need to register its manifest within the plugin registration" | 01 |
| The manifest fields are `description`, `categories`, `links` and `contracts`, beside `entry`, `title` and `options` | Softov, 2026-10-21, pointed at the shape of two manifests he wrote before | 01 |
| The fields go directly in `ahpd`, with no `ahpd.manifest` key | (defaulted: the `ahpd` field is already the manifest) | 01 |
| A package that has both uses package.json | (defaulted: one source for each plugin) | 01 |
| The SDK type is `PluginManifest` | (defaulted: the server's `Manifest` is the raw package.json read) | 01 |
| The contracts cover every register method, and an undeclared registration is refused | Softov, 2026-10-21, chose "Every register*" | 02 |
| A contract key is the plural of its kind: `agents`, `tools`, `channels`, `methods`, `routes`, `triggerTypes`, `connectors` and so on; ports are `ports: ["vault"]` | (defaulted: one key for each register method) | 02 |
| A route contract entry is `<method> <path>`, such as `post /:id` | (defaulted: a route is named by its method and its path) | 02 |
| A contract entry may end in `*`, such as `claude-*`, or be `*`, for names a plugin takes from its options | Softov, 2026-10-21, chose "Allow * patterns" | 02 |
| A plugin with no `contracts` loads as today, and the plugin channel marks it `undeclared` | (defaulted: third-party plugins keep working) | 02 |
| Every plugin package in this repository gets its contracts | (defaulted: the check proves itself on the plugins that ship) | 03 |
| The plugin channel lists, enables, disables and edits options; install, update and remove stay on the command line | Softov, 2026-10-21, chose "List + enable/options" | 04 |
| The plugin channel is `x-ahpd-plugins`, and its methods are `x-ahpd/plugins/enable`, `disable` and `options` | (defaulted: the names follow `x-ahpd-computers` and the records methods) | 04 |
| A change from a client applies as `ahpd plugin enable` applies it today | (defaulted: one behaviour for both paths) | 04 |
| A connector kind describes its configuration as JSON Schema with `x-` hints, and a secret field is `writeOnly` | Softov, 2026-10-21, chose "JSON Schema + x- hints" | 05 |
| A capability is a typed entry; v1 types are `receive`, `command` and `action`, and `ui` is reserved | Softov, 2026-10-21, "a connector that registers a '/' command or a custom action on ui that calls a command of its own with a form of its own" | 05 |
| A capability has `type`, `name`, `title`, `description`, and an `input` schema for `command` and `action` | (defaulted: enough for a client to list it and draw its form) | 05 |
| A client shows a capability type it does not know by its title | (defaulted: later versions add types) | 05 |
| Capabilities are declared and shown, not run; running an action as a tool is a later plan | Softov, 2026-10-21, chose "Later plan" | 05 |
| The UI component tree is a later plan; v1 only reserves the `ui` type | Softov, 2026-10-21, chose "Its own plan" and "Declarative tree" | 05 |
| A connector is `<configDir>/connectors/<id>.json` | Softov, 2026-10-11, "so no md for a config that is not a description.. use json" | 06 |
| A connector's owner is `host`, `team:<team>` or `user:<id>`, and its secrets are in the vault scope of that owner | Softov, 2026-10-21, chose "Host, team or person" | 07 |
| One channel, `x-ahpd-connectors`, holds the kinds and the connectors; the methods are `x-ahpd/connectors/put` and `remove` | (defaulted: the names follow the records methods) | 07 |
| A team connector needs the grant that writes the team's secrets | (defaulted: a connector holds a secret of that scope) | 07 |
| A connector of a kind no plugin registers stays on disk and shows as `unavailable` | (defaulted: a disabled plugin keeps its connectors) | 07 |
| No limit on the connectors of one kind in v1 | (defaulted: no case needs one yet) | 07 |
| `config:read` reads every row of `x-ahpd-connectors`; without it, a person reads the connectors owned by `user:<them>`, and a member reads the ones owned by `team:<team>` | Softov, 2026-10-21, chose "config:read, plus own" | 07 |
| A kind row is keyed `kind:<name>`, and a connector row by the id of the connector | Softov, 2026-10-21, chose "kind:<name> and <id>" | 07 |
| A connector owned by `host` needs `config:write` to make or remove | Softov, 2026-10-21, chose "config:write" | 07 |
| Webhook endpoints move in this plan; agent presets and channels move in later plans | Softov, 2026-10-21, chose "Webhooks" | 08 |
| The `webhook` kind has one `receive` capability | (defaulted: an endpoint only receives calls) | 08 |
| Old `webhooks/<id>.md` files are no longer read; `CHANGELOG.md` and `WEBHOOKS.md` say how to make the endpoint again | Softov, 2026-10-21, chose "Break and document" | 08, 09 |
| The ahpw pages are an ahpw plan after this one | Softov, 2026-10-21, chose "A separate ahpw plan" | - |

## Proposed architecture

- **Data flow** - the loader reads the manifest and gives its contracts to `pluginHost`. Each register method checks its name against the contract of its kind. A client puts a connector, and the host checks it against the kind's schema. The host writes each `writeOnly` value to the vault and the rest to the record. Then it calls the kind's `open`.
- **State flow** - plugin state stays in the configuration file. Kinds are in memory, from the registrations. Connectors are JSON records in `<configDir>/connectors/`. A secret is never in a record or a snapshot.
- **Layer responsibilities** - sdk: `PluginManifest`, the contract check, `ConnectorKind`, `registerConnector` and the connector channel.
  server: the manifest reader, the JSON collection, the plugin channel and the wiring in `run.ts`.
  webhook: the first connector kind.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The manifest is read](task-01-the-manifest-is-read.md) | implemented | - |
| [02 - A registration is checked against the contract](task-02-a-registration-is-checked.md) | implemented | 01 |
| [03 - Every shipped plugin declares its contracts](task-03-shipped-plugins-declare-contracts.md) | implemented | 02 |
| [04 - A client lists the plugins](task-04-a-client-lists-the-plugins.md) | implemented | 01 |
| [05 - A plugin registers connector kinds](task-05-a-plugin-registers-connector-kinds.md) | implemented | 02 |
| [06 - A collection keeps JSON records](task-06-a-collection-keeps-json-records.md) | implemented | - |
| [07 - A client makes connectors](task-07-a-client-makes-connectors.md) | implemented | 05, 06 |
| [08 - A webhook endpoint is a connector](task-08-a-webhook-endpoint-is-a-connector.md) | implemented | 07 |
| [09 - The docs say how plugins and connectors are seen](task-09-the-docs-say-how-it-is-seen.md) | implemented | 03, 04, 08 |

## Risks and tradeoffs

- The contract check refuses a third-party plugin that registers a name it did not declare. A plugin with no `contracts` is not checked, so only a plugin that declares a list can break.
- A plugin that builds its route paths at run time needs a pattern in its contract.
- A disabled file plugin is not imported, so its manifest is unknown, and its row shows none.
- Options are already editable as `plugins.<id>` root configuration keys. The plugin methods call the same writer, so both paths write the file the same way.
- A kind's schema can change between versions. A connector that no longer matches shows as `invalid`, and the plan does not migrate it.
- Task 08 breaks every webhook endpoint written by hand. The changelog says so first.
- The domain file says "UI is not" a registration kind. The component tree plan changes that, and this plan does not.

## Resume state

- **Done so far:** tasks 01 to 09 are implemented on 2026-10-21.
  That is the manifest and the contract check, every shipped plugin's contracts, and the `x-ahpd-plugins` channel.
  It is also connector kinds, JSON collections, the `x-ahpd-connectors` channel with `put` and `remove`, and the `webhook` kind, which makes endpoints out of connectors.
  The docs say all of it: `PLUGINS.md` and `WEBHOOKS.md`, the changelog's break, the domain file and the index row.
- **Next action:** the final verification checklist below, which is Softov's to run; the ahpw pages and the UI component tree are separate plans.
- **Open questions:** none; the defaulted rows above are the ones to check.
- **Watch out for:** "connector" is one configured account; "connector kind" is what a plugin registers. "Channel" is always an AHP `x-` channel. `on` is not a registration and has no contract.

## Final verification checklist

- [ ] A plugin that registers a channel its contracts do not list fails to load, with a message that names the channel.
- [ ] A file plugin with a `manifest` export loads, and a plugin with no `contracts` loads.
- [ ] A client lists the installed plugins with their manifests, and disables one.
- [ ] A client lists the connector kinds before any connector exists.
- [ ] A person makes two webhook connectors, and each answers its own URL.
- [ ] No snapshot of either channel holds a secret.
- [ ] `docs/plugins/PLUGINS.md`, `docs/plugins/WEBHOOKS.md`, `CHANGELOG.md` and `plans/index.md` updated.
