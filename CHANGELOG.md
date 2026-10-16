# Changelog

What changed in each release of the `@ahpd/*` packages. Every package carries the same version. Releases before 0.11.0 are in the git history.

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
