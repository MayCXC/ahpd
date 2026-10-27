---
title: A shell runs the reference's shell integration
status: done
depends:
  - task-01-the-host-offers-the-agent-terminal-tool.md
layer: "sdk, server, docs"
refs:
  - "https://github.com/microsoft/vscode/tree/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/workbench/contrib/terminal/common/scripts - the scripts, vendored unchanged"
  - "https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/terminal/node/terminalEnvironment.ts#L52-L368 - `getShellIntegrationInjection`"
  - "https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/osc633Parser.ts - `Osc633Parser`"
  - "https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L306-L418 - the terminal manager's `createTerminal`, which injects every terminal it opens"
  - "https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L655-L805 - `_handlePtyData` and `_handleOsc633Event`, which read the marks in stream order"
  - "https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts#L217-L284 - `executeCommandWithShellIntegration`"
  - "[code://packages/sdk/src/machines/terminals.ts#L436-L465](../../../../packages/sdk/src/machines/terminals.ts#L436-L465) - `read`, the reader of OSC 133 and OSC 7 marks in stream order"
---

## Objective

A shell the store opens to sit in under a pseudoterminal runs VS Code's shell integration, as the reference host's terminals do.
The store reads the OSC 633 marks the scripts write, and sends each command's actions where its marks stand.
The agent terminal tool then answers a command with its output alone, and the code of the shell's own `D`.

## Files

- `CREATE: packages/sdk/shellintegration/` - VS Code's seven scripts, byte for byte, and in the package's `files`.
- `CREATE: packages/sdk/src/machines/osc633.ts` - `Osc633Parser`, with its event types as a union of names.
- `CREATE: packages/sdk/src/machines/shellintegration.ts` - `getShellIntegrationInjection`, the Windows build, and `isZsh` moved from `host/shells.ts`.
- `UPDATE: packages/sdk/package.json` - `shellintegration` in `files`.
- `UPDATE: packages/sdk/src/machines/terminals.ts:242` - `MARKS` kept to the store.
- `UPDATE: packages/sdk/src/machines/terminals.ts:261` - `createTerminal` takes the Windows build, as `shellTerminals` does at `:852`.
- `UPDATE: packages/sdk/src/machines/terminals.ts:365-495` - detection with the first mark, `read` in stream order, and `heard` for OSC 633.
- `UPDATE: packages/sdk/src/machines/terminals.ts:508-572` - `integrate`, for a shell to sit in under a pseudoterminal, and the parser on its output.
- `UPDATE: packages/sdk/src/machines/terminals.ts:690` - `supportsCommandDetection` from the first mark.
- `UPDATE: packages/sdk/src/host/shells.ts:12-18` - the header, re-derived.
- `UPDATE: packages/sdk/src/host/shells.ts:59-88` - `PREVENT_SHELL_HISTORY_ENV`, `WAIT_FOR_PROMPT_TIMEOUT` and the actions a shell's output sends.
- `UPDATE: packages/sdk/src/host/shells.ts:547-660` - `spoken`, the choice by detection, the output between the two actions, and a shell already gone.
- `UPDATE: packages/sdk/src/tools/shell.ts:19` - `isZsh` from its new place.
- `UPDATE: packages/sdk/src/types/terminals.ts:39-44` - what tells a command's end, on pipes and under a pseudoterminal.
- `UPDATE: packages/server/src/pty.ts:37-40` - the first paragraph of `pty`'s comment, true with and without Bun's own terminal.
- `UPDATE: packages/sdk/test/pty.test.ts` - detection, stream order, and ten cases of the injection and the 633 marks.
- `UPDATE: packages/sdk/test/shell-tools.test.ts` - the variables, the wait, a gone shell, another command's end, and real zsh and bash.
- `UPDATE: docs/sdk/TERMINALS.md` - the command boundaries, and what the state's content holds.
- `UPDATE: docs/sdk/TOOLS.md` - how a command ends, and bash's subshell.
- `UPDATE: docs/sdk/AHP.md` - the terminal actions this host sends.
- `UPDATE: README.md` - the terminals row.
- `UPDATE: .project/specs/host-tools.md` - the scenario of the shell's own marks.
- `UPDATE: CHANGELOG.md` - the terminals and the tool under 0.14.1.

## Steps

1. Copy the seven scripts from the reference's commit, and check each blob hash against upstream's.
2. Carry `Osc633Parser` and `getShellIntegrationInjection`, with the agent host's fixed inputs as constants.
3. Inject a shell with no command under a pseudoterminal, after the reference's macOS login.
4. Give a session's zsh the reference's fixups and an empty `PROMPT_EOL_MARK`.
5. Read each output chunk through the parser, and emit each mark's action where the mark stands.
6. Announce command detection with the first mark, and ignore OSC 133 commands once the shell speaks OSC 633.
7. Pass `VSCODE_PREVENT_SHELL_HISTORY` with the agent shells' non-interactive variables.
8. Wait for a new shell's first output, ten seconds at most, before its first command.
9. Choose the sentinel or the marks by the terminal's `supportsCommandDetection`.
10. Read a marked command's output between its two actions, and skip a `D` without this command's `C`.
11. Answer a shell that exited during the wait at once.
12. Write the cases, take each piece out once, then write the docs and records.

## Validation

- `pty.test.ts` checks detection from the first mark, and a command's output between its actions in one chunk.
- Its ten integration cases cover bash, zsh, macOS, PowerShell, a command, `sh`, pipes and the 633 marks.
- They also cover the nonce, a mark split across two reads, and OSC 133 beside OSC 633.
- `shell-tools.test.ts` adds four fake cases and three in a real zsh and bash under `node-pty`.
- Its fake shell that marks its prompt now ends even its first command at the `D`.
- The real shells answer `echo by-hand` with `by-hand` and `sh -c 'exit 3'` with code 3.
- They also show the history setting the script read, and the zsh fixups.
- Ten pieces came out one at a time, and each time the cases that check it failed.
- They were the injection, the empty mark, stream order, detection and the wait.
- Then the gone shell, the nonce, OSC 133 beside 633, the history variable, and a `D` of another command.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass, and the packed sdk holds the scripts.
- By hand, a daemon on `node` with `node-pty` answers each command cleanly, in the person's own zsh.

## Resume

Done 2026-10-27.
A shell a person opened has the same integration as an agent's.
A shell given a command, a shell the injection does not know, and a shell on pipes start as before.
On Bun, the daemon on this branch gets `node-pty`, whose shells exit at once.
