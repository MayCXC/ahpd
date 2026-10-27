---
title: An agent's shell is a terminal the person sees - implemented
date: 2026-10-26
refs:
  - "[code://packages/sdk/src/host/shells.ts](../../../../packages/sdk/src/host/shells.ts)"
  - "[code://packages/sdk/src/tools/shell.ts](../../../../packages/sdk/src/tools/shell.ts)"
  - "[code://packages/sdk/test/shell-tools.test.ts](../../../../packages/sdk/test/shell-tools.test.ts)"
  - "[code://packages/sdk/test/shell-call-terminal.test.ts](../../../../packages/sdk/test/shell-call-terminal.test.ts)"
  - "[code://packages/sdk/src/machines/terminals.ts](../../../../packages/sdk/src/machines/terminals.ts)"
  - "[code://packages/sdk/src/machines/shellintegration.ts](../../../../packages/sdk/src/machines/shellintegration.ts)"
  - "[code://packages/sdk/test/pty.test.ts](../../../../packages/sdk/test/pty.test.ts)"
---

A client that pushes `enableCustomTerminalTool` gives every session the reference host's agent terminal tool.
An agent's commands then run in terminals the session holds, which the person in the session can watch, type into and stop.
Each call shows its shell's terminal in its content, so a client draws the call as that terminal.
Under a pseudoterminal each shell runs VS Code's shell integration, so a call answers with a command's output alone and the shell's own code.
Claude and pi let the host's `bash` take the place of their own shell.

## What was built

- [`code://packages/sdk/shellintegration`](../../../../packages/sdk/shellintegration) - VS Code's shell integration scripts, unchanged.
- [`code://packages/sdk/src/machines/shellintegration.ts`](../../../../packages/sdk/src/machines/shellintegration.ts) and [`code://packages/sdk/src/machines/osc633.ts`](../../../../packages/sdk/src/machines/osc633.ts) - VS Code's injection and its reader of the marks the scripts write.
- [`code://packages/sdk/src/machines/terminals.ts`](../../../../packages/sdk/src/machines/terminals.ts) - a shell to sit in started with the integration, and its marks read into actions in stream order.

- [`code://packages/sdk/src/host/shells.ts`](../../../../packages/sdk/src/host/shells.ts) - each session's shells, with the reference's two ways to end a command, and the terminal each call shows.
- [`code://packages/sdk/src/host.ts`](../../../../packages/sdk/src/host.ts) and [`code://packages/sdk/src/host/snapshots.ts`](../../../../packages/sdk/src/host/snapshots.ts) - a call's terminal kept on the wire and in a live chat's state.
- [`code://packages/sdk/src/tools/shell.ts`](../../../../packages/sdk/src/tools/shell.ts) - the six tools, with the reference's names, schemas, descriptions and answers.
- [`code://packages/sdk/src/types/shells.ts`](../../../../packages/sdk/src/types/shells.ts) - the shapes the two share.
- [`code://packages/sdk/src/host/headlessterminal.ts`](../../../../packages/sdk/src/host/headlessterminal.ts) - each shell's screen, over `@xterm/headless`.
- [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - the switch, and the call id from a bound tool's `run`.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - `Bash` denied and aliased to `mcp__ahp__bash`.
- [`code://packages/agent-pi/src/tools.ts`](../../../../packages/agent-pi/src/tools.ts) - the host's `bash` in place of pi's own.

## Verified

- `packages/sdk/test/shell-tools.test.ts`: 17 cases, on a real shell over pipes and on a fake pseudoterminal.
- Four behaviours were each turned off once: the marks, the paste, the release of a held shell and the alternate screen. Each time, the case that checks it failed.
- The output was read once from the length the content had when the command began, as the reference reads its own. The case with a full scrollback then timed out.
- `agent-claude-shell.test.ts`: 4 cases. One more case each in `agent-claude-autoapproval.test.ts`, `agent-pi-tools.test.ts`, `agent-cofold-tools.test.ts`, `toolserver.test.ts` and `root-config.test.ts`.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.
- `pnpm test` fails on a Linux machine with no docker, in 35 files, on timeouts in the docker and process tests. The same 35 files fail on main on that machine.
- A daemon built from this tree offers the six tools to a Claude session after a client pushes the key.
- By hand from the built daemon on `node` 24.21.0 and `bun` 1.4.4, with `agent-acp` installed from this checkout's path.
- In each run a client pushed the key and made an ACP agent record whose server calls the host's tools over its MCP endpoint.
- The calls were `echo`, a kept folder and variable, `false`, a timeout, `list_bash`, `write_bash` with `read_bash`, and `bash_shutdown`.
- On `node`, with `node-pty`, each call ran in one pseudoterminal and answered as the reference's tool does.
- On `bun`, with `node-pty` kept from the daemon so its shells ran on pipes, each call answered the same.
- On `bun` as installed on that machine, `node-pty` loads and every shell it starts exits at once with code 1.
- The calls then answered `Shell exited with code`, and a shell started with `node-pty` alone under `bun` exits the same way.
- The built headless terminal read bracketed paste and the alternate screen, on and off, under `node` and `bun`.
- `packages/sdk/test/shell-call-terminal.test.ts`: 5 cases, a backend's call of `bash` on a real shell over pipes, one of them a subagent's in a worker chat.
- Six pieces of the call's terminal were each taken out once, and each time the cases that check it failed.
- They were the rewrite in `dispatch`, the write on acquire, both stamps, the exit and the lookup on a worker chat.
- With the call's terminal, `pnpm test` failed in 29 files on that machine, all in the docker, daemon and process tests.
- Those 29 files were run again without the change, and the ones that still failed alone fail the same way without it.
- By hand from the built daemon on `bun` 1.4.4, on pipes, with an ACP agent that reports its call of `bash`.
- The agent ran the call through the host's endpoint, and the host wrote the terminal on the call.
- The backend's completion went out with the answer and the terminal, with `exitCode` 0.
- A client that subscribed after read the terminal on the call.
- The seven scripts in `packages/sdk/shellintegration` have upstream's blob hashes, and the packed sdk holds them.
- `pty.test.ts` reads detection from the first mark, a command's output between its two actions, and ten cases of the injection.
- `shell-tools.test.ts` adds four fake cases, and three cases in a real zsh and bash under `node-pty`.
- In both real shells `echo by-hand` answers `by-hand` alone, and `sh -c 'exit 3'` answers code 3.
- Without the injection, bash answered with its prompt and the echo, and zsh in an empty home with its new-user menu.
- Without the empty `PROMPT_EOL_MARK`, zsh answered `by-hand` and a `%` on the next line.
- Ten pieces were each taken out once, and each time the cases that check it failed.
- They were the injection, the empty mark, stream order, detection and the wait.
- Then the gone shell, the nonce, OSC 133 beside 633, the history variable, and another command's `D`.
- With detection announced at the start, every fake shell that marks nothing waited for its timeout.
- The terminal and shell suites, 33 files, passed but for five that time out on this machine.
- Those five, run alone at the branch's head without the change, timed out the same way, in more cases.
- By hand from the built daemon on `node` 24.21.0 with `node-pty`, in the person's own zsh with oh-my-zsh.
- `echo by-hand` answered `Shell ID`, `Exit code: 0` and `by-hand`, and the call carried its terminal with `exitCode` 0.
- `sh -c 'exit 3'`, `printf partial`, `cd / && pwd`, `pwd` and `(echo inside; exit 3)` answered cleanly too.
- With bash as the daemon's shell the same calls answered cleanly, but for the subshell, which answered code 0 and nothing.
- On `bun` 1.4.4 from this branch, `node-pty` loads and each shell it starts dies of `SIGHUP` before it says anything.
- A zsh started with `node-pty` alone under `bun` dies the same way, injected or not. The call answered `Shell exited with code 0` at once.

## Departures from the plan

- The reference reads a command's output from the content length it took at the start. This host's terminal drops one old character for each new one once full, so a command counts back from the end.
- The reference never releases a held shell that has no marks. This host releases it at the sentinel that follows the command.
- The reference's headless terminal also answers cursor position queries. This host's terminals answer none, so the shells' screens write nothing back.
- The reference names the call as the turn in the claim. This host names the turn the call runs in.
- The reference's terminals are all pseudoterminals with no command. Here a shell given a command, or on pipes, starts as before.
- The reference reads only OSC 633. This store also reads OSC 133, and announces detection with the first mark of either kind.
- The reference's zsh fixups go on every zsh a session holds. Here they go only where the shell is injected, the one place they are read.
- An empty `PROMPT_EOL_MARK` on a session's zsh is this host's own. The reference's own answers end with zsh's `%`.
- The reference passes the injection no environment, so zsh reads the home's startup files. Here it gets the shell's own, as the workbench passes it.
- The reference reads the Windows build from the registry first. Here it is read from `os.release()`, the reference's fallback.
- The reference names its product in the zsh folder and in `VSCODE_STABLE`. Here they are `ahpd` and the stable value.
- The reference sends a `Cwd` mark's path as it is. Here it goes out as a URI, as the protocol's `cwd` is.
- The reference waits for a new terminal's first output before handing it back. Here a new shell's first command waits, and not on pipes.
- The reference ends a command at any `D` after it was written. Here a `D` with no `C` of the command's own ends nothing.
- A shell that exited during the wait answers at once, where the reference writes to a terminal that has gone.
- The reference sets `AI_AGENT` to VS Code's own name for GitHub's reporting. This host is not that product and sets none.
- The reference names a VS Code client's terminal with `TERM_PROGRAM`. This host does not tell one client from another, and sets none.
- The reference keeps a terminal's content in typed parts. This store keeps one part, and the boundaries reach a client as actions.
- The reference's session holds its calls' content and adds the terminal to it. Here a backend writes its own calls. The host writes the terminal on the call as it writes a worker's link, and `dispatch` keeps it there.
- The reference keeps a call's shell by the call's id alone. Here a call is kept by its session and id, since a backend's call ids are unique only within its session. A subagent's call is found in its worker chat, through the session that holds the chat.
- A worker chat's state is folded before `dispatch` rewrites an action, so its snapshot is stamped where it is served, as a live chat's is.
- The reference's own shell tool gives its terminal no `result`. Here a completed command sets its code there, as the protocol's `ToolResultTerminalContent.result` describes.
