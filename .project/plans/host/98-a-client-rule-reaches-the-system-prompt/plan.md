---
title: A client rule reaches the system prompt
domain: host
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/agent.ts#L231-L238](../../../../packages/sdk/src/types/agent.ts#L231-L238) - `Start.instructions`, one entry per host tool today"
  - "[code://packages/sdk/src/host/tooling.ts#L1720-L1724](../../../../packages/sdk/src/host/tooling.ts#L1720-L1724) - `instructions`, made from the host tools only"
  - "[code://packages/sdk/src/host/tooling.ts#L1736-L1740](../../../../packages/sdk/src/host/tooling.ts#L1736-L1740) - `turnInstructions`, the per-turn route"
  - "[code://packages/sdk/src/host/spawn.ts#L673](../../../../packages/sdk/src/host/spawn.ts#L673) - the session start hands `instructions` to the backend"
  - "[code://packages/sdk/src/pluginparts.ts#L53-L55](../../../../packages/sdk/src/pluginparts.ts#L53-L55) - the rule suffixes `.mdc` and `.instructions.md`"
  - "[code://packages/sdk/src/pluginparts.ts#L181-L185](../../../../packages/sdk/src/pluginparts.ts#L181-L185) - `rulesIn`, which finds the rule files"
  - "[code://packages/sdk/src/pluginparts.ts#L328-L333](../../../../packages/sdk/src/pluginparts.ts#L328-L333) - `part`: a rule has no `description`, `alwaysApply` or `globs`"
  - "[code://packages/sdk/src/host/tooling.ts#L682-L734](../../../../packages/sdk/src/host/tooling.ts#L682-L734) - `partsWith`, `entryOf` and `clientPluginsOf`"
  - "[code://packages/sdk/src/host/tooling.ts#L1047-L1056](../../../../packages/sdk/src/host/tooling.ts#L1047-L1056) - `pluginsFor` and `pluginsMoved`"
  - "[code://packages/sdk/src/host/chatactions.ts#L526-L541](../../../../packages/sdk/src/host/chatactions.ts#L526-L541) - a moved plugin set restarts the chat between turns"
  - "[code://packages/agent-claude/src/session/query.ts#L305-L308](../../../../packages/agent-claude/src/session/query.ts#L305-L308) - Claude appends `instructions` to its preset prompt"
  - "[code://packages/agent-pi/src/session.ts#L736-L755](../../../../packages/agent-pi/src/session.ts#L736-L755) - pi takes `start.instructions`"
  - "[code://packages/agent-cofold/src/turnagent.ts#L295-L297](../../../../packages/agent-cofold/src/turnagent.ts#L295-L297) - cofold takes `start.instructions`"
  - "[code://docs/sdk/TOOLS.md#L104-L114](../../../../docs/sdk/TOOLS.md#L104-L114) - \"The wording a session is given\""
  - "file:///github/agent-host-protocol/types/channels-session/state.ts#L1105-L1131 - `RuleCustomization`, with `description`, `alwaysApply` and `globs`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/copilot/copilotAgent.ts#L7793-L7802 - VS Code's Copilot agent turns a rule into an `instructions` entry"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/copilot/copilotSessionLauncher.ts#L1174 - VS Code hands the plugin instruction folders to Copilot"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/copilot/copilotPluginConverters.ts#L248-L252 - `toSdkInstructionDirectories`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/claude/claudeSdkOptions.ts#L195-L206 - VS Code's Claude agent appends nothing to its preset prompt"
---

## Goal

An always-apply rule in a client's plugin reaches the agent's system prompt.
The client publishes the plugin on `SessionActiveClient.customizations`, so no new key is needed.
A client can then give standing instructions, such as how to format an answer for its screen.

## Reconnaissance

### Searches performed

- `rg -n "instructions" packages/sdk/src/host packages/sdk/src/types` - `Start.instructions` comes from the host tools only.
- `rg -n "RULE_SUFFIX|rulesIn|part\('rule'" packages/sdk/src/pluginparts.ts` - rules are listed by file name, with no frontmatter.
- `rg -n "instructions" packages/agent-*/src` - Claude, pi and cofold take it, and ACP does not.
- `rg -n "CustomizationType.Rule|instructionDirectories" /github/externals/vscode/src/vs/platform/agentHost` - the VS Code route for a rule.

### Runtime path

- A client announces its plugin -> `clientPluginsOf` copies it -> `pluginsFor` lists it for the session.
- The session starts -> `spawn.ts:673` hands `instructions(uri)` to the backend -> Claude, pi and cofold add them to the system prompt.
- A plugin set that moves -> `pluginsMoved` -> the chat restarts between turns -> the new start reads `instructions` again.

### Gaps

- `part` lists a rule with its name and URI only, so the host cannot tell an always-apply rule.
- `instructions(uri)` reads `ctx.contributing` only, and never the session's plugins.
- ACP has no system prompt, so an ACP backend cannot take a rule.
- VS Code's Copilot agent hands every plugin rule to Copilot, and VS Code's Claude agent hands none.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The rule comes from the client's plugin, not from an `_meta` key | Softov, 2026-10-16, chose "the client plugin" for "Where does the rule come from?" | 01, 02 |
| A rule's frontmatter fills `description`, `alwaysApply` and `globs` on its part | (defaulted: `RuleCustomization` in the protocol has these fields) | 01 |
| Host tool instructions come first, and rule bodies follow them | (defaulted: the host's own wording keeps its place) | 02 |
| Only a rule with `alwaysApply: true` applies | Softov, 2026-10-16, chose "`alwaysApply: true` only" for "Which rules apply?" | 01, 02 |
| A rule goes in at the session start, and the restart on a moved plugin set refreshes it | Softov, 2026-10-16, chose "at session start" for "When does a rule reach the agent?" | 02 |
| A backend with no system prompt logs once that it ignores the rules | Softov, 2026-10-16, chose "log once" for "A backend with no system prompt (ACP)?" | 02 |
| The rules have a length limit, and a rule over it is dropped | Softov, 2026-10-16, chose "yes, and drop a rule that is over it" for "A size limit?" | 02 |

## Proposed architecture

- **Data flow:** a client plugin -> `partsOf` reads each rule's frontmatter and body -> `instructions(uri)` adds the bodies of the rules that apply -> `Start.instructions`.
- **Layer responsibilities:** sdk: `pluginparts.ts` reads the rule, and `tooling.ts` adds it. agent-acp logs once. docs: `TOOLS.md`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A rule part carries its frontmatter](task-01-a-rule-part-carries-its-frontmatter.md) | todo | - |
| [02 - A client rule joins the instructions](task-02-a-client-rule-joins-the-instructions.md) | todo | 01 |
| [03 - The docs say how a client adds a rule](task-03-the-docs-say-how-a-client-adds-a-rule.md) | todo | 02 |

## Risks and tradeoffs

- A rule that changes reaches the agent only after the restart between turns, as a plugin change does now.
- A long rule costs tokens on every turn of every chat in the session.
- A client in a shared session adds words that every other client's turns also read.

## Resume state

- **Done so far:** drafted 2026-10-16 from the idea `a-client-adds-to-the-system-prompt.md`. Planned 2026-10-16 with Softov's answers.
- **Next action:** build task 01.
- **Open questions:** none.
- **Watch out for:**
  - `instructions(uri)` also feeds the remote origin instruction, so keep that order.
  - A rule from a client that leaves the session must leave the next start.
  - The number for the length limit is not chosen. Task 02 proposes one in Resume and asks before it builds it.

## Final verification checklist

- [ ] A test: an always-apply rule in a client plugin is in `Start.instructions`.
- [ ] A test: a rule without `alwaysApply: true`, and a rule over the limit, are not in it.
- [ ] A test: a rule from a client that left is gone after the restart.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [ ] By hand: a Claude session follows a rule from a client plugin.
- [ ] `plans/index.md` updated.
