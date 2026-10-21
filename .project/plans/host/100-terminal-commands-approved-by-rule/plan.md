---
title: Terminal commands approved by rule
domain: host
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
decisions: []
refs:
  - "[code://packages/sdk/src/vscoderootconfig.ts#L94-L100](../../../../packages/sdk/src/vscoderootconfig.ts#L94-L100) - `terminalAutoApproveEnabled` is declared, default true, and nothing reads it"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L326-L331](../../../../packages/sdk/src/vscoderootconfig.ts#L326-L331) - `terminalAutoApproveRules` is declared, default `{}`, and nothing reads it"
  - "[code://packages/sdk/src/host/gate.ts#L274-L298](../../../../packages/sdk/src/host/gate.ts#L274-L298) - a push of keys outside `PER_CONNECTION` needs `config:change`"
  - "[code://packages/sdk/src/host/gate.ts#L342](../../../../packages/sdk/src/host/gate.ts#L342) - `PER_CONNECTION` holds `defaultShell` and `workspaceTrust`"
  - "[code://packages/sdk/src/host/root.ts#L557-L567](../../../../packages/sdk/src/host/root.ts#L557-L567) - a per-connection key is dropped from the host's half"
  - "[code://packages/sdk/src/host/spawn.ts#L648-L661](../../../../packages/sdk/src/host/spawn.ts#L648-L661) - `trustedBy` answers from the owner's connection, the pattern for a per-session check"
  - "[code://packages/sdk/src/types/agent.ts#L183](../../../../packages/sdk/src/types/agent.ts#L183) - `trusted` on `Start`, the shape of the new field"
  - "[code://packages/sdk/src/host/trust.ts#L150-L163](../../../../packages/sdk/src/host/trust.ts#L150-L163) - `autoApproved`, used only for workspace trust"
  - "[code://packages/agent-claude/src/session/asking.ts#L174-L180](../../../../packages/agent-claude/src/session/asking.ts#L174-L180) - `settled` and `canUseTool`, where Claude asks"
  - "[code://packages/agent-claude/src/session/query.ts#L377-L379](../../../../packages/agent-claude/src/session/query.ts#L377-L379) - the `PreToolUse` hook on `Bash`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L285-L340](../../../../packages/agent-acp/src/session/handlers.ts#L285-L340) - `askPermission`, where an ACP agent asks"
  - "[code://packages/agent-pi/src/session.ts#L320-L330](../../../../packages/agent-pi/src/session.ts#L320-L330) - `PI_EFFECTS`: bash and powershell are destructive"
  - "[code://packages/agent-pi/src/session.ts#L385-L438](../../../../packages/agent-pi/src/session.ts#L385-L438) - `decide`, where pi asks"
  - "[code://packages/agent-cofold/src/mapping.ts#L511-L580](../../../../packages/agent-cofold/src/mapping.ts#L511-L580) - `approval.requested`, where cofold asks"
  - "[code://packages/agent-cofold/src/pauses.ts#L139-L180](../../../../packages/agent-cofold/src/pauses.ts#L139-L180) - `confirm`, which answers cofold"
  - "[code://packages/agent-cofold/src/tools.ts#L170-L197](../../../../packages/agent-cofold/src/tools.ts#L170-L197) - `shell_exec`, cofold's shell tool"
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the root config keys the host acts on"
  - "[code://packages/sdk/test/root-config.test.ts#L185-L212](../../../../packages/sdk/test/root-config.test.ts#L185-L212) - the pushed keys, both terminal keys included"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L298](../../../../packages/sdk/src/vscoderootconfig.ts#L298) - `editAutoApprovePatterns`, declared and not read"
  - "[code://packages/sdk/src/types/plugin.ts#L351-L366](../../../../packages/sdk/src/types/plugin.ts#L351-L366) - `PortKey`, the ports a plugin can register"
  - "[code://packages/sdk/src/plugins/plugins.ts#L835-L842](../../../../packages/sdk/src/plugins/plugins.ts#L835-L842) - `setPort`, one registration per port, with `replace`"
  - "[code://packages/server/src/config.ts#L318-L323](../../../../packages/server/src/config.ts#L318-L323) - `plugins`, the one key whose value is code today"
  - "[code://.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md](../../../../.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md) - the host remembers no approval"
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L130-L171 - `CommandApprovalResult` and `IShouldAutoApproveOptions`
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L286-L352 - `evaluate` and `_matchSubCommands`: deny first, then allow
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L483-L520 - `_compileRules` falls back to the default table, and the value shape
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/commandAutoApprover.ts#L590 - `DEFAULT_TERMINAL_AUTO_APPROVE_RULES`, the table to port
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/sessionPermissions.ts#L248 - `getAutoApproval`, the single entry point
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/sessionPermissions.ts#L334-L354 - the shell step: denied means ask
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/node/sessionPermissions.ts#L584-L597 - write redirects checked against the edit rules
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/common/agentHostSchema.ts#L689-L714 - the `terminalAutoApproveRules` types
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/browser/agentHostProtocolClient.ts#L2611-L2639 - VS Code pushes both keys host-wide
  - https://github.com/microsoft/vscode/blob/a959ba62444/src/vs/platform/agentHost/test/node/commandAutoApprover.test.ts - the cases to port
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `ToolCallConfirmationReason` in `types/channels-chat/state.ts`: `not-needed`, `user-action`, `setting`
---

## Goal

A shell command runs without a question when every sub-command matches an allow rule and none matches a deny rule.
The rules are VS Code's `terminalAutoApproveRules`, and `terminalAutoApproveEnabled` turns them off.
A user who allows `git status` and `npm test` stops answering for them in every backend.
Other commands ask as they do now.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "terminalAutoApprove" packages/ docs/` - both keys are declared in `vscoderootconfig.ts` and listed in a test, and no code reads them.
- `git grep -n "PER_CONNECTION" packages/sdk/src` - two keys, kept per connection by the gate and by `root.ts`.
- `git grep -n "trusted" packages/sdk/src/types/agent.ts packages/sdk/src/host/spawn.ts` - `Start.trusted` is the one per-session check the host hands a backend.
- `git grep -n "canUseTool\|askPermission\|decide(\|approval.requested" packages/agent-*/src` - one place per backend where a tool call asks.
- `git grep -n "setPort\|PortKey" packages/sdk/src` - a plugin registers one value per port, with `replace` to take the daemon's over.
- In VS Code, `commandAutoApprover.ts` and `sessionPermissions.ts` under `src/vs/platform/agentHost/node`.

### Runtime path

```
owner's connection pushes the rules -> Start.<check> -> backend asks? -> split(line, shell) -> CommandAutoApprover.evaluate -> approved: confirmed not-needed / denied or noMatch: ask as now
```

### Gaps

- No code reads `terminalAutoApproveEnabled`, `terminalAutoApproveRules` or `editAutoApprovePatterns`.
- `Not found: a shell parser - searched "tree-sitter\|shell-quote\|splitCommand" in packages/`.
- `Not found: an approval check on Start - searched "approve" in packages/sdk/src/types/agent.ts`.
- The idea says the keys are not declared; they are, since VS Code `7516b04bc94`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The owner's connection's rules apply, as `trustedBy` does for `workspaceTrust` | Softov, 2026-10-16, chose "the owner's connection" for "Whose rules apply in a session that two clients drive" | p2 |
| The parser is a small splitter in the sdk that fails closed, behind one function `split(line, shell) -> { subCommands, writeDests, unanalyzable } \| undefined`; `undefined` means ask | Softov, 2026-10-16, chose "a small splitter in the sdk" for "Which parser splits the command line" | p1 |
| Another parser replaces the splitter in two ways: a plugin's `apply()` registers a `commandParser`, and a config key names a `.ts` or `.js` module whose default export is `split` | Softov, 2026-10-16, chose "Both" for "How another parser replaces the splitter" | p3 |
| No tree-sitter dependency in ahpd; a tree-sitter parser can be a plugin later, outside this plan | Softov, 2026-10-16, the same answer | p3 |
| When no client pushed rules, a daemon setting picks the rules; its default is VS Code's default table, and the other value is none | Softov, 2026-10-16, chose "Setting, default VS Code's table" for "What applies when no client pushed rules" | p1, p2 |
| All four backends are in scope | Softov, 2026-10-16, chose "All four" for "Which backends are in scope" | p4, p5 |
| A redirect into the working folder that matches `editAutoApprovePatterns` is allowed, as VS Code; any other redirect asks | Softov, 2026-10-16, chose "as VS Code" for "How a write redirect is checked" | p1, p6 |
| `editAutoApprovePatterns` comes from the owner's connection, as the terminal rules do | (defaulted: one source for the three keys) | p2 |
| The keys and the value shape are VS Code's: a rule is `true`, `false` or `{ approve, matchCommandLine }` | (defaulted: upstream parity, `_compileRuleEntries`) | p1 |
| A key in `/.../flags` form is a regular expression; any other key is a prefix of a sub-command | (defaulted: as VS Code) | p1 |
| The names are VS Code's: `CommandAutoApprover`, `evaluate`, `CommandApprovalResult` | (defaulted: upstream parity) | p1 |
| A deny rule makes the call ask; it does not refuse it | (defaulted: as VS Code, `sessionPermissions.ts` L334-L354) | p1, p4, p5 |
| An approved call is said with `confirmed: 'not-needed'` | (defaulted: as VS Code, `NotNeeded`) | p4, p5 |
| The check applies only where the backend would ask; `bypassPermissions` and `dontAsk` keep their answers | (defaulted: the rule narrows the questions and adds none) | p4, p5 |
| `terminalAutoApproveEnabled: false` turns the check off | (defaulted: as VS Code) | p2 |
| The host keeps no approval; a rule is read again on each call | [code://.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md](../../../../.project/decisions/each-backend-offers-its-options-unless-a-rule-asks.md) | p2 |
| This plan blocks host/101, which adds its check to the same seam | Softov, 2026-10-16, chose "one check on `Start`, with this rule first" in host/101 | p2 |

## Proposed architecture

- **Data flow** - the owner's connection pushes the three keys. The host builds one check per session and hands it to the backend on `Start`, beside `trusted`. The backend calls it with the command line and the shell before it asks.
- **State flow** - the host keeps no state; the check reads the rules each time it runs.
- **Parser seam** - the check calls `split` through the `commandParser` port. The sdk's splitter fills the port unless a plugin or the hook module replaces it.
- **Layer responsibilities** - The sdk holds `split`, `CommandAutoApprover`, the port and the `Start` field. The server holds the setting for the default rules and the hook module key. Each backend calls the check where it asks today.
- **Source-of-truth files** - [`code://packages/sdk/src/vscoderootconfig.ts`](../../../../packages/sdk/src/vscoderootconfig.ts), `packages/sdk/src/access/commandautoapprover.ts` (new).
- **Blocks** - host/101 adds "always ask" to the same `Start` seam, in p2, and checks it first.
- **Matchers** - host/100 and host/101 share the seam, not the matcher. This plan matches command lines; host/101 matches tool names.

## Tasks

Child plans, each scoped to one package or two.

| Plan | Package | Status | Depends on |
| --- | --- | --- | --- |
| [p1 - A command is split and matched](../100-p1-a-command-is-split-and-matched/plan.md) | sdk | built | - |
| [p2 - A session gets its owner's command check](../100-p2-a-session-gets-its-owners-command-check/plan.md) | sdk, server | planned | p1 |
| [p3 - Another parser replaces the splitter](../100-p3-another-parser-replaces-the-splitter/plan.md) | sdk, server | built | p1 |
| [p4 - Claude and ACP ask only for unmatched commands](../100-p4-claude-and-acp-ask-for-unmatched-commands/plan.md) | agent-claude, agent-acp | built | p2 |
| [p5 - pi and cofold ask only for unmatched commands](../100-p5-pi-and-cofold-ask-for-unmatched-commands/plan.md) | agent-pi, agent-cofold | built | p2 |
| [p6 - The docs name the terminal rules](../100-p6-the-docs-name-the-terminal-rules/plan.md) | docs | built | p3, p4, p5 |

## Risks and tradeoffs

- A splitter that is wrong can approve a command that it should not. It fails closed: anything it cannot read asks.
- VS Code's default table approves some commands with no rule pushed. The daemon setting turns it off.
- A hook module is code that runs in the daemon, as a plugin is. Only the operator's config can name it.
- An ACP agent decides itself which calls it asks about, so the check runs only on the questions it sends.

## Resume state

- **Done so far:** drafted 2026-10-16 from `ideas/terminal-commands-approved-by-rule.md`. Softov answered the five questions 2026-10-16, and the plan became a parent of six children. Softov approved the close of p1, p3, p4, p5 and p6 on 2026-10-19, and they are built.
- **Next action:** the review and close of [p2](../100-p2-a-session-gets-its-owners-command-check/plan.md), which has no `implemented.md` yet.
- **Open questions:** none.
- **Watch out for:** the idea is stale on one point: both keys are declared already. The three keys join `PER_CONNECTION` in p2, and `root.ts` and the gate change with it.

## Final verification checklist

- [ ] Every child plan is `built`.
- [ ] Each backend runs an allowed command without a question and asks for another one.
- [ ] A deny rule and `terminalAutoApproveEnabled: false` each make the call ask.
- [ ] A plugin's parser and a hook module each replace the splitter.
- [ ] `plans/index.md` updated.
