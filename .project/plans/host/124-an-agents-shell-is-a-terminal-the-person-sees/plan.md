---
title: An agent's shell is a terminal the person sees
domain: host
status: planned
priority: medium
created: 2026-10-26
revalidated: 2026-10-26
changes:
  - specs/host-tools.md
decisions:
  - decisions/the-agent-terminal-tool-is-the-reference-hosts.md
refs:
  - "[code://packages/sdk/src/host/terminals.ts](../../../../packages/sdk/src/host/terminals.ts) - `heldTerminals`, the pattern for a terminal the host opens for a session"
  - "[code://packages/sdk/src/host/tooling.ts](../../../../packages/sdk/src/host/tooling.ts) - `contributingTo`, where a switch already withholds the session tools"
  - "[code://packages/sdk/src/vscoderootconfig.ts](../../../../packages/sdk/src/vscoderootconfig.ts) - the root config properties VS Code declares, one per key"
  - "[code://packages/sdk/src/machines/terminals.ts](../../../../packages/sdk/src/machines/terminals.ts) - `MARKS`, the reader of the shell's own OSC 133 marks"
  - "[code://packages/agent-claude/src/session/query.ts](../../../../packages/agent-claude/src/session/query.ts) - `denyOption`, where Claude's own task tools step aside"
  - "[code://packages/agent-pi/src/tools.ts](../../../../packages/agent-pi/src/tools.ts) - `PI_TOOLS`, the names pi keeps to itself"
  - "[code://packages/sdk/src/tools/server.ts](../../../../packages/sdk/src/tools/server.ts) - the tools endpoint, which runs a host tool for an ACP agent"
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts - the reference's `ShellManager` and its six tools
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts - the reference's command execution, with its sentinel and its five endings
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/common/copilotCliConfig.ts - `enableCustomTerminalTool` and its property
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotSessionLauncher.ts#L1348-L1355 - the switch, off under Windows
  - npm://@anthropic-ai/claude-agent-sdk@^0.3.301 - `disallowedTools` and `toolAliases`, the SDK's way to replace `Bash`
  - npm://@earendil-works/pi-coding-agent@^1.3.0 - a custom tool takes the place of a built-in of the same name
---

## Goal

An agent runs its shell commands in terminals the session holds.
The person in the session can watch a command, type into it and stop it.
The reference host gives an agent this as its agent terminal tool, and a client turns it on with a root config key.
This host gives every backend the same tools, by the same names and words.
A skill and a client written for the reference then work here.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "enableCustomTerminalTool|overridesBuiltInTool" packages docs` - nothing in this repository named either.
- `rg -n "terminal/claimed" packages/sdk/src` - a client's claim change reaches the terminal through `setClaim`, which emits `terminal/claimed`.
- `rg -n "\\.run\\(" packages/agent-*/src packages/sdk/src/tools` - four places run a bound tool: Claude's handler, pi's `execute`, cofold's `execute` and the tools endpoint.

### Runtime path

```
root/configChanged enableCustomTerminalTool -> tooling lists the six tools -> backend offers them, Claude aliases Bash
  -> bash call -> shells.acquire opens a terminal claimed by the call -> run writes the command
  -> the shell's D mark or the sentinel ends it -> the call answers Shell ID and the output
```

### Gaps

- `Not found: a way for an agent's own shell commands to run in a terminal a person sees - searched "terminal" in packages/agent-claude/src and packages/sdk/src/tools.`
- `Not found: the call id in BoundTool.run - searched "run(input" in packages.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| The tools are the reference's six, by name, schema, description and answer | Aaron, 2026-10-26: "if ahp describes it and ahpd doesnt support it yet spec that out as a feature contribution" | 01 |
| They are offered behind `enableCustomTerminalTool`, off by default and never under Windows, as the reference offers them | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotSessionLauncher.ts#L1348-L1355 | 01 |
| Every backend is offered them, because the tools are the host's own | (defaulted: the host tools reach every backend that can take tools) | 01 |
| A shell is a terminal on the root list, claimed by the session, the chat, the turn and the call | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L167-L230 | 01 |
| The claim names the turn the call runs in, where the reference names the call twice | (defaulted: the reference's tool handler has no turn id, and this host has one) | 01 |
| A command ends at the shell's `D` mark once the shell has marked a command, and at the reference's sentinel before that | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts#L191-L201 | 01 |
| The alternate screen and bracketed paste are read off the output, because this host keeps no terminal emulator | (defaulted: DECSET and DECRST 1049, 1047, 47 and 2004 are what an emulator reads) | 01 |
| A shell held past its call is released at its sentinel when it has no marks | (defaulted: the reference waits for a mark that a shell with none never sends) | 01 |
| Each tool acts as the person who sent the turn, with the grant of a client's own terminal action | (defaulted: a host tool acts as that person, as the session tools do) | 01 |
| `BoundTool.run` takes the call's id, and every backend that knows it passes it | (defaulted: the claim needs the id a client reads in `chat/toolCallStart`) | 01 |
| The tools carry `overridesBuiltInTool`, the reference's mark | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L450 | 02 |
| Claude disallows `Bash` and aliases it to `mcp__ahp__bash` | npm://@anthropic-ai/claude-agent-sdk@^0.3.301, `toolAliases` in `sdk.d.ts` | 02 |
| pi takes the host's `bash` in place of its own by name | npm://@earendil-works/pi-coding-agent@^1.3.0, `docs/containerization.md` | 02 |
| cofold and an ACP agent keep their own shell beside the host's | (defaulted: neither harness has a shell named `bash` to replace) | 02 |
| The tool is not the four `ahp_terminal_*` tools of this host's own | [decisions/the-agent-terminal-tool-is-the-reference-hosts.md](../../../decisions/the-agent-terminal-tool-is-the-reference-hosts.md) | 01 |

## Proposed architecture

- **Data flow** - a call goes from the backend's handler to `BoundTool.run` with its id, then to the tool, `ToolCall.shells()` and the session's shells.
- **Event flow** - the terminal's actions reach the session's shells through `heldShell`'s `watch`, after the host routes them.
- **State flow** - the session's shells keep what each shell said, with a running count, because the terminal's scrollback slides.
- **Layer responsibilities** - sdk: the shells, the tools, the switch and the call id. agent-claude and agent-pi: their shell steps aside. agent-cofold: passes the call id.
- **Source-of-truth files** - `packages/sdk/src/host/shells.ts` and `packages/sdk/src/tools/shell.ts`, which task 01 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host offers the agent terminal tool](task-01-the-host-offers-the-agent-terminal-tool.md) | todo | - |
| [02 - Each backend gives the host its shell](task-02-each-backend-gives-the-host-its-shell.md) | todo | 01 |

## Risks and tradeoffs

- A command that reads its standard input takes the sentinel's line where the shell has no marks, and the call waits for its timeout. The reference has the same sentinel.
- The reference shows a terminal in the call's own content, and this plan does not.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-host-offers-the-agent-terminal-tool.md](task-01-the-host-offers-the-agent-terminal-tool.md).
- **Open questions:**
  1. Does the call show its terminal in its content, as the reference's does - proposed: yes, as a later plan.
- **Watch out for:** a shell on pipes reads its commands from its input. A test that types into one reaches the shell, not a running command.

## Final verification checklist

- [ ] `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- [ ] A daemon from this tree offers the six tools after a client pushes `enableCustomTerminalTool`.
- [ ] `plans/index.md` updated.
