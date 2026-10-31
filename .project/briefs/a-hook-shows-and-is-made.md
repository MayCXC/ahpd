---
title: A hook shows and is made
created: 2026-10-30
refs:
  - git://75c009c8 - the commit of ahpd the facts were checked at
  - git://171e90619c7 - the commit of VS Code the facts were checked at
  - https://code.claude.com/docs/en/hooks - where the CLI reads hooks, its events and its five hook types
  - https://code.claude.com/docs/en/managed-settings - the managed settings directory, whose hooks and skills rank above every other level
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/channels-session/state.ts - `HookCustomization`, "a hook manifest contributed by a plugin or directory", with no event and no command
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/scan/claudeHookScan.ts - `scanClaudeHooks`, one hook customization per settings file with a `hooks` block
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/common/promptSyntax/hookTypes.ts#L30-L76 - `HOOKS_BY_TARGET`, the events VS Code offers for each target
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/common/promptSyntax/hookTypes.ts#L89-L130 - `HOOK_METADATA`, the label and description of each event, in the order the picker shows them
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/common/promptSyntax/hookCompatibility.ts#L43-L61 - `getHookSourceFormat` and `isReadOnlyHookSource`: a `.claude/settings*.json` file is Claude's and read-only
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.ts#L131-L189 - `expandHookFileItems`, which reads each hook file and makes one row per command
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts#L1247-L1274 - the Hooks page actions: New Hook for the workspace and for the user, and Generate with AI outside the Sessions window
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts#L3959-L3986 - New Hook, which opens the hook picker with `Target.GitHubCopilot` in the Sessions window
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/promptSyntax/hookActions.ts#L389-L452 - the event step of the hook picker
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/promptSyntax/hookActions.ts#L585-L707 - the file and folder steps, which ask the window's local `promptsService`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.ts#L212-L218 - `DEFAULT_HOOK_FILE_PATHS`, the local hook places
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.ts#L51-L60 - local hooks are not synced to an agent host
  - file:///github/ahpd/.project/plans/claude/20261031-0228-a-skill-names-its-own-file/plan.md - the skills plan, which reads the other customization files from disk in the same way
  - file:///github/ahpd/.project/plans/claude/20261031-0258-a-written-agent-shows-at-once/plan.md - the reload plan, which makes a written file show without a restart
---

# A hook shows and is made

On a Claude session of ahpd, VS Code's Hooks page shows User 0 and Workspace 0.
Softov's `~/.claude/settings.json` has a `hooks` block, so the page is wrong.
The page's `+` offers Session Start, User Prompt Submit, Pre-Tool Use, Post-Tool Use, Subagent Stop, Stop, Session End and Error Occurred.
Softov wants the Hooks page to show the hooks that the CLI runs, and a new hook to land where the CLI reads it.

## What others do

### The Claude CLI

- The CLI reads hooks from the `hooks` key of these settings files:
  - `~/.claude/settings.json`, for the user.
  - `<project>/.claude/settings.json` and `<project>/.claude/settings.local.json`, for the project.
  - The managed settings, for the organization.
- A plugin's `hooks/hooks.json` and the frontmatter of a skill or a subagent add hooks too.
- Hooks from all levels merge, and the same handler in two settings files runs once.
- `disableAllHooks: true` turns off all hooks, except managed hooks when it is set below the managed level.
- The CLI has 33 events, such as `PreToolUse`, `PermissionRequest`, `Notification`, `PreCompact` and `ConfigChange`.
- A handler has one of five types: `command`, `http`, `mcp_tool`, `prompt` or `agent`.
- `/hooks` is a read-only list. Each hook shows its event, its source and the full handler.
- The Claude SDK has no call that lists hooks.

### VS Code's Claude agent host

- `scanClaudeHooks` reads `<working directory>/.claude/settings.json`, `<working directory>/.claude/settings.local.json` and `~/.claude/settings.json`.
- Each file with a hook becomes one hook customization. Its `uri` is the settings file, and its `name` is the file name, `settings.json`.
- The customizations go in a `hooks` directory per scope, sent only when it has a hook.
- `disableAllHooks: true` in a file sends nothing from that file.
- Only `command` handlers count. The scan drops `http`, `mcp_tool`, `prompt` and `agent` handlers, and events it does not map.

### The VS Code Hooks page

- The page takes each hook customization of the session and reads its `uri`.
  It parses the file and shows one row per command: the event label as name, and the command as description.
  A file it cannot parse shows as one row.
- A `.claude/settings.json` or `.claude/settings.local.json` file is in Claude's shape. VS Code treats it as read-only.
- The protocol's `HookCustomization` has no event and no command, so a client must read the file to show more than its name.

### The VS Code new-hook flow

- The Hooks page has New Hook for the workspace and for the user.
  Outside the Sessions window it also has Generate with AI.
- The event list comes from VS Code's own table `HOOKS_BY_TARGET`, not from the host.
  The protocol has no field that names the events a host supports.
- In the Sessions window New Hook passes `Target.GitHubCopilot`.
  The list is then the eight Copilot CLI events, in the order of `HOOK_METADATA`.
  These are the eight events Softov saw.
- In the main window no target is passed. The list then has three groups: Local/Copilot Agents, Local Agents and Copilot Agents.
- The Claude target in `HOOKS_BY_TARGET` has eight events, with `PreCompact` and `SubagentStart`, and without `SessionEnd` and `ErrorOccurred`.
  New Hook never passes it.
- After the event, the picker shows the hooks of that event and "Add new hook...".
  It then asks for a file, a folder and a file name.
- The files and folders come from the window's local `promptsService`, not from the session.
  Its places are `.github/hooks`, `.claude/settings.local.json`, `.claude/settings.json`, `~/.copilot/hooks` and `~/.claude/settings.json`.
- A new file is written as `{"hooks": {...}}`, with `.json` added to the name.
  In a `.claude/settings*.json` file the entry has Claude's shape, with `matcher` and an inner `hooks` list. In any other file it has the Copilot shape.
- VS Code does not sync local hooks to an agent host. `syncedCustomizationBundler.ts` skips them, with the note "hooks require JSON merging".

## What ahpd has today

- The Claude backend sends no hook customization. `packages/agent-claude/src/session/customizations.ts` has no hook code.
- So VS Code's Hooks page is empty on an ahpd session, though the CLI runs Softov's user hooks.
- The client's new-hook flow does not reach ahpd. It writes local files, and only `.claude/settings*.json` in Claude's shape is read by a CLI on the same machine.

## Who writes

- `packages/agent-claude/src/session/customizations.ts`: the skills brief and the reload brief change it too. The three are built one after the other.
- No open branch or worktree changes `customizations.ts` at `75c009c8`.

## The change

- The Claude backend reads the `hooks` key of `~/.claude/settings.json`, `<working directory>/.claude/settings.json` and `<working directory>/.claude/settings.local.json`.
- Each file with a hook is sent as one hook customization, whose `uri` is the settings file, in a `hooks` directory per scope.
  VS Code then shows one row per command, as for its own Claude agent host.
- A file with `disableAllHooks: true` sends no hook.

## Open points

- Whether ahpd keeps the hooks VS Code drops: `http`, `mcp_tool`, `prompt` and `agent` handlers, and the CLI events that VS Code does not map.
  VS Code reads the file itself, so a row for these depends on its parser, not on ahpd.
- Whether the managed settings and plugin `hooks/hooks.json` files are sent too, as read-only directories.
- Whether the `hooks` directories are writable. The CLI reads hooks only from settings files, so a new file in a `hooks` directory never runs.
- How a client learns which events a host supports. Today the list is fixed in each client, and VS Code offers the Copilot events on a Claude session.
  This needs a protocol field, for example a list of event names on the `hooks` directory.
- Not checked: whether VS Code reads a hook file's `uri` through the agent host when the host is on another machine.
- Not checked: whether VS Code's Sessions window passes the session's working directory as `workspaceFolder` to the new-hook flow.
