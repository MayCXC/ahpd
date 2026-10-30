---
title: A skill names its own file
created: 2026-10-30
refs:
  - git://9e87c164 - the commit of ahpd the facts were checked at
  - "[code://packages/agent-claude/src/session/customizations.ts#L188-L218](../../packages/agent-claude/src/session/customizations.ts#L188-L218) - a skill's `uri`, made from its name as `~/.claude/skills/<name>`"
  - "[code://packages/agent-claude/src/session/customizations.ts#L220-L236](../../packages/agent-claude/src/session/customizations.ts#L220-L236) - a command's `uri`, made from its name as `~/.claude/commands/<name>.md`"
  - "[code://packages/agent-claude/src/session/customizations.ts#L238-L276](../../packages/agent-claude/src/session/customizations.ts#L238-L276) - an agent's `uri`, the one kind that checks the file exists and falls back to an internal URI"
  - "[code://packages/agent-claude/src/session/customizations.ts#L72-L86](../../packages/agent-claude/src/session/customizations.ts#L72-L86) - one user directory per kind, and no `rules` directory"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `SlashCommand`, what `reloadSkills()` answers per skill: `name`, `description`, `argumentHint`, `aliases`, `builtin`, and no path
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/scan/claudeAgentSkillScan.ts - VS Code's Claude agent host reads `.claude/{agents,skills,commands}` of the project and the user from disk
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentPlugins/common/pluginParsers.ts#L1026-L1092 - `readSkills`, which takes `<dir>/<child>/SKILL.md` one level down and makes the `SKILL.md` file the skill's `uri`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/claudeSessionCustomizationDiscovery.ts#L273-L438 - `buildDiscoveredCustomizations`, which keeps a disk skill only when the SDK reports it, and moves the rest to a read-only container
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/claudeSessionCustomizationDiscovery.ts#L124-L180 - `mapDiscoveredCustomizations`, one writable `agents`, `skills` and `rules` directory per working directory and for the user, sent with no children too
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/claudeBuiltinCommands.ts#L162-L180 - `buildSdkBuiltinSkillsContainer`, the read-only `builtin` directory for an SDK skill with no file
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/scan/claudeRuleScan.ts - `scanClaudeRules`, the `CLAUDE.md` files and `.claude/rules/**/*.md` as rule customizations
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/claude/customizations/claudeSessionCustomizationDiscovery.ts#L443-L554 - `ClaudeCustomizationWatcher`, which watches `.claude` and the `CLAUDE.md` files and reads again
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.ts#L394 - the workbench names a skill by `basename(dirname(skill.uri))`, so it expects the `SKILL.md` file
  - file:///github/ahpd/.project/briefs/a-written-agent-shows-without-a-restart.md - the reload brief, whose watcher open point this brief answers from VS Code
  - https://code.claude.com/docs/en/skills - where the CLI reads skills, and which one wins on the same name
  - file:///github/ahpd/.project/briefs/a-hook-shows-and-is-made.md - the hooks brief, which sends the hooks in the settings files
  - file:///github/ahpw/.project/briefs/a-custom-agent-is-made-and-edited.md - the ahpw brief, which opens and edits these files
---

# A skill names its own file

In VS Code's Agent Customizations on a Claude session of ahpd, no skill opens.
The tooltip of `advisor` shows `/home/softov/.claude/skills/advisor`, a folder.
The tooltip of `anthropic-skills:deep-research` shows `/home/softov/.claude/skills/anthropic-skills:deep-research`, a path that does not exist.
A Copilot session shows `...\agent-evaluation\SKILL.md` for the same kind of row, and opens it.
Softov wants each skill to name the file it was read from, so a client can open and edit it.
The `CLAUDE.md` files and `.claude/rules` show nowhere today, and the same goal applies to them.
The hooks in `settings.json` are in [a-hook-shows-and-is-made.md](a-hook-shows-and-is-made.md).

## What others do

### The Claude CLI

The Claude Code documentation names four places for a skill, each as `<place>/skills/<name>/SKILL.md`:

| Place | Path |
| --- | --- |
| Enterprise | `.claude/skills/` in the managed settings directory |
| Personal | `~/.claude/skills/` |
| Project | `<working directory>/.claude/skills/` |
| Plugin | `<plugin>/skills/`, run as `/<plugin>:<name>` |

- On the same name, enterprise wins over personal, and personal wins over project.
- A plugin skill never shares a name, because of its namespace.
- A skill wins over a file in `.claude/commands/` with the same name.

### VS Code

VS Code at `171e90619c7` has its own Claude agent host, `src/vs/platform/agentHost/node/claude/`.
It does not take a path from the SDK either. It reads the files from disk and then matches them with what the SDK reports.

- It reads `<scope>/.claude/agents/*.md`, `<scope>/.claude/skills/<name>/SKILL.md` and `<scope>/.claude/commands/*.md`.
  A scope is each working directory first, then the user home.
- On the same name, VS Code keeps the project skill over the user skill. This is the reverse of the CLI's order.
- A skill's `uri` is its `SKILL.md` file, and its name and description come from the frontmatter.
  The workbench also takes a skill's name from the folder over that file.
- A disk skill is kept only when the SDK reports a command with the same name.
- An SDK skill with no file goes in a separate directory named `builtin`, with `writable: false`.
  Each child of it has a URI in the agent-builtin scheme, which no client opens, and shows only its name.
- An SDK agent with no file keeps a `claude-internal:/agent/<name>` URI, so a person can still pick it.
- A skill folder that holds a plugin manifest is shown under its plugin, not as a skill.
- Rules are `~/.claude/CLAUDE.md`, `./CLAUDE.md`, `./.claude/CLAUDE.md`, `./CLAUDE.local.md`, and `.claude/rules/**/*.md` of each scope.
  A rule with a `paths` glob in its frontmatter has `globs`; any other rule has `alwaysApply: true`.
- Each scope gets three writable directories, `agents`, `skills` and `rules`, at their real `<scope>/.claude/<kind>` paths.
  They are sent with no children too, so a person can make the first one.
- `ClaudeCustomizationWatcher` watches `<scope>/.claude` and the `CLAUDE.md` files, and reads again 300 ms after a change.
  It reacts only to `agents`, `skills`, `commands`, `rules`, `plugins`, `CLAUDE.md` and the settings files, because the CLI writes elsewhere in `.claude` all the time.

VS Code reads `readSkills` one level down. So the claude.ai skills at `~/.claude/skills/synced/<id>/<name>/SKILL.md` are not found on disk, and go to the read-only `builtin` directory.

Softov's screenshots of a VS Code Claude session on `opendoop` show the result:

- User holds `~/.claude/skills/<name>/SKILL.md`, and Workspace holds the chat folder's `.claude/skills/<name>/SKILL.md`.
- Built-in holds VS Code's own skills, at `<VS Code>/resources/app/out/vs/sessions/skills/<name>/SKILL.md`, and the CLI's skills with their name only.
  `code-review` shows twice there, once from each.
- Instructions shows 11 rules.

## What ahpd has today

- The SDK's `SlashCommand` has a name, a description and an argument hint, and no path.
- A user skill gets `~/.claude/skills/<name>`, the folder and not the file ([`code://packages/agent-claude/src/session/customizations.ts`](../../packages/agent-claude/src/session/customizations.ts#L188-L218)).
- A plugin skill gets `<plugin path>/skills/<bare name>`, also a folder.
- Nothing checks that the path exists.
  On Softov's machine `~/.claude/skills` holds `advisor`, `do-spec`, `tasker` and `synced`. Every other skill in the list names a path that does not exist.
- The claude.ai skills are in `~/.claude/skills/synced/<id>/<name>/SKILL.md`, with a `manifest.json` beside them that lists each `name` and `skillId`.
- A CLI skill such as `code-review` or `claude-api` has no file, and still gets a `file:` URI.
- A command gets `~/.claude/commands/<name>.md` with no check either ([`code://packages/agent-claude/src/session/customizations.ts`](../../packages/agent-claude/src/session/customizations.ts#L220-L236)).
- An agent checks the file with `existsSync`, and falls back to an internal URI ([`code://packages/agent-claude/src/session/customizations.ts`](../../packages/agent-claude/src/session/customizations.ts#L238-L276)).
- No project directory is sent, so VS Code's Workspace group is empty.
- No `rules` directory is sent. `CLAUDE.md` reaches the CLI, but no client sees it.
- ahpw adds `/SKILL.md` to a skill URI that does not end in `.md`. That works for `advisor` and fails for the paths that do not exist.

## Who writes

- `packages/agent-claude/src/session/customizations.ts`: no open branch or worktree changes it at `9e87c164`.
- The reload brief changes when this list is read, not how. Both briefs touch `customizations.ts`, so they are built one after the other.
- ahpw's `fileSpotOf` in `src/resources/agents/words.ts` reads the skill URI. It keeps working when the URI ends in `SKILL.md`.

## The change

- The Claude backend reads the skill, command, agent and rule files from disk, as VS Code does.
  It matches them by name with what the SDK reports.
- A skill's `uri` is its `SKILL.md` file. A command's and an agent's `uri` is its `.md` file.
- The disk read covers `~/.claude/skills/synced/<id>/<name>/SKILL.md` too, which VS Code does not.
- The disk read covers the project scope, `<working directory>/.claude/<kind>`, in this change. Softov, 2026-10-30: "this I think".
  Each scope gets its own writable directories, so a client shows User and Workspace groups.
- A writable directory is sent with no children too, as VS Code does. Softov, 2026-10-30: "yes, send them".
- On the same name, the skill the CLI runs is the one listed: personal over project, and a skill over a command. Softov, 2026-10-30: "preference for the one that the harness will use".
- A skill, command or agent that the SDK reports and the disk read does not find gets an internal URI, never a `file:` URI.
- SDK skills with no file go in one read-only `builtin` directory, as VS Code does. Softov, 2026-10-30: "yes".
  Each one shows its name, and its description when the SDK gives one.
- The rules are sent as a `rules` directory per scope, with the `CLAUDE.md` files and `.claude/rules/**/*.md`.
- ahpw can then drop its `/SKILL.md` suffix, because the host names the file.

## Open points

- Whether the enterprise skills in the managed settings directory are read too.
- Not checked: whether the CLI reads `~/.claude/skills/synced/` itself, or gets these skills another way.
  ahpd shows one of them as `anthropic-skills:deep-research` and another as `built-in-browser`, so the match by name needs both forms.
