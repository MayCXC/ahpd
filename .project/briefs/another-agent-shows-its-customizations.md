---
title: Another agent shows its customizations
created: 2026-10-30
refs:
  - git://36d7eaac - the commit of ahpd the facts were checked at
  - git://171e90619c7 - the commit of VS Code the facts were checked at
  - "[code://packages/agent-acp/src/session.ts#L187](../../packages/agent-acp/src/session.ts#L187) - an ACP session's customizations: the host's seeds and the agent's commands"
  - "[code://packages/agent-acp/src/agent.ts#L149](../../packages/agent-acp/src/agent.ts#L149) - the ACP probe, which answers no customization"
  - "[code://packages/agent-acp/src/presets.ts#L114-L132](../../packages/agent-acp/src/presets.ts#L114-L132) - the Codex preset: the `codex-acp` adapter, `CODEX_HOME=/ahpd/codex`, seeded from `~/.codex`"
  - "[code://packages/agent-cofold/src/session.ts#L283](../../packages/agent-cofold/src/session.ts#L283) - a cofold session's customizations: the host's seeds only"
  - "[code://packages/agent-cofold/src/agent.ts#L849](../../packages/agent-cofold/src/agent.ts#L849) - the cofold probe, which answers commands and no customization"
  - "[code://packages/agent-pi/src/session.ts#L1226](../../packages/agent-pi/src/session.ts#L1226) - a pi session's customizations: the host's seeds only"
  - "[code://packages/agent-pi/src/agent.ts#L130](../../packages/agent-pi/src/agent.ts#L130) - the pi probe, which answers no customization"
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/codex/codexCustomizations.ts#L174-L220 - `discoverCodexWorkspaceInstructions`, the root `AGENTS.md` of each working directory in a read-only directory
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/codex/codexCustomizations.ts#L276-L345 - `codexSkillsToContainers`, one read-only directory per skill scope from Codex's `skills/list`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/codex/codexCustomizations.ts#L114-L155 - `discoverCodexWorkspaceSkills`, a writable `.github/skills` directory per working directory
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/codex/codexMcpServers.ts - the MCP servers Codex reports through `mcpServerStatus/list`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/codex/codexAgent.ts#L2875-L2900 - `_buildSessionMcpServers`, the servers VS Code adds to a Codex thread
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/copilot/sessionCustomizationDiscovery.ts - the Copilot host asks the Copilot CLI for its agents, instructions and skills, and their folders
  - https://developers.openai.com/codex/guides/agents-md - where Codex reads `AGENTS.md`, and in which order
  - file:///github/ahpd/.project/plans/claude/20261031-0228-a-skill-names-its-own-file/plan.md - the skills plan, which does this work for a Claude session
---

# Another agent shows its customizations

In VS Code's Agent Customizations, a Claude session of ahpd will show its instructions, skills and agents with their files, through the skills plan.
Every other agent of ahpd shows only its commands: the ACP presets, cofold and pi.
Softov's screenshots of a VS Code Codex session on `opendoop` show instructions, skills, MCP servers and plugins, each with the file it came from.
Softov wants every agent of ahpd to show its customizations, each with its file, as VS Code does for its own agents.

## What others do

VS Code has three agent hosts: Claude, Codex and Copilot.
Each one asks its own agent what it loaded, or reads that agent's files.
No host has a generic reader for any agent.

### VS Code's Codex agent host

VS Code talks to Codex through the Codex app-server, not through ACP.

Instructions:

- Codex reads `AGENTS.md` in two places.
  The global one is `$CODEX_HOME/AGENTS.override.md` or `$CODEX_HOME/AGENTS.md`.
  The project ones are in each folder from the project root down to the working directory.
- VS Code shows only `<working directory>/AGENTS.md`, as one rule with `alwaysApply: true`.
- It is in a directory with `writable: false`, named after the working directory.
  So the Instructions `+` has no place to write, and says "No instruction source folders found".

Skills and MCP servers:

- Skills come from Codex's `skills/list`.
  Codex reads `<repo>/.agents/skills`, `~/.agents/skills`, `.codex` and its bundled skills.
- Each skill scope becomes one read-only directory: `repo` is Repository, `user` is User, `system` is Built-in and `admin` is Admin.
- A skill's `uri` is its `SKILL.md` file, from the path Codex reports.
- VS Code also sends a writable `.github/skills` directory per working directory, so a person can make a skill there.
- MCP servers come from Codex's `mcpServerStatus/list`, with their state.
- VS Code adds its own servers to each Codex thread: its root `mcpServers` config, the workspace servers and the client plugins' servers.
  These merge with `~/.codex/config.toml`.

Softov's screenshots show the result:

- Instructions has User 0 and Workspace 1, the folder's `AGENTS.md`. The global `AGENTS.md` is not shown.
- Skills has User 91 at `~/.agents/skills/<name>/SKILL.md`, Workspace 7 at `.agents/skills/<name>/SKILL.md`, and Built-in 14 at VS Code's own `sessions/skills`.
- MCP Servers has User 2, both from VS Code's `mcp.json`. One is shown "Disabled (Globally)".
- MCP Servers has Built-In 6, Codex's own servers, with no file.
- Plugins has User 3, from `~/.vscode/agent-plugins`.

### VS Code's Copilot agent host

- The host asks the Copilot CLI through its RPC: `agents.discover`, `instructions.discover` and `skills.discover`.
- It also asks for the folders each kind is read from, `getDiscoveryPaths`, and sends them as directories.
- It reads hooks itself from `.github/hooks`, `~/.copilot/hooks` and `.github/copilot/settings*.json`.
- An instruction file is one of `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` or `copilot-instructions.md`.

## What ahpd has today

- An ACP session sends the host's seeds and the agent's commands, and nothing else. The ACP probe answers no customization.
- A cofold session and a pi session send the host's seeds only. Their probes answer no customization.
- ACP has no call that lists instruction files, skills or MCP servers.
  So Instructions, Skills and MCP Servers are empty on every agent of ahpd except Claude.
- ahpd has 15 ACP presets, Codex and Copilot among them. Each agent keeps its files in its own places.
- The Codex preset runs the `codex-acp` adapter with `CODEX_HOME=/ahpd/codex`.
  It seeds that folder from `~/.codex/config.toml`, `~/.codex/AGENTS.md` and `~/.codex/skills`.

## Who writes

- No open branch or worktree changes `packages/agent-acp/src`, `packages/agent-cofold/src` or `packages/agent-pi/src` at `36d7eaac`.
- The skills plan changes only `packages/agent-claude`.

## The change

- Every agent sends its instruction files as rules, its skills and its MCP servers, each one with its file as `uri`.
- Each agent's directories follow its own places, as VS Code's Codex and Copilot hosts do.
- A directory is writable only where the agent reads new files from it.
- For Codex, the `AGENTS.md` files are rules in a read-only directory, because Codex reads no folder of instruction files.

## Open points

- Where ahpd learns each agent's files:
  - from a list of places in each preset, read by `agent-acp`, which works with any ACP adapter;
  - or from the agent's own API, as VS Code runs the Codex app-server and the Copilot CLI RPC, which gives what the agent loaded.
- Which agents come first. Softov's screenshots are of Codex.
- For Codex, whether the global `AGENTS.md` shows too, which VS Code does not.
  In ahpd it is the copy in `CODEX_HOME`, not `~/.codex/AGENTS.md`.
- For Codex, whether the `AGENTS.md` files between the project root and the working directory show, which VS Code does not.
- For Codex, whether a skill directory is writable, and which folder: `.agents/skills`, as Codex reads, or `.github/skills`, as VS Code writes.
- Not checked: which files cofold and pi read as instructions and skills.
- Not checked: whether `codex-acp` reports Codex's skills as ACP commands.
- Not checked: whether Codex reads `~/.codex/skills`, which ahpd seeds, as well as `~/.agents/skills`.
