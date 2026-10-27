---
title: Host tools
status: current
covers:
  - packages/sdk/src/tools/**
  - packages/sdk/src/utils/timing.ts
  - packages/sdk/src/host/tooling.ts
  - packages/sdk/src/connectors/actions.ts
  - packages/sdk/src/connectors/bindings.ts
decisions:
  - decisions/each-backend-offers-its-options-unless-a-rule-asks.md
  - decisions/the-agent-terminal-tool-is-the-reference-hosts.md
refs:
  - "[code://packages/sdk/src/tools/shell.ts](../../packages/sdk/src/tools/shell.ts) - the agent terminal tool's six tools"
  - "[code://packages/sdk/src/host/shells.ts](../../packages/sdk/src/host/shells.ts) - the shells a session's agent runs commands in"
  - "[code://packages/agent-claude/src/session/query.ts#L97](../../packages/agent-claude/src/session/query.ts#L97) - Claude's `Bash` denied and aliased while the host runs the shell"
  - "[code://packages/sdk/src/types/host.ts#L676-L728](../../packages/sdk/src/types/host.ts#L676-L728) - `HostTool`, with `effects`, `advancedPermission`, `instruction`, `forSession` and `deferLoading`"
  - "[code://packages/sdk/src/types/host.ts#L420-L427](../../packages/sdk/src/types/host.ts#L420-L427) - `HostOptions.advancedTools`"
  - "[code://packages/sdk/src/types/agent.ts#L60-L69](../../packages/sdk/src/types/agent.ts#L60-L69) - `ToolEffects`"
  - "[code://packages/sdk/src/host/tooling.ts#L336-L343](../../packages/sdk/src/host/tooling.ts#L336-L343) - `permitted`, the filter on advanced tools"
  - "[code://packages/server/src/commands/options.ts#L485-L489](../../packages/server/src/commands/options.ts#L485-L489) - the daemon's `advancedTools` key"
  - "[code://packages/computer/src/tools.ts#L69](../../packages/computer/src/tools.ts#L69) - a computer tool that needs advanced permission"
  - "[code://packages/sdk/src/tools/index.ts#L5-L30](../../packages/sdk/src/tools/index.ts#L5-L30) - `hostTools`, the tools this package gives every session"
  - "[code://packages/sdk/src/tools/artifacts.ts#L125-L148](../../packages/sdk/src/tools/artifacts.ts#L125-L148) - `recordArtifact`, add, promote or already recorded"
  - "[code://packages/sdk/src/tools/artifacts.ts#L205-L222](../../packages/sdk/src/tools/artifacts.ts#L205-L222) - the answer of `add_artifact_or_reference`"
  - "[code://packages/sdk/src/host/facts.ts#L459-L490](../../packages/sdk/src/host/facts.ts#L459-L490) - `recordPullRequest`, the artifact a pull request operation leaves"
  - "[code://packages/sdk/src/host/resourcemethods.ts#L360-L368](../../packages/sdk/src/host/resourcemethods.ts#L360-L368) - where an operation result records its pull request"
  - "[code://packages/sdk/src/utils/timing.ts#L1-L58](../../packages/sdk/src/utils/timing.ts#L1-L58) - `callTimes`, `withCallTimes` and `startOf`"
  - "[code://packages/sdk/src/tools/server.ts#L33-L50](../../packages/sdk/src/tools/server.ts#L33-L50) - `TOOLS_PREFIX`, the protocol version and `ToolsChanged`"
  - "[code://packages/agent-acp/src/session/opening.ts#L136](../../packages/agent-acp/src/session/opening.ts#L136) - the ACP session asks for `toolsServer`"
  - "[code://packages/agent-acp/src/plugin.ts#L269-L290](../../packages/agent-acp/src/plugin.ts#L269-L290) - `hostTools`, per preset over the plugin setting"
  - git://d9d4f950^ - the deleted decisions this spec was written from: a-tool-calls-times-are-stamped-as-ahpd-keys, a-tool-calls-times-are-stamped-by-its-plugin, a-tool-says-when-it-needs-advanced-permission, artifact-answers-match-the-reference, host-tool-declares-what-it-does, pull-request-artifact-on-both-paths, the-hosts-tools-are-an-mcp-server-each-backend-may-take
---

The host gives every session its own tools, the protocol `serverTools`, as `HostTool` records from `hostTools()` in [`code://packages/sdk/src/tools/index.ts`](../../packages/sdk/src/tools/index.ts).
The nine session tools and the three artifact tools have the names and schemas of the VS Code agent host.
This is so that a skill written for that host works here.
Three more are this host's own: `ahp_resource`, `ahp_terminals` and `schedule_wakeup`.
The six tools of the agent terminal tool are the VS Code agent host's too, and a root config key turns them on.
Each tool says what it does to the world in `effects`, and a backend's policy reads that to decide what to ask.
A backend calls the tools in its own process, or through an MCP endpoint that the host opens for the session.
The host also stamps the times of every tool call in its `_meta`.

## Scenarios

### A tool says what it does

WHEN a plugin gives a `HostTool`
THEN its `effects` can say that it reads, writes, uses the network or is destructive
AND a backend that runs the tool reads `effects` for its approvals.
The `effects` are the tool's own claim, and a tool that says nothing has none.

### A tool that needs advanced permission

WHEN a tool sets `advancedPermission`
AND the daemon's `advancedTools` key is not true
THEN the tool is in no session, in `serverTools` or in a bound list.
WHEN `advancedTools` is set to true
THEN the tool is offered, and the change takes effect while the daemon runs.
The computer's three tools set `advancedPermission`, and `advancedTools` is false by default.

### A tool shapes itself for one session

WHEN a tool has `forSession`
THEN the session's title strategy can take the tool out of the list or change its definition.
WHEN a tool has `instruction`
THEN that text goes into the agent's instructions while the tool is offered.
WHEN a tool has `deferLoading`
THEN a harness may put the tool behind tool search, and the published definition does not show it.

### An action runs as a tool

WHEN an adapter declares an `action` capability and has a `run`
THEN the host offers one tool for it, at load, named `<adapter>_<action>` with each character outside `[A-Za-z0-9_]` written as `_`
AND the tool's input schema is the capability's `input`.
WHEN a session's bindings name a connector of that adapter, from the `connectors` key of its config or from a plugin's `registerBindings` reader
THEN the session sees the tool, with no `connector` argument when it binds one.
With two or more, `connector` is required, with an `enum` of the aliases.
AND a session that binds none of the adapter does not see the tool.
WHEN the model calls the tool
THEN the host reads the bindings again and resolves the alias.
It checks that the connector is open, is of the tool's adapter, and is one the session's owner may read.
AND then it calls the adapter's `run` with the connector and the input, without the `connector` argument.
An error names the alias the model used and the reason, and never the connector's id or a secret.
A key the session was started with wins a shared alias over a reader's map.
An action tool is not opt-in: a binding is what offers it.

### An artifact is added

WHEN an agent calls `add_artifact_or_reference` with a value that the session does not hold
THEN the host adds it under a new id
AND the answer is `Added artifact: <id>` or `Added reference: <id>`.

### A reference becomes an artifact

WHEN an agent adds as an artifact a value that the session holds as a reference
THEN the host changes the entry in place and keeps its id
AND the answer is `Promoted artifact: <id>`.
WHEN the value is already held as an artifact, or is added again as a reference
THEN nothing changes
AND the answer is `Already recorded: <id>`.
These answers are the same as those of the VS Code agent host.

### An artifact is removed or refused

WHEN an agent calls `remove_artifact_or_reference`
THEN the answer is `Removed artifact: <id>` or `Removed reference: <id>`.
WHEN an added entry has a type that is not in the list, a link that is not `http` or `https`, or an `agent-host-session:` URI
THEN the call fails with an error that names the field.
The types are `pullRequest`, `issue`, `commit`, `website`, `file` and `resource`.

### A pull request operation leaves an artifact

WHEN the `create-pr` operation opens a pull request, or finds the open one for the branch
THEN the result carries the URL, the title and the branch on both paths
AND the host records a `pullRequest` artifact with the title as its label and the URL as its link
AND it promotes the URL in the session's pull request facts in the same write.
See [Git and changes](git-and-changes.md).

### A tool call carries its times

WHEN a backend reports a tool call
THEN the call's `_meta` has `ahpd.startedAt`, and `ahpd.endedAt` and `ahpd.durationMs` when the call is done
AND the duration is the one the harness measured, or else the difference of the two times.
The reason: the protocol gives a tool call no time of its own.
A `_meta` on an action replaces the whole bag, so the times are merged into it.
The ACP, Claude, cofold and pi plugins all use `callTimes` and `withCallTimes` from `@ahpd/sdk`.

### The agent terminal tool is offered

WHEN a client pushes `enableCustomTerminalTool: true`
AND the host has a terminal store and does not run on Windows
THEN each session listed after it is offered `bash`, `read_bash`, `write_bash`, `bash_shutdown`, `list_bash` and `powershell`.
Under PowerShell the set is the `powershell` one, and `bash` is the tool that names the other.
WHEN the key is not true
THEN none of the six is offered.

### A command runs in a terminal the session holds

WHEN an agent calls `bash` with a command
THEN the host runs it in an idle shell of the session, or opens a shell
AND a new shell is a terminal on the root list, titled `Bash` and claimed by the session, the chat, the turn and the call
AND the answer is `Shell ID: <id>`, then `Exit code: <n>` and the output.
A code other than 0 is a failed call.
The shell keeps its folder and its variables for the next call.

### The call shows its terminal

WHEN a call of `bash` is given its shell while its chat has a turn open
THEN the call's content shows the shell's terminal: `type` `terminal`, the terminal's URI as `resource` and `Bash` as `title`
AND the terminal says `isPty: false` where the shell runs on pipes
AND each content the backend writes for the call, and the result it completes the call with, keep the terminal
AND a command that finished sets its code on the terminal as `result.exitCode`.
WHEN a client subscribes to the chat after
THEN the call's content in the chat's state shows the same terminal.
WHEN a subagent's call of `bash` completes in a worker chat
THEN its completion in the worker's chat carries the terminal
AND a client that subscribes to the worker after reads it on the call.

### A command ends before it finishes

WHEN the timeout passes
THEN the answer is `Command timed out after <s>s. Partial output:` and the output so far.
WHEN a client narrows the terminal's claim to the session and the chat
THEN the answer says the command goes on in the background
AND the shell stays held until the command ends.
WHEN the command switches to the alternate screen
THEN the answer is the reference's message, and the shell stays held.
WHEN the shell exits
THEN the answer is `Shell exited with code <n>` and the output.

### The shell's own marks end a command

WHEN the host opens a shell under a pseudoterminal
THEN the shell starts with VS Code's shell integration, which marks each command in OSC 633
AND the terminal announces command detection with the shell's first mark.
WHEN the shell has not said anything yet
THEN its first command waits for it, ten seconds at most.
WHEN the terminal has announced command detection
THEN a command ends at the shell's `D` mark, with the code the mark carries
AND the output is what the terminal said between the command's `terminal/commandExecuted` and its `terminal/commandFinished`, with no echo and no prompt.
WHEN the terminal has announced none, or the shell runs on pipes
THEN the reference's sentinel line follows the command, and its echo ends the command.

### A backend's own shell steps aside

WHEN the host offers its `bash`
THEN Claude disallows `Bash` and aliases the name to `mcp__ahp__bash`
AND pi takes the host's `bash` in place of its own.
A host tool takes a harness's name only when it sets `overridesBuiltInTool`.

### A host tool knows its call

WHEN a backend runs a host tool and knows the call's id
THEN `BoundTool.run` gets `{ toolCallId }`.
Claude reads the id off its handler's `_meta`, pi and cofold take their own, and the tools endpoint reads the request's `_meta['claudecode/toolUseId']`.

### The host tools as an MCP server

WHEN a backend asks `Start.toolsServer`
THEN the host opens an MCP endpoint for the session under `/ahp-mcp/<id>`, on its own listener
AND the endpoint has a bearer token of its own and closes when the session ends
AND it speaks the MCP transport of `2025-06-18`.
WHEN the host has no listener, as a daemon over stdio
THEN `toolsServer` gives nothing.

### A tool list change on the MCP server

WHEN the session's tools change
AND the backend asked for `notify`
THEN the endpoint sends `list_changed` on its open stream.
WHEN the backend asked for `list`, or gave nothing
THEN the next `tools/list` gets the new list.

### Which backend uses the MCP server

WHEN an ACP session opens
AND `hostTools` is not off for the preset or the plugin, and the server can take an HTTP MCP server
THEN the session gives the host tools to the server as the MCP server `ahp`.
The Claude, cofold and pi backends call the tools in their own process.
The Claude backend gives them to the CLI as an in-process `ahp` server.
See [Agent backends](agent-backends.md).
