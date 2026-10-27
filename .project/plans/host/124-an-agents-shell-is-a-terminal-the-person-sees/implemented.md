---
title: An agent's shell is a terminal the person sees - implemented
date: 2026-10-26
refs:
  - "[code://packages/sdk/src/host/shells.ts](../../../../packages/sdk/src/host/shells.ts)"
  - "[code://packages/sdk/src/tools/shell.ts](../../../../packages/sdk/src/tools/shell.ts)"
  - "[code://packages/sdk/test/shell-tools.test.ts](../../../../packages/sdk/test/shell-tools.test.ts)"
  - "[code://packages/sdk/test/shell-call-terminal.test.ts](../../../../packages/sdk/test/shell-call-terminal.test.ts)"
---

A client that pushes `enableCustomTerminalTool` gives every session the reference host's agent terminal tool.
An agent's commands then run in terminals the session holds, which the person in the session can watch, type into and stop.
Each call shows its shell's terminal in its content, so a client draws the call as that terminal.
Claude and pi let the host's `bash` take the place of their own shell.

## What was built

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
- `packages/sdk/test/shell-call-terminal.test.ts`: 4 cases, a backend's call of `bash` on a real shell over pipes.
- Four pieces of the call's terminal were each taken out once: the rewrite in `dispatch`, the write on acquire, the stamp and the exit. Each time, the cases that check it failed.
- With the call's terminal, `pnpm test` failed in 29 files on that machine, all in the docker, daemon and process tests.
- Those 29 files were run again without the change, and the ones that still failed alone fail the same way without it.
- By hand from the built daemon on `bun` 1.4.4, on pipes, with an ACP agent that reports its call of `bash`.
- The agent ran the call through the host's endpoint, and the host wrote the terminal on the call.
- The backend's completion went out with the answer and the terminal, with `exitCode` 0.
- A client that subscribed after read the terminal on the call.

## Departures from the plan

- The reference ends a command at its own injected shell integration. This host injects none, so it ends a command at the shell's own OSC 133 mark once the shell has marked one.
- The reference reads a command's output from the content length it took at the start. This host's terminal drops one old character for each new one once full, so a command counts back from the end.
- The reference never releases a held shell that has no marks. This host releases it at the sentinel that follows the command.
- The reference's headless terminal also answers cursor position queries. This host's terminals answer none, so the shells' screens write nothing back.
- The reference names the call as the turn in the claim. This host names the turn the call runs in.
- The reference's macOS `--login`, its shell integration variables and its zsh fixups are not here, because this host's terminals take none of them.
- The reference's session holds its calls' content and adds the terminal to it. Here a backend writes its own calls. The host writes the terminal on the call as it writes a worker's link, and `dispatch` keeps it there.
- The reference follows a call a subagent makes by its parent call's id. A host tool here is bound to its session's chat, so a call a subagent makes shows no terminal.
- The reference's own shell tool gives its terminal no `result`. Here a completed command sets its code there, as the protocol's `ToolResultTerminalContent.result` describes.
