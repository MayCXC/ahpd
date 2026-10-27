# Terminals

A **terminal** is a shell on the machine the daemon runs on, opened as a channel of its own at `ahp-terminal:/<uuid>`. It is a real process with a real filesystem under it, so it is opened only for somebody who signed in and whose role covers `terminal:create` - a terminal is arbitrary code on the machine, and the grant is what decides who gets one. What it opens, and how its output reaches a client, is `packages/sdk/src/machines/terminals.ts` and `packages/sdk/src/host/terminals.ts`.

Terms, one line each:

| Term | |
| --- | --- |
| a terminal | One shell process, as a channel: its own URI, its own state, its own actions |
| the terminal store | The port that spawns shells - `TerminalStore`, pipes unless it was handed a pseudoterminal binding |
| a pseudoterminal | A real terminal device, handed in as native code; what makes the shell's own marks readable |
| the claim | Who holds the terminal: a connection, or a session and the chat inside it |
| the scrollback | Everything the shell has written, kept so a client subscribing later still sees it |
| the root list | `terminals` on root state: every open terminal's `TerminalInfo` |
| command detection | Whether the shell prints its own command boundaries, which only a pseudoterminal gives |

## Where it runs

On the daemon's machine, which is the only place it can run: the store spawns a process locally, and there is no scheme for a shell somewhere else - a session in a machine runs its own commands inside that machine (see [COMPUTERS.md](../plugins/COMPUTERS.md)).

A client's terminal starts in the directory it named, decoded from the `file:` URI it sent, and naming none gives the host's own directory. Any directory is accepted, `file:///etc` included: the reference host opens one wherever it is asked, and the connection's token is what decides who gets a shell rather than the path. A directory that is not there is a shell that fails to start, not a refusal - the failure is written into the terminal's own output and the exit code is `127`.

What the directory decides is smaller: a command that ran in it may have moved it - a commit, a checkout, anything that wrote a file - so when the process exits this host refreshes the changeset of whichever session directory the terminal was in. A terminal outside every session's directory refreshes nothing.

`ahp-terminal:` is this host's spelling. VS Code names the terminals it opens itself `agenthost-terminal:/<id>`, and the gate treats both as terminals by the channel's kind as well as by its scheme.

## Pipes, or a pseudoterminal

The store runs shells on pipes unless it was handed a pseudoterminal binding, and the state says which the client is reading: `isPty` and `supportsCommandDetection` are both false on pipes, because there is no terminal device and no shell running a prompt of its own to emit anything. Output is then plain text, and anything a client draws with cursor movement will not look right - said in the state rather than discovered. This is what the protocol's `isPty: false` is for.

The daemon hands one in when the machine has it: `node-pty`'s `spawn`, loaded by name at runtime, because a native binding that does not match its runtime aborts the process rather than throwing and is nothing a `try`/`catch` can hold. So the import is tried in a child of the same runtime first and repeated here only once that child has survived it - `packages/server/src/pty.ts`. With it, shells run under a real terminal, and the shell's own marks become facts. A shell opened to sit in is started with VS Code's shell integration, which marks every command - [Command boundaries](#command-boundaries).

`TERM` follows the same answer: the daemon's own, or `xterm-256color` when it has none, under a pseudoterminal, and `dumb` without one.

## Who opens one

Four ways in, and the difference between them is the claim and the shell.

A **client** asks with `createTerminal`, naming the channel URI itself so it can subscribe without a round trip in between. The claim is absent for "this connection", and any other claim is parsed rather than taken: a claim that is not one of the two kinds is refused with `-32602`, because a client that meant to name a session and got it wrong should hear about it rather than quietly become the owner. A URI already in use is `-32003`.

A **`!` command** in a turn's text runs in a terminal of its own, opened by the host. The protocol standardises the convention rather than the behaviour, and this host advertises `!` as `terminalCommandPrefix` when it has a store at all. The command runs in the session's first working directory, and its claim names the session, the chat, the turn and the tool call, which is what the finished tool call points at. A lone `!`, or one followed only by spaces, is not a command - it is somebody typing an exclamation point, and it goes to the agent. A backend that implements no `ran` is told `"<provider> cannot run a command in a turn; use a terminal instead"` rather than being sent one as a question.

A **backend** asks through `start.terminals.open`, the factory the host wraps around the store so that a terminal it opens is a channel the host owns rather than one nobody lists. The backend says the directory, the program and its arguments, and nothing else; the host mints the URI, registers the channel, puts it on the root list and routes its actions. The handle it gets back reads the output the way a client reads it, waits for the exit, writes, resizes, kills - which leaves the row listed, because a transcript may still point at the channel - and releases, which ends a process that has not already gone and takes the row off the list. A release that only dropped the row would leave a shell nothing lists and nothing can reach.

An **agent** runs its commands in shells of its own with the agent terminal tool, the reference host's, while the root config's `enableCustomTerminalTool` is on - [TOOLS.md](TOOLS.md#the-agent-terminal-tool). The host opens each shell as a terminal with no command, titled `Bash` or `PowerShell`, in the session's first working directory, and claimed by the session, the chat, the turn and the call that opened it. Each call shows its shell's terminal in its content, so a client draws the call as that terminal. It keeps the shell between calls, so a command finds the folder and the variables the last one left, and it closes the session's shells with the session. A client that narrows the claim to the session and the chat moves the running command to the background, as the reference reads that change.

The `!` command, a backend's terminal and an agent's shell run the daemon's own shell: `$SHELL`, then `/bin/sh` - or, on Windows, PowerShell 7, then the Windows PowerShell, then `cmd.exe`, because `SHELL` there is a Git Bash leftover rather than a Windows shell. `defaultShell` is a connection's preference and none of these has a connection - a backend and an agent have a session, and an automation fires with nobody connected at all - so there is nobody here whose choice it could be. Answered that way on purpose: a person's shell must not be what a turn runs, which is also the path where writing a file and naming it in `defaultShell` would make the next tool call run it.

## One command, or a shell to sit in

A terminal given a `command` runs it and exits: the shell is started with `-c`, which is the only completion signal there is on pipes. Whether `args` is given decides how that command reaches the shell, and the two are not the same thing.

With `args` the caller is naming a program, so the argv is quoted word by word and the shell runs exactly that. Without it the caller is handing over a line - a `!` command typed by a person is one - and that line is already shell syntax: quoting it would ask the shell for a program named after the whole line, which is a command that never existed.

A terminal with no command is a shell reading from a pipe that stays open, which is what somebody typing into one wants. It ends when it is disposed, when it is released, or when the shell decides to.

Every terminal gets the host's environment, then the caller's variables over it, then its own size and kind over both: a terminal's own `TERM`, `COLUMNS` and `LINES` are not something a command may disagree with.

## What a client sees

The channel's state is `title`, `cwd`, `cols`, `rows`, `content`, `claim`, `isPty`, `supportsCommandDetection` and `lifecycle`. `content` is one `unclassified` part, the protocol's shape rather than a flat string. The boundaries a shell marks reach a client as actions while it watches, and are not kept.

The exit code is inside `lifecycle`: `{ status: 'running' }` while the process is there, `{ status: 'exited', exitCode }` once it is gone. That is what 0.9.0 requires and it is not optional there, so a client reading it on an older-shaped terminal would read a process that never exits. This host negotiates down to 0.5.1, so it also sends the flat `exitCode` every version before 0.9.0 reads.

`terminal/exited` is announced when the pipes drain rather than when the process goes. The two are not the same moment, and between them there is output written and not yet read - which is exactly what a `!` command in a composer reads back. On pipes that is `close`; the process's own `exit` is what records the code and the signal, and the announcement waits for the pipes. It goes out once, so a spawn that failed and fired both `error` and `close` does not report a terminal that died, came back, and died again.

A process killed by a signal reports `128`, with the signal named beside it, because a runtime that reports no exit code leaves nothing else to say and reporting nothing reads as still running. The name is what makes it readable: a caller told only `128` cannot tell somebody's SIGINT from a program that chose to exit 128.

The scrollback is everything written so far, capped at 200,000 characters - a terminal left running `tail -f` for a day is a host holding a day of output for a client that may never come back. A client subscribing late is sent it, so a terminal watched from the middle still shows what happened before it arrived. `clear` drops the scrollback and keeps the size, the title and the claim: a client clears a terminal to stop reading what is there, not to give it up. Nothing reaches the process, which has no notion of its own output having been discarded.

Size defaults to 80 columns and 24 rows. `resize` records the new size and tells a pseudoterminal about it, which sends `SIGWINCH` itself; on pipes nothing is signalled and the size is kept because the state reports it and a client draws to it. `^C` is the other half of the same difference: a pseudoterminal has a line discipline that sees the byte and signals the foreground group, so the byte is written through and nothing clever happens. Pipes have none, so the byte would arrive as input and the command would run on - a terminal a runaway command cannot be stopped in. This host turns it into `SIGINT` to the child's own process group, named by the child's pid and only when there is one: to `kill` group `0` would mean every process in this process's group, so a shell that never started would signal the host.

A terminal's title is the caller's `name`, or the shell's own basename. A `!` command's is `Terminal`.

## Command boundaries

Only under a pseudoterminal, and only once the shell has marked something. This host says so twice: `terminal/commandDetectionAvailable` with the shell's first mark, and `supportsCommandDetection` on the state from then on. A shell with no integration never marks, and a client MUST check before relying on the boundaries.

A shell opened to sit in, a client's or an agent's, starts with VS Code's shell integration, as every terminal the reference host opens does. VS Code's `getShellIntegrationInjection` answers what to start it with. Bash gets `--init-file` and VS Code's script. Zsh gets a folder of its own as `ZDOTDIR`, holding VS Code's four startup files, which read the person's own. Fish and PowerShell get their scripts the same way. On macOS, zsh and bash start as login shells, as the reference starts them. The scripts are VS Code's, unchanged, in `packages/sdk/shellintegration/`.

A shell given a command runs it and exits with no prompt to mark, so it starts as it was asked. So does a shell the injection does not know, such as `sh`, and every shell on pipes.

VS Code's scripts mark each prompt and command in OSC 633. Each command line comes with a nonce the terminal gave the script, so a line some program prints cannot pass for the shell's. Other shells mark in OSC 133: `A` before the prompt, `C` where a command starts and `D;<code>` when it finished. OSC 7 gives the directory.

This host reads both into `terminal/commandExecuted`, `terminal/commandFinished` with the shell's own exit code and the duration since `C`, and `terminal/cwdChanged`. Once a shell has written OSC 633, its commands are read from those marks alone. A shell that writes OSC 133 as well then reports each command once.

The OSC 633 marks are taken out of the bytes a client is sent, as the reference takes them out, because the actions carry them. OSC 133 and OSC 7 stay in: for those this is a reader and not a filter. Each action goes out where its mark stands. So the `terminal/data` between a command's `terminal/commandExecuted` and its `terminal/commandFinished` is the command's output, as the protocol defines it.

An OSC 133 command line is read back off what was typed since the prompt. The shell echoes what was typed, but the echo arrives as output, so the bytes of `terminal/input` are what a `C` mark is read against.

The agent terminal tool reads the same actions. Once the terminal has announced command detection, the tool ends each command at its `D`, with that code and the output between the two actions. A new shell is given up to ten seconds to say something before its first command, as the reference's terminal manager waits. Where the terminal has announced nothing, and always on pipes, the tool ends a command at the reference's sentinel line.

A zsh a session holds also gets the reference's fixups for an agent's shell: `NO_BANG_HIST` and `INTERACTIVE_COMMENTS`. It gets an empty `PROMPT_EOL_MARK` as well, which is this host's own. Zsh writes that mark, a `%`, before the integration's `D` whatever the output was, so every command's output would end with it.

## Configuration keys

Two keys reach terminals, and both are root config rather than the file.

| Key | Values | Default | What changes |
| --- | --- | --- | --- |
| `defaultShell` | an absolute path | the system shell | The shell a host-managed terminal opens |
| `enableCustomTerminalTool` | `true` or `false` | `false` | Offer the agent terminal tool, whose commands run in terminals. One setting for the host |

`defaultShell` is **per connection**: it is kept on the connection that pushed it and read back by that connection, so two people on one daemon each get theirs and neither can name the binary the other's terminal opens. VS Code pushes it out of `terminal.integrated.agentHostProfile.<os>` when it connects, which is why it is a preference of a person rather than a key of the deployment. Pushing it needs no grant and only a sign-in, because it changes nothing anybody else reads.

It reaches one of the four ways in: a client's terminal uses it, and a `!` command, a backend's terminal and an agent's shell do not, for the reason above.

`enableCustomTerminalTool` is the other key, and it opens no terminal itself: it offers the agent terminal tool, whose shells are terminals - [TOOLS.md](TOOLS.md#the-agent-terminal-tool).

The rest of the root config is [HOST.md](HOST.md#root-config), and the daemon's own keys are [HOST.md](HOST.md#configuration-keys). Nothing in either turns terminals off: a host built without a terminal store answers `This host does not serve createTerminal yet` and advertises no `terminalCommandPrefix`, and a plugin's `registerTerminals` is what puts one there - [BUILD-A-HOST.md](BUILD-A-HOST.md#terminals), [PLUGINS.md](../plugins/PLUGINS.md).

## Commands

There is no `ahpd terminal`. A terminal is driven over the protocol, and the verbs are these.

| Command | What it does |
| --- | --- |
| `createTerminal` | Open a shell, under the URI the client chose, in the directory it names - any of them, or the host's own when it names none |
| `disposeTerminal` | End one and take it off the root list. `-32008 No terminal at <uri>` when there is none |
| `subscribe` | The snapshot - state and scrollback - and every action after it |
| a `!command` in a turn | Run one command in a terminal of its own and read it back as the turn's answer |
| `ahp_terminals` | Read-only: the terminals this host has open, for the model of a session - [TOOLS.md](TOOLS.md) |
| `bash` and its four companions | An agent's commands, in shells the session keeps, while `enableCustomTerminalTool` is on - [TOOLS.md](TOOLS.md#the-agent-terminal-tool) |

The root channel is where a terminal is listed and where it says it moved: `terminals` on root state, and `root/terminalsChanged` carrying the whole list when one opens, closes or exits on its own. Every client that completes a handshake is shown that list, including each terminal's URI, title and claim, because root state is one state for the whole host and is never filtered per person. Knowing a channel is not being able to drive it: a dispatch into one is refused unless the person signed in and their role covers the operation - decision [A role refuses at the dispatch boundary, and never hides root state](../../.project/decisions/a-role-refuses-at-the-dispatch-boundary.md).

## Grants

Everything a terminal does is one of its operations, and read and write are the groups those fall into - [USERS.md](USERS.md#roles).

| What | Grant |
| --- | --- |
| Open and close one | `terminal:create`, `terminal:dispose` |
| Read it | `terminal:output`, asked of the channel rather than the method |
| Type into it, resize it | `terminal:input`, `terminal:resize` |
| Take it, rename it, clear it | `terminal:claim`, `terminal:rename`, `terminal:clear` |

`member` holds `terminal:read` and `terminal:write`, so it holds every row above. `guest` holds neither: it can neither open a shell nor read one. A `!` command asks for no grant of its own, because it is part of a turn - the grant is `chat:send`. An agent's shell acts as the person who sent the turn, and asks that person's grants as a client's own action would: `terminal:create` to run a command, `terminal:output` to read a shell, `terminal:input` to write to one and `terminal:dispose` to stop one.

## See also

| | |
| --- | --- |
| [AHP.md](AHP.md#terminal--11-of-11-) | The terminal channel's eleven actions, one line each |
| [TOOLS.md](TOOLS.md) | `ahp_terminals`, the agent terminal tool, and the rest of what a session's model is offered |
| [USERS.md](USERS.md#roles) | What the grants are, and what each built-in role holds |
| [BUILD-A-HOST.md](BUILD-A-HOST.md#terminals) | The `terminals` port, for a host built from the SDK |
| [COMPUTERS.md](../plugins/COMPUTERS.md) | A session in a machine, where its commands run |
