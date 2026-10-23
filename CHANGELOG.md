# Changelog

What changed in each release of the `@ahpd/*` packages. Every package carries the same version. Releases before 0.11.0 are in the git history.

## 0.14.0 - unreleased

### Upgrading

- A webhook endpoint is now a `webhook` connector, and a hand-written `webhooks/<id>.md` file is no longer read. A call to an id that no open connector answers for answers 404. Make each endpoint again with `x-ahpd/connectors/put`, giving it the same id, the bot or the automation, and the token a caller already sends:

```json
{
  "id": "ci",
  "adapter": "webhook",
  "owner": "host",
  "config": { "bot": "bot://motion", "secret": "the token a caller sends", "reply": "sync" }
}
```

  The host writes the token to the vault as `host:connector/ci/secret`, so the caller's header does not change. A `host:<name>` secret the old record named can be taken out with `ahpd vault delete host:<name>`. See [docs/plugins/WEBHOOKS.md](docs/plugins/WEBHOOKS.md).
- A plugin registers **adapters**, not connector kinds: `registerConnector` is `registerAdapter`, `ConnectorKind` is `Adapter`, `connectorKinds` is `adapters`, and the contract key `connectors` is `adapters`. A stored connector that still says `kind` and not `adapter` reads as `unavailable`. A plugin whose manifest declares `connectors` no longer loads.
- `x-ahpd-adapters` lists the adapters, and `x-ahpd-connectors` lists only connectors. A connector row no longer carries an adapter row beside it, and its `adapter` field names the adapter it is one of.
- `x-ahpd-plugins`, `x-ahpd-adapters` and `x-ahpd-connectors` take their own grants rather than `config`. A role that read the plugins with `config:read` now needs `plugin:list`, and one that read the connectors now needs `connector:list`. One that enabled, disabled or edited a plugin with `config:write` now needs `plugin:enable`, `plugin:disable` or `plugin:options`. One that made or removed a connector now needs `connector:put` or `connector:remove`. Over HTTP, `plugin config`, `enable` and `disable` take the same grants and are no longer the deployment token's alone; install, update and remove still are.
- Every connector action takes a `connector:` grant, the caller's own connector included. A person needs `connector:put` to make their own connector and `connector:remove` to remove it. `connector:list` reads the caller's own connectors, their teams' and the host's, and no other person's; a role that reads every connector needs the new `connector:all`. A connector owned by `host` also needs the new `connector:host` to be made or removed. A team connector no longer takes `team:write`; it takes `connector:put` or `connector:remove` and a membership of the team.
- `x-ahpd-connectors` opens with `connector:list`, and a role holding `connector:all` subscribes without it and reads every row. A client that read the channel's grant from `ahpd.channels` now reads `connector:list`.
- A role that made or removed a host connector with `connector:put` or `connector:remove` alone now also needs `connector:host`.
- A webhook connector's `automation` is now the id of the automation a call starts, not `true`. A connector that names neither `automation` nor `bot` fires the `webhook` trigger. A stored `automation: true` opens as `invalid`, and `x-ahpd/connectors/put` refuses it until the id is given.
- A `webhook` trigger's `config` field is `connector`, not `endpoint`. An automation that still says `endpoint` is refused when it is saved, and a stored one does not fire.
- A run reads `{{event.body.<field>}}`, `{{event.headers.<field>}}` and `{{event.query.<field>}}`. `{{event.<field>}}` is empty, so an automation written for the old event data needs its placeholders rewritten.
- The default `reply` is `none`, not `callback`. A bot connector made with only `bot` and `secret` answers 202, a `reply` of `callback` needs a `callbackPrefix`, and `reply`, `callbackPrefix` and `syncTimeoutSeconds` are refused on a connector with no `bot`.

### Webhooks

- A webhook connector names one `auth` scheme: `bearer` (the default), `header`, `query`, `hmac`, `github`, `stripe`, `slack`, `standard`, `meta` or `graph`. A timestamped scheme refuses a call more than 300 seconds from the host's clock, and every value is compared in constant time. A token in the URL can land in a proxy log.
- A call carries any body: JSON of any shape, a form, text or nothing, up to `maxBodyBytes` (5 MiB by default). A body over the limit answers 413.
- A run reads `event.connector`, `event.method`, `event.body`, `event.headers` and `event.query`. The proof header, `authorization`, `cookie` and the URL `token` are kept out.
- `match` on the connector selects the calls that reach its target, by a dotted path of the event data. A call it does not take answers 202 with `{ "skipped": true }`.
- A connector names an `automation`, and a call starts that one automation. A connector with neither `bot` nor `automation` fires the `webhook` trigger, and every automation whose trigger config names the connector runs if the owner rule passes.
- `meta` and `graph` answer their URL handshakes, and `slack` answers `url_verification`. Nothing fires on a handshake.
- A connector links to an automation only when both have the same owner or the connector is the host's, checked on save and again at a fire.
- `PluginHost.runAutomation(id, data, owner?)` starts one automation by its id, and `fireTrigger` takes the owner of the connector the event came from.
- An adapter schema marks a connector field with `x-ahpd-connector` and an automation field with `x-ahpd-automation`; the host checks both on save.

### Plugins and connectors

- A plugin declares a manifest: a description, categories, links and contracts. A registration its contracts do not list fails that plugin, with a line naming the method and the name. A plugin with no contracts loads as before, and is listed as `undeclared`.
- A plugin registers adapters, each with a JSON Schema a client draws the form from and the capabilities a connector of that adapter has.
- `x-ahpd-plugins` lists the configured plugins, and `x-ahpd/plugins/enable`, `disable` and `options` change the file the daemon loads.
- A plugin row carries `version`, `loaded`, `loadProblem` and `optionsSchema`. `loadProblem` is the line saying why the daemon did not load it, with any URL userinfo and any `writeOnly` option value an error quoted answered `<set>`. A plugin switched off carries no `optionsSchema`, because its module is never imported to read it.
- `enable`, `disable` and `options` mark `ahpd.restartNeeded` on the root state for every connection, and only a restart clears it. A connection watching the root is sent `x-ahpd/restartNeeded` with `{ channel: "ahp-root://" }` when the mark is set, once, so a client holding the state does not have to read it again.
- `x-ahpd-adapters` lists the adapters a host serves, keyed by adapter name, and read-only. `x-ahpd-connectors` lists the connectors, and `x-ahpd/connectors/put` and `remove` make and take them away. A field an adapter's schema marks `writeOnly` goes to the vault under the owner's scope, and is in no record and no snapshot.
- A `receive` capability may carry `path`, where its connectors receive on the daemon's HTTP root, with `{id}` for the connector id. `x-ahpd-adapters` sends it, and the `@ahpd/webhook` capability names `/plugins/webhook/{id}`.
- `@ahpd/webhook` registers the first adapter, so a client makes a webhook endpoint from the connector form.

### Bots

- A message sent in a bot chat while a turn runs shows as a turn of its own. The running turn ends `complete` with what it held, and the back session's answer after the steer lands under the new turn.

### Agents

- cofold: a transcript read while a rewind removes a run answers the turns that remain instead of failing. The removed run's turn carries no usage, ending or duration.

## 0.13.0 - 2026-10-20

### Upgrading

- `http` is now `httpApi`, and `proxy` is now `modelProxy`. A file with the old names still starts, with one warning for each key. A file that holds both names of one key is refused. See [docs/server/UPGRADE.md](docs/server/UPGRADE.md#renamed-keys).
- A shell command that the session owner's terminal rules approve now runs without a question, in Claude, ACP, pi and cofold. A window that pushed no rules gets VS Code's default table. Set `terminalAutoApproveDefaults` to `none` to keep every command asking.
- When the host offers `task_add`, Claude's own task tools are denied, and its plan goes to the host's task list. `hostTasks: false` in a preset keeps Claude's own tools.
- A JWT with no `exp` is refused.

### Install and update

- One line installs ahpd: `curl -fsSL https://ahpio.com/ahpd/install.sh | bash`, or `irm https://ahpio.com/ahpd/install.ps1 | iex` on Windows. It can install Node, then runs `ahpd configure`. `--uninstall` removes ahpd again. See [docs/server/INSTALL.md](docs/server/INSTALL.md).
- `ahpd configure` finds Node, Bun and Deno and the known ACP agents on the PATH, and offers a preset for each agent it finds.
- `ahpd update`, `POST /api/update` and `x-ahpd/update` install a newer `@ahpd/server`, move every plugin to the new sdk, and restart the daemon. See [docs/server/UPGRADE.md](docs/server/UPGRADE.md).
- `ahpd service install` hands the daemon to the service manager: a systemd user unit on Linux, a LaunchAgent on macOS. See [docs/server/RUN.md](docs/server/RUN.md).
- npm prints the packages it installs before it runs.

### Approvals

- `terminalAutoApproveEnabled`, `terminalAutoApproveRules` and `terminalAutoApproveDefaults` approve shell commands by rule. A command is split into its parts before the rules match it.
- `commandParser`, or a plugin's `registerCommandParser`, replaces the command splitter.
- `eligibleForAutoApproval` makes a tool ask on every call, in every backend and every permission mode.
- A client's rules reach the agent's system prompt.
- A pushed `/.../` rule that VS Code's default table does not carry needs `config:change`.

### Sessions and VS Code parity

- A session from VS Code keeps its owner, scope and config when a listing runs while it restarts.
- A remote session from VS Code 1.141 keeps its origin.
- A stopped Claude turn leaves the session idle, not failed.
- Each built-in Claude plugin is switched on and off by itself, and a session switch on one stays.
- A synced skill is named by its plugin.
- An automation is exported as VS Code's file, and VS Code's file is imported.
- An unchanged set and an idle cancel are echoed to the client that sent them.
- A client sees the agent account.
- A client that stops reading is bounded.
- A session row's diff stat counts the session's own work.
- A session recorded outside the served paths stays listed.
- A session whose folder was removed outside ahpd no longer names that folder.
- A push of another key keeps the session tools as they were set.
- ACP opens a session in the permission mode it asked for.

### Tasks and plans

- The host keeps one task list per session. Claude and ACP write their plans to it, and the host draws the Plan call.
- The plan channel announces a removed task with `x-ahpd-plans/taskRemoved`.

### Bots

- A person talks with a bot in a chat of its own. A message wakes the bot's back session, and `post_message` answers in the chat.
- A bot's persona is its `AGENTS.md`, and its data is one folder.

### Users and tokens

- A person mints up to `tokensPerPerson` tokens of their own, each with an optional label, expiry and a subset of their grants. See `ahpd token` and [docs/server/USERS.md](docs/server/USERS.md).
- A plain request with a refused token answers 401.
- A JWT is verified locally.
- Usage limits are charged per turn and per proxy call, and a client reads each limit at `usage://limits`.
- A put can clear a policy's `pool` and `cap`, and `@ahpd/sdk` exports `PolicyLimits`.

### Windows

- The checks run on Windows in CI, and a failure there blocks a merge.
- Terminals run on Windows.
- A spawn opens no console window.
- An ACP server stops on Windows.
- A host folder has a drive-style path inside a machine: `C:\Users\ana\proj` is `/c/Users/ana/proj`.
- A mount source can start with a drive letter.
- A file URI keeps its drive, and git never runs without a folder.
- An archive no longer deletes files through a junction.
- A redirect into `.git` asks on Windows, as it does elsewhere.

### Agents

- Claude is on the Agent SDK 0.3.301, ACP on the ACP SDK 1.8.0, and pi on pi 1.3.0.
- cofold: a client tool with `$comment` no longer fails the turn, and the first message of a session shows once.
- An ssh machine runs every agent.

### Daemon

- A failure is JSON under `--json`.

## 0.12.0 - 2026-10-15

### Upgrading

- A plugin id is a bare slug, such as `webhook` or `computer`. The npm package names stay `@ahpd/...`. The daemon skips a plugin whose exported `name` is not a slug, and `ahpd plugin list` shows it as `error`.
- Sessions, automations, wake senders and usage saved under an old owner, such as `plugin:@ahpd/webhook`, read as the new one. Nothing on disk is rewritten.
- `@ahpd/webhook` is published to npm for the first time.
- `docs/sdk/LIBRARY.md` is now [docs/sdk/BUILD-A-HOST.md](docs/sdk/BUILD-A-HOST.md), and upgrading has its own page, [docs/server/UPGRADE.md](docs/server/UPGRADE.md).

### Webhooks

- `@ahpd/webhook` keeps endpoints as records, each with its own vault secret, and passes a call only with that secret as its bearer token. See [packages/webhook](packages/webhook).
- A webhook talks to a bot by thread, or fires an automation whose run reads the event.
- Routes can listen on a public port of their own.
- A callback follows no redirect. A refused chat answers 409, and a failed sync turn answers 502.

### Sessions and VS Code parity

- A session and its chats are marked read and unread together, and a turn marks its chat unread, as the protocol does.
- Archiving a session shelves its worktree, and unarchiving restores it. `archiveDirtyWorktree` says what archiving does with uncommitted changes.
- A merged session archives and deletes itself. `pullRequestLookup` says how the host learns a pull request's state.
- A turn started on a busy chat is refused.
- Automations run with no client, so VS Code lists them. Every automation due at once fires, a run can be stopped, and each automation keeps its 50 newest runs.
- A customization switched off for every session, or for one folder, stays off in each new session there.
- The root state says what machine the host runs on, and the host sends its build.
- `#` completes a file, and `#chat:` completes a chat of the session. A chat attachment gives a pointer and an excerpt.
- A session tool acts as the person it works for, with VS Code's limits on spawning and messaging. The session tools can be switched off, and a running Claude session follows the switch.
- A host can take a remote session and keep its origin, and the agent is told to report back to it.
- A turn's end pushes the files of a watched changeset.
- `shellEnv` sets the environment of every shell the host starts, including Claude's Bash commands.
- A session record keeps its working folder, and Claude and pi look for a session there first.

### Agents

- Claude: a client tool's JSON Schema reaches the model whole, a cancelled call closes its confirmation, a spawn failure names its cause, and the handshake has a bound.
- ACP: a withdrawn question is removed, and a question can take a typed answer.
- cofold: `@cofold/agents` 0.4.0, cofold's slash commands are offered in a session, and `/compact` draws one notice.

### Bots

- A bot's first turn is its filled template, each new chat of a bot starts with the template, and a fork gets no preamble.
- An edit passes when its template is gone.

### Computers

- An ssh machine is listed from the options, and a session on it runs nested over ssh.
- A restart of this host leaves a nested session for the next one to resume.
- A profile names the OCI runtime its machines run under, such as `runsc`.

### Daemon

- On Windows, `ahpd stop` and `ahpd restart` reach the daemon through a named pipe, and `stop` waits for it to exit.
- The `shutdown` method stops the daemon gracefully, and the host closes each WebSocket with 1001.
- `ahpd paths` lists, adds and removes the served folders, and a change reaches the running daemon. `ahpd status` shows the start folder.
- `ahpd start` logs each stage, and npm installs a plugin on Windows.
- A plugin's late problem is logged.
- `session:write` holds `chat:write`.
- A 0.10.0 protocol offer is answered with 0.10.0.

### Documentation

- The docs are a site at https://softov.github.io/ahpd/.

## 0.11.0 - 2026-10-11

### Upgrading

- On first start, the daemon converts its stores to Markdown files and keeps each original with a `.migrated` suffix:
  - each bot in `<configDir>/bots/<slug>.json` becomes `<slug>.md`;
  - `automations.json` becomes one file per automation in `<configDir>/automations/<id>.md`, with run state in `automations-state.json`.
- Plugins now declare `@ahpd/sdk` with an upper bound: `>=0.10 <1`, and `>=0.8 <1` for `tunnel-devtunnel`.
- `@ahpd/bot` and `@ahpd/push` are published to npm for the first time.

### Bots

- A bot is a Markdown file: YAML frontmatter, with its instructions as the body. An edit to the file reaches the daemon without a restart. See [docs/BOTS.md](docs/BOTS.md).
- Making a bot starts its session, and a bot can be watched.
- Bots have a catalogue, served as a channel.
- An admin can make a bot for any owner.
- A bot's colour is a name or a hex colour.

### Automations

- An automation is a Markdown file, with its message as the body. A copy under a new name is a new automation, and an edit is reloaded at once. See [docs/AUTOMATIONS.md](docs/AUTOMATIONS.md).
- An automation can wake on what a session does, and can disable itself.
- An automation carries its template's client plugins.

### Plugins

- Plugins keep records in the host's record store, written as Markdown files. A plugin also gets YAML from the host.
- A plugin can serve a channel, and is a client of its own host.
- A plugin is known by its id.
- `ahpd plugin install` picks the newest version that fits the daemon's sdk, and `plugin update --force` installs each package on its own.

### Sessions and VS Code parity

- A quiet session sleeps and wakes when something needs it.
- Stage, unstage, discard and commit take one file or the whole changeset. The working tree is the first changeset.
- A chat can be reordered, moved to another session, read or archived on its own. A peer chat survives a restart.
- A chat lists the shells and subagents running in its background, and an MCP server startup can be sent to the background.
- Attachments reach Claude, pi, ACP and cofold turns.
- The ACP bridge resumes without replay, forks where the server can, and asks the server's questions.
- Root config declares VS Code's keys and refuses the rest.

### Daemon and API

- The host serves `x-` commands; people, policies and computers are channels; usage is read through commands.
- The API answers only the origins a deployment names.
- Each plugin config field can be overridden by a recorded flag.

### Usage

- A usage record keeps the provider's cost beside the charged one, split into sent and received tokens.
- A usage list shows what a reader may read, by range and group.
- A reset conversation starts the cost baseline again.

### Push

- A session's devices are told when it finishes a turn, as well as when it needs a person.
