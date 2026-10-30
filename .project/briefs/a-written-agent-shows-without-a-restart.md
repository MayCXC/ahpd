---
title: A written agent shows without a restart
created: 2026-10-30
refs:
  - git://9e87c164 - the commit of ahpd the facts were checked at
  - "[code://packages/agent-claude/src/session/customizations.ts#L72-L86](../../packages/agent-claude/src/session/customizations.ts#L72-L86) - one directory container per kind, `~/.claude/<kind>`, `writable: true`, left out when it has no children"
  - "[code://packages/agent-claude/src/session/servers.ts#L284-L327](../../packages/agent-claude/src/session/servers.ts#L284-L327) - `describe`, the one read of the CLI's agents, skills and plugins, when the query starts"
  - "[code://packages/agent-claude/src/session/servers.ts#L85-L95](../../packages/agent-claude/src/session/servers.ts#L85-L95) - `laid`, which builds the list and sends `session/customizationsChanged`"
  - "[code://packages/agent-claude/src/session/servers.ts#L263-L272](../../packages/agent-claude/src/session/servers.ts#L263-L272) - a plugin switch, which already calls `reloadPlugins` and `laid` during a session"
  - "[code://packages/agent-claude/src/claude.ts#L512-L517](../../packages/agent-claude/src/claude.ts#L512-L517) - the daemon's probe, read once"
  - "[code://packages/sdk/src/host/resourcemethods.ts#L148-L175](../../packages/sdk/src/host/resourcemethods.ts#L148-L175) - `resourceWrite`, which writes through the store and tells no backend"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `reloadPlugins()` answers `commands`, `agents`, `plugins` and `mcpServers` (`sdk.d.ts` `SDKControlReloadPluginsResponse`)
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/channels-session/state.ts - `DirectoryCustomization`: a client MAY write into a writable directory with `resourceWrite`, and the host then surfaces the child through the customization actions
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.ts#L200-L234 - `provideSourceFolders`, which offers only writable directory containers as a place for a new file
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/promptSyntax/newPromptFileActions.ts#L211-L223 - the Claude agent template VS Code writes
  - file:///github/ahpw/.project/briefs/a-custom-agent-is-made-and-edited.md - the ahpw half, which makes and edits an agent file
---

# A written agent shows without a restart

Softov made two agents from VS Code's Agent Customizations on a Claude session of ahpd: `test.agent.md` and `beaba.agent.md`.
VS Code wrote both into `~/.claude/agents/`, and the host log shows each `resourceWrite`.
Neither agent showed in the session's customizations or in the `/agent` picker until he restarted ahpd.
He wants an agent written through a session to show in that session without a restart.

## What others do

- The protocol says a client MAY write a new customization into a directory with `writable: true`.
  The host then surfaces the child through the customization actions.
- VS Code at `171e90619c7` offers a place for a new agent only from the session's writable directory containers whose `contents` is `agent`.
  A container under a working directory goes in the Workspace group, and any other goes in the User group.
- VS Code then asks for a file name, writes its Claude template with `resourceWrite`, and opens the file in its editor.
  Each save is one more `resourceWrite`.
- VS Code's own Claude agent host watches `<scope>/.claude` and the `CLAUDE.md` files, and reads its customizations again 300 ms after a change.
  It reacts only to `agents`, `skills`, `commands`, `rules`, `plugins`, `CLAUDE.md` and the settings files ([`ClaudeCustomizationWatcher`](https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/claudeSessionCustomizationDiscovery.ts#L443-L554)).

## What ahpd has today

- The Claude backend sends one directory container per kind, at `~/.claude/<kind>`, with `writable: true` ([`code://packages/agent-claude/src/session/customizations.ts`](../../packages/agent-claude/src/session/customizations.ts#L72-L86)).
  This path is a convention: the CLI reports what it loaded, not where from.
- A container with no children is left out.
  So a person with no user agents gets no Agents directory, and VS Code has no place to offer.
- No container is sent for `<working directory>/.claude/<kind>`, so VS Code's Workspace group is always empty.
- A session reads the CLI's agents, skills and plugins once, in `describe`, when the query starts ([`code://packages/agent-claude/src/session/servers.ts`](../../packages/agent-claude/src/session/servers.ts#L284-L327)).
- The daemon's probe reads them once more, when the daemon starts ([`code://packages/agent-claude/src/claude.ts`](../../packages/agent-claude/src/claude.ts#L512-L517)).
- `resourceWrite` writes through the store and tells no backend ([`code://packages/sdk/src/host/resourcemethods.ts`](../../packages/sdk/src/host/resourcemethods.ts#L148-L175)).
- Nothing watches `~/.claude/<kind>`.
- A plugin switch already reloads during a session: it calls `reloadPlugins`, then `laid`, which sends `session/customizationsChanged` ([`code://packages/agent-claude/src/session/servers.ts`](../../packages/agent-claude/src/session/servers.ts#L263-L272)).
- `reloadPlugins()` in the Claude SDK 0.3.301 answers `agents` and `commands` as well as `plugins`.
  `describe` uses only its `plugins` and takes the agents from `initializationResult()`.

## Who writes

- `packages/agent-claude/src/session/servers.ts` and `customizations.ts`: no open branch or worktree changes them at `9e87c164`.
- `packages/sdk/src/host/resourcemethods.ts`: no open branch or worktree changes it at `9e87c164`.
- The worktrees `build-agents-fda88f4a`, `plans-work`, `review-maycxc-union` and `server-check` touch none of these files.

## The change

- A write into a writable directory of a session makes that session read its customizations again, and send `session/customizationsChanged` with the new child.
- The read again uses `reloadPlugins()`, because it re-reads agents and commands from disk without a new CLI process.
- The daemon's probe is read again after the same write.
  Then a new session and the agent list outside a session also show the new agent.
- An edit and a delete in the directory reach the list the same way as a new file.
- A writable directory is sent with no children too, as VS Code does. Softov, 2026-10-30: "yes, send them".
  Without it, New agent and New skill show only for a person who already has one.
- A new skill shows after the reload too, as a new agent does.

## Open points

- What starts the read: a client's `resourceWrite` only, or a watcher on each writable directory.
  A watcher also catches a file that the agent or a person writes.
- Whether ahpd sends `<working directory>/.claude/<kind>` too, as a writable container, so a Workspace agent can be made.
- Not checked: whether `initializationResult()` answers new agents after `reloadPlugins()`, or only the agents read when the CLI started.
- Not checked: whether `reloadPlugins()` reads the skills again. The SDK 0.3.301 also has `reloadSkills()`, which answers `skills`.
- Not checked: whether a running Claude turn can call a new agent through its Task tool after the reload.
