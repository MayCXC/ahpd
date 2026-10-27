---
title: An agent's shell is a terminal the person sees
domain: host
status: built
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
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostHeadlessTerminal.ts - the screen the reference reads the alternate buffer and bracketed paste off
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts - the terminal manager the reference's shells run on
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L7535-L7553 - the reference reads its shell tool's calls as shell requests
  - npm://@xterm/headless@^6.0.0 - the emulator the reference's headless terminal is built on
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `TerminalSessionClaim`, the claim a shell carries
  - "[code://packages/sdk/src/machines/terminals.ts#L292-L296](../../../../packages/sdk/src/machines/terminals.ts#L292-L296) - the terminal keeps its last 200,000 characters"
  - "[code://packages/sdk/src/machines/terminals.ts#L423](../../../../packages/sdk/src/machines/terminals.ts#L423) - a chunk's marks are read before the chunk is said"
  - "[code://packages/sdk/src/machines/terminals.ts#L540](../../../../packages/sdk/src/machines/terminals.ts#L540) - the content is one `unclassified` part"
  - "[code://packages/sdk/src/host/lifecycle.ts#L1382-L1389](../../../../packages/sdk/src/host/lifecycle.ts#L1382-L1389) - a `!` command's folder and claim"
  - "[code://packages/sdk/src/tools/session.ts#L280-L282](../../../../packages/sdk/src/tools/session.ts#L280-L282) - `allowed`, the session tools' refusal by grant"
  - "[code://packages/sdk/src/host/gate.ts#L86-L87](../../../../packages/sdk/src/host/gate.ts#L86-L87) - the grants a client's terminal methods ask"
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L2261-L2280 - the reference puts a call's terminal on the call's content
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L9417-L9422 - and keeps it on the call it completes
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L9482-L9494 - a subagent's call completed on the subagent's chat
  - "[code://packages/sdk/src/host/spawn.ts#L463-L487](../../../../packages/sdk/src/host/spawn.ts#L463-L487) - a worker's link written on the call that spawned it, the pattern for content this host puts on a backend's call"
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
| Every backend is offered them, because the tools are the host's own | [code://packages/sdk/src/types/host.ts#L418-L427](../../../../packages/sdk/src/types/host.ts#L418-L427), a host's `tools` go to every session it runs and to the backend to offer the model | 01 |
| A shell is a terminal on the root list, claimed by the session, the chat, the turn and the call | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L167-L230 | 01 |
| The claim names the turn the call runs in, where the reference names the call twice | npm://@microsoft/agent-host-protocol@^1.0.0, `TerminalSessionClaim` in `dist/types/channels-terminal/state.d.ts`, whose `turnId` is the "turn identifier within the chat"; the reference's tool handler has no turn id, and this host has one | 01 |
| A command ends at the shell's `D` mark once the shell has marked a command, and at the reference's sentinel before that | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts#L191-L201 | 01 |
| The alternate screen and bracketed paste are read off a headless terminal fed with the shell's output | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostHeadlessTerminal.ts | 01 |
| `@xterm/headless` is a dependency of the sdk at `^6.0.0`, the stable release with the API the reference calls | Aaron, 2026-10-26, refusing the reference's prerelease range `^6.1.0-beta.303`: "why ... did you change the xterm dep to a beta version"; every member the reference calls is in 6.0.0 | 01 |
| A command's output is the terminal's content from where the command began, counted back from the end | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts#L300-L321, and this host's terminal drops its oldest character for each new one once it holds 200,000 | 01 |
| A shell held past its call is released at its sentinel when it has no marks | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts#L191-L201, where a shell with no marks ends its command at the sentinel; the shell is released when its command ends | 01 |
| Each tool acts as the person who sent the turn, with the grant of a client's own terminal action | [code://packages/sdk/src/tools/session.ts#L269-L282](../../../../packages/sdk/src/tools/session.ts#L269-L282), `allowed`, which refuses a session tool as the turn's person, in the words a client is refused in | 01 |
| `BoundTool.run` takes the call's id, and every backend that knows it passes it | npm://@microsoft/agent-host-protocol@^1.0.0, `TerminalSessionClaim.toolCallId` in `dist/types/channels-terminal/state.d.ts`, the id a client reads in `chat/toolCallStart` in `dist/types/channels-chat/actions.d.ts` | 01 |
| The tools carry `overridesBuiltInTool`, the reference's mark | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L450 | 02 |
| Claude disallows `Bash` and aliases it to `mcp__ahp__bash` | npm://@anthropic-ai/claude-agent-sdk@^0.3.301, `toolAliases` in `sdk.d.ts` | 02 |
| pi takes the host's `bash` in place of its own by name | npm://@earendil-works/pi-coding-agent@^1.3.0, `docs/containerization.md` | 02 |
| cofold and an ACP agent keep their own shell beside the host's | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L450, `overridesBuiltInTool`, which replaces a built-in tool of the same name; npm://@cofold/agents@0.4.0 has no tool named `bash`, and an ACP agent's tools are the agent's own | 02 |
| The tool is not the four `ahp_terminal_*` tools of this host's own | [decisions/the-agent-terminal-tool-is-the-reference-hosts.md](../../../decisions/the-agent-terminal-tool-is-the-reference-hosts.md) | 01 |
| A call shows its shell's terminal in its content, built with the tool | Aaron, 2026-10-27, on the proposal that a call show its terminal: "the proposal makes sense to me what are you basing the idea off of and why would we save it for an upstream conversation"; https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L2261-L2280 | 03 |
| The host writes the terminal on the backend's call, the way it writes a worker's link | [code://packages/sdk/src/host/spawn.ts#L463-L487](../../../../packages/sdk/src/host/spawn.ts#L463-L487) | 03 |
| The terminal stays on the call's later content and on the call it completes | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L9417-L9422 | 03 |
| A subagent's call carries its terminal once completed, in the worker's chat | https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L9482-L9494, the completion emitted on the subagent's chat, and `#L2273-L2278`, the live write on the session's | 03 |
| A completed command's code is the terminal's `result.exitCode` | npm://@microsoft/agent-host-protocol@^1.0.0, `ToolResultTerminalContent.result` in `dist/types/channels-chat/state.d.ts`, filled in when the command exits | 03 |

## What decided each element

`VS` is `https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/`, and a line is that file's at that commit.
An element that is this host's adaptation names the primitive of this host that forced it.

| Element | Decided by | Task |
| --- | --- | --- |
| The switch `enableCustomTerminalTool`, its property and its default | `VS` `common/copilotCliConfig.ts#L34`, `#L246-L251` | 01 |
| Off under Windows, read when a session's tools are listed | `VS` `node/copilot/copilotSessionLauncher.ts#L1348-L1355` | 01 |
| Off on a host with no terminal store | adaptation: a host with no `terminals` port opens no terminal, [`code://docs/sdk/TERMINALS.md#L100`](../../../../docs/sdk/TERMINALS.md#L100) | 01 |
| The six names withheld together, beside the session tools' filter | [`code://packages/sdk/src/host/tooling.ts#L473-L479`](../../../../packages/sdk/src/host/tooling.ts#L473-L479), the `SESSION_TOOL_NAMES` pattern | 01 |
| `bash` or `powershell`: name, `command` and `timeout`, 120000 ms | `VS` `node/copilot/copilotShellTools.ts#L427-L450` | 01 |
| `read_bash`, `write_bash`, `bash_shutdown`, `list_bash`: names, schemas, words and answers | `VS` `node/copilot/copilotShellTools.ts#L547-L649` | 01 |
| The tool under the other shell's name, and its sentence | `VS` `node/copilot/copilotShellTools.ts#L651-L670` | 01 |
| The descriptions, with the sandbox off | `VS` `node/copilot/copilotShellTools.ts#L676-L841` | 01 |
| The shell type, zsh, and the history space | `VS` `node/shared/shellCommandExecution.ts#L42-L87`, `node/agentHostShellUtils.ts#L9-L14` | 01 |
| The answers: `Shell ID`, exit code, timeout, background, alternate buffer, exit | `VS` `node/copilot/copilotShellTools.ts#L330-L372`, `#L31` | 01 |
| An idle shell taken again, a busy one passed over, an exited one dropped | `VS` `node/copilot/copilotShellTools.ts#L167-L190` | 01 |
| A new shell: a terminal titled `Bash` or `PowerShell` with the non-interactive variables | `VS` `node/copilot/copilotShellTools.ts#L192-L226`, `node/agentHostTerminalManager.ts#L344-L356` | 01 |
| The terminal opened with no command and the caller's claim | adaptation: [`code://packages/sdk/src/host/terminals.ts#L200`](../../../../packages/sdk/src/host/terminals.ts#L200), `heldTerminals` names the claim itself | 01 |
| The folder a new shell opens in | adaptation: the session's first folder, as a `!` command's, [`code://packages/sdk/src/host/lifecycle.ts#L1382`](../../../../packages/sdk/src/host/lifecycle.ts#L1382) | 01 |
| The shell's program | adaptation: the store's own default, [`code://packages/sdk/src/machines/terminals.ts#L107-L115`](../../../../packages/sdk/src/machines/terminals.ts#L107-L115) | 01 |
| A held reference released once | `VS` `node/copilot/copilotShellTools.ts#L228-L241` | 01 |
| `get`, `list` and `shutdown` | `VS` `node/copilot/copilotShellTools.ts#L275-L301` | 01 |
| The shells' screens let go with the session | `VS` `node/copilot/copilotShellTools.ts#L84-L96` | 01 |
| Two ways to end a command, chosen once per command | `VS` `node/shared/shellCommandExecution.ts#L191-L201` | 01 |
| The marks are on once the shell has marked a command | `VS` `node/agentHostTerminalManager.ts#L709-L715`; adaptation: a `C` or `D` read by [`code://packages/sdk/src/machines/terminals.ts#L369-L404`](../../../../packages/sdk/src/machines/terminals.ts#L369-L404) | 01 |
| A marked command ends at its `D`, with the mark's code | `VS` `node/shared/shellCommandExecution.ts#L221-L283` | 01 |
| Its output is the content between its `C` and its `D` | adaptation: the content is one part, [`code://packages/sdk/src/machines/terminals.ts#L540`](../../../../packages/sdk/src/machines/terminals.ts#L540) | 01 |
| A `D` before the announced `C` in one chunk is not the command's | adaptation: marks are read before the chunk is said, [`code://packages/sdk/src/machines/terminals.ts#L423`](../../../../packages/sdk/src/machines/terminals.ts#L423) | 01 |
| The sentinel line, its spelling, and its parse past its own echo | `VS` `node/shared/shellCommandExecution.ts#L30`, `#L102-L132` | 01 |
| The command, then the sentinel, each typed and executed | `VS` `node/shared/shellCommandExecution.ts#L360-L366` | 01 |
| The output from where the command began, clamped once trimmed | `VS` `node/shared/shellCommandExecution.ts#L300-L321` | 01 |
| That place counted back from the end | adaptation: the terminal drops its oldest character once full, [`code://packages/sdk/src/machines/terminals.ts#L292-L296`](../../../../packages/sdk/src/machines/terminals.ts#L292-L296) | 01 |
| The output a model reads: no control sequences, the last 80,000 characters | `VS` `node/shared/shellCommandExecution.ts#L18`, `#L139-L145`, and VS Code's `src/vs/base/common/strings.ts#L847-L886` | 01 |
| The timeout, and the output it answers with | `VS` `node/shared/shellCommandExecution.ts#L349-L355` | 01 |
| The shell's exit | `VS` `node/shared/shellCommandExecution.ts#L335-L340` | 01 |
| A client's narrowed claim moves the command to the background | `VS` `node/shared/shellCommandExecution.ts#L342-L347`, and the protocol's `TerminalSessionClaim` | 01 |
| A command typed as a paste only when asked and the shell has the mode on | `VS` `node/shared/shellCommandExecution.ts#L94-L96`, `node/agentHostTerminalManager.ts#L530-L538` | 01 |
| A carriage return under a pseudoterminal | `VS` `node/agentHostTerminalManager.ts#L107-L116` | 01 |
| A newline on pipes | adaptation: a shell on pipes reads lines, [`code://docs/sdk/TERMINALS.md#L29`](../../../../docs/sdk/TERMINALS.md#L29) | 01 |
| The screen: an `@xterm/headless` terminal with no scrollback, fed in order | `VS` `node/agentHostHeadlessTerminal.ts#L31-L85`, `node/agentHostTerminalManager.ts#L34`, `#L427-L432` | 01 |
| Bracketed paste and the alternate screen read off the screen | `VS` `node/agentHostHeadlessTerminal.ts#L91-L119`, `node/shared/shellCommandExecution.ts#L203-L214` | 01 |
| The screen resized and wiped with the terminal | `VS` `node/agentHostTerminalManager.ts#L610-L618`, `node/agentHostHeadlessTerminal.ts#L121-L125` | 01 |
| The screen's first size, 80 by 24 | adaptation: the store's own default size, [`code://packages/sdk/src/machines/terminals.ts#L270-L271`](../../../../packages/sdk/src/machines/terminals.ts#L270-L271) | 01 |
| `@xterm/headless` at `^6.0.0` | VS Code's `package.json#L145` declares the prerelease `^6.1.0-beta.303`; the stable 6.0.0 has every member of it that this port calls, as `node/agentHostHeadlessTerminal.ts` calls them (`modes.bracketedPasteMode`, `buffer.active`, `buffer.alternate`, `buffer.onBufferChange`, `write`, `resize`, `dispose`), shown by this plan's tests and its runs on Node and Bun | 01 |
| A held shell released at its `D`, or at its exit | `VS` `node/copilot/copilotShellTools.ts#L242-L256` | 01 |
| A held shell with no marks released at its sentinel | adaptation: a shell that marks nothing sends no `D`, and the sentinel follows its command | 01 |
| A hold that finds its command already over releases at once | `VS` `node/agentHostHeadlessTerminal.ts#L108-L116`, which looks before it listens | 01 |
| The claim names the turn the call runs in | adaptation: `ToolCall.turn()`, [`code://packages/sdk/src/types/host.ts#L919`](../../../../packages/sdk/src/types/host.ts#L919) | 01 |
| Each tool asks the grant a client's own terminal action asks | adaptation: [`code://packages/sdk/src/host/gate.ts#L86-L87`](../../../../packages/sdk/src/host/gate.ts#L86-L87), `#L195`, `#L267` | 01 |
| A refusal by grant in the session tools' words | [`code://packages/sdk/src/tools/session.ts#L280-L282`](../../../../packages/sdk/src/tools/session.ts#L280-L282) | 01 |
| A failed call is a thrown error the backend answers as `isError` | [`code://packages/sdk/src/tools/server.ts#L265-L270`](../../../../packages/sdk/src/tools/server.ts#L265-L270) | 01 |
| `bash` declares its effects; the other five take no confirmation | `VS` `node/copilot/copilotShellTools.ts#L557`, `#L585`, `#L607`, `#L630`, `#L663`, each `skipPermission`; [`code://packages/sdk/src/types/host.ts#L810`](../../../../packages/sdk/src/types/host.ts#L810) | 01 |
| `overridesBuiltInTool` on the six | `VS` `node/copilot/copilotShellTools.ts#L450` and each tool's own | 02 |
| `BoundTool.run` told the call's id | `VS` `node/copilot/copilotShellTools.ts#L451-L457`, the handler's `invocation.toolCallId` | 01 |
| Claude names the call on `_meta['claudecode/toolUseId']` | [`code://packages/agent-claude/src/session/clienttools.ts#L38-L45`](../../../../packages/agent-claude/src/session/clienttools.ts#L38-L45) | 02 |
| The tools endpoint reads the same key | [`code://packages/agent-acp/src/session/clientcalls.ts#L26`](../../../../packages/agent-acp/src/session/clientcalls.ts#L26) | 01 |
| pi and cofold pass the id their own call has | adaptation: pi's `execute(toolCallId)` and cofold's `ctx.callId`, the ids their rows carry | 02 |
| Claude denies `Bash` and aliases it to `mcp__ahp__bash` | npm://@anthropic-ai/claude-agent-sdk@^0.3.301, `sdk.d.ts#L1635`, `#L1636-L1661` | 02 |
| Claude reads the mark rather than the name | `VS` `node/copilot/copilotShellTools.ts#L450`; the deny list's pattern, [`code://packages/agent-claude/src/options.ts#L123`](../../../../packages/agent-claude/src/options.ts#L123) | 02 |
| The owner's terminal rules approve the host's shell as `Bash` | `VS` `node/copilot/copilotAgentSession.ts#L7535-L7553` | 02 |
| pi takes the marked `bash` in place of its own | pi's `docs/containerization.md#L181`, and `dist/core/agent-session.js#L2865` at 1.3.0 | 02 |
| cofold and an ACP agent keep their own shell | `VS` `overridesBuiltInTool` replaces a tool of the same name; neither has one named `bash` | 02 |
| `shell-tools.test.ts`, through the CLI's handler | [`code://packages/sdk/test/host-tools.test.ts#L111-L127`](../../../../packages/sdk/test/host-tools.test.ts#L111-L127) | 01 |
| Its fake pseudoterminal | [`code://packages/sdk/test/pty.test.ts#L21-L41`](../../../../packages/sdk/test/pty.test.ts#L21-L41) | 01 |
| `agent-claude-shell.test.ts` | [`code://packages/agent-claude/test/agent-claude-tasks.test.ts#L58-L88`](../../../../packages/agent-claude/test/agent-claude-tasks.test.ts#L58-L88) | 02 |
| The new cases in the autoapproval, pi, cofold, tools endpoint and root config tests | each file's own cases beside them | 01, 02 |
| `docs/sdk/TOOLS.md`, `TERMINALS.md`, `HOST.md` and `AHP.md` | each page's sections for a host tool, a way in, and a root config key | 01 |
| The two READMEs | `packages/agent-claude/README.md`'s tasks section, and `packages/agent-pi/README.md`'s tools line | 02 |
| `specs/host-tools.md` scenarios | the spec's `WHEN`, `THEN` and `AND` form | 01 |
| The CHANGELOG under `0.14.1 - unreleased` | `git://3fabd578`, which wrote `0.14.0 - unreleased` before that release; [code://.project/plans/daemon/40-a-daemon-starts-with-no-backend/plan.md#L26](../../../../.project/plans/daemon/40-a-daemon-starts-with-no-backend/plan.md#L26), "This ships as 0.14.1" | 01 |
| The decision, `proposed` | the do-spec skill: a decision is written with the maintainer's agreement | 01 |
| A call's terminal recorded on both ways a shell is acquired | `VS` `node/copilot/copilotShellTools.ts#L189`, `#L219`, `#L258-L265` | 03 |
| The block: `terminal`, the shell's terminal, `Bash` or `PowerShell` | `VS` `node/copilot/copilotShellTools.ts#L262`, `node/copilot/copilotAgentSession.ts#L2267-L2271` | 03 |
| `isPty: false` on pipes, and nothing on a pseudoterminal | `VS` `node/copilot/copilotAgentSession.ts#L11972-L11977` and `#L9456-L9462` mark a terminal that is not a pseudoterminal, and `#L2267-L2271` marks none | 03 |
| Written as `chat/toolCallContentChanged` with what the call holds, while its chat has a turn open | adaptation: the backend writes its own calls, so the host writes on one as it writes a worker's link, [`code://packages/sdk/src/host/spawn.ts#L463-L487`](../../../../packages/sdk/src/host/spawn.ts#L463-L487) | 03 |
| Calls keyed by their session and id | `VS` `node/copilot/copilotShellTools.ts#L57`, `#L259`, a call's shell kept by the call's id; adaptation: a call id is unique within its session, and a call is looked up under the session `sessionHolding` names for its chat, [`code://packages/sdk/src/host/routing.ts#L375-L377`](../../../../packages/sdk/src/host/routing.ts#L375-L377) | 03 |
| The terminal kept on the call's later content and its completion | `VS` `node/copilot/copilotAgentSession.ts#L9417-L9422`; adaptation: rewritten in `dispatch` beside `withWorkerUri`, [`code://packages/sdk/src/host.ts#L773`](../../../../packages/sdk/src/host.ts#L773), since the reducer builds a completed call from its result alone | 03 |
| The exit set on a block the content already holds | `VS` `node/copilot/mapSessionEvents.ts#L237-L240` | 03 |
| The code of a completed command only | the protocol's `ToolResultTerminalContent.result`, "the command's exit, not the terminal's", `dist/types/channels-chat/state.d.ts#L1541-L1544` at 1.0.0; the code as the call's answer names it, `VS` `node/copilot/copilotShellTools.ts#L333` | 03 |
| `result` holds the code alone | the reference's own tool answers in text and gives its terminal no `result`, `VS` `node/copilot/copilotShellTools.ts#L313-L319`; the protocol's `preview` and `truncated` are optional, and the call's answer carries the output | 03 |
| A live chat's turns stamped for a late subscriber | adaptation: a chat's state is its backend's, and `stampedCalls` stamps a spawning call there the same way, [`code://packages/sdk/src/host/snapshots.ts#L365-L373`](../../../../packages/sdk/src/host/snapshots.ts#L365-L373) | 03 |
| A worker chat's folded turns stamped the same way | adaptation: `sendSubagent` folds an action into the worker's state before `dispatch` rewrites it, [`code://packages/sdk/src/host/spawn.ts#L371-L377`](../../../../packages/sdk/src/host/spawn.ts#L371-L377), so the worker's snapshot is stamped where it is served, [`code://packages/sdk/src/host/snapshots.ts#L291-L317`](../../../../packages/sdk/src/host/snapshots.ts#L291-L317) | 03 |
| A session's calls forgotten with its shells | adaptation: `forgetSession`, which the session's deletion already calls | 03 |
| `shell-call-terminal.test.ts`, a backend that writes its own calls | [`code://packages/sdk/test/subagent-link.test.ts`](../../../../packages/sdk/test/subagent-link.test.ts) | 03 |

## Proposed architecture

- **Data flow** - a call goes from the backend's handler to `BoundTool.run` with its id, then to the tool, `ToolCall.shells()` and the session's shells.
- **Event flow** - the terminal's actions reach the session's shells through `heldShell`'s `watch`, after the host routes them. A call's terminal goes on the call as `chat/toolCallContentChanged`, and `dispatch` keeps it on the call's later actions.
- **State flow** - each shell has a headless terminal fed with what it says, and each command counts what the terminal has said since it began. The host keeps, by chat and call id, the terminal each call shows, with a completed command's code.
- **Layer responsibilities** - sdk: the shells, the tools, the switch and the call id. agent-claude and agent-pi: their shell steps aside. agent-cofold: passes the call id.
- **Source-of-truth files** - [`code://packages/sdk/src/host/shells.ts`](../../../../packages/sdk/src/host/shells.ts), [`code://packages/sdk/src/tools/shell.ts`](../../../../packages/sdk/src/tools/shell.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host offers the agent terminal tool](task-01-the-host-offers-the-agent-terminal-tool.md) | done | - |
| [02 - Each backend gives the host its shell](task-02-each-backend-gives-the-host-its-shell.md) | done | 01 |
| [03 - A call shows its terminal](task-03-a-call-shows-its-terminal.md) | done | 01 |

## Risks and tradeoffs

- A command that reads its standard input takes the sentinel's line where the shell has no marks, and the call waits for its timeout. The reference has the same sentinel.
- A call a subagent makes shows its terminal only once it completes, as the reference's does. The live write goes to the chat the tool is bound to, the session's own, and names no call there. The completion in the worker's chat carries the terminal.

## Resume state

- **Done so far:** tasks 01 and 02, 2026-10-26; task 03, 2026-10-27.
- **Next action:** Softov reads [decisions/the-agent-terminal-tool-is-the-reference-hosts.md](../../../decisions/the-agent-terminal-tool-is-the-reference-hosts.md).
- **Open questions:** none.
- **Watch out for:** a shell on pipes reads its commands from its input. A test that types into one reaches the shell, not a running command.

## Final verification checklist

- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- [x] A daemon from this tree offers the six tools after a client pushes `enableCustomTerminalTool`.
- [x] A call of `bash` shows its terminal on the wire while it runs and on the call it completes.
- [x] `plans/index.md` updated.
