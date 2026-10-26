---
title: The host offers the agent terminal tool
status: done
depends: []
layer: "sdk, docs"
refs:
  - "[code://packages/sdk/src/host/terminals.ts#L184](../../../../packages/sdk/src/host/terminals.ts#L184) - `heldTerminals`, the pattern a shell's terminal follows"
  - "[code://packages/sdk/src/host/tooling.ts#L472](../../../../packages/sdk/src/host/tooling.ts#L472) - `contributingTo`, where the switch joins the session tools' own"
  - "[code://packages/sdk/src/tools/server.ts#L252](../../../../packages/sdk/src/tools/server.ts#L252) - where the endpoint runs a host tool"
---

## Objective

While a client has pushed `enableCustomTerminalTool`, every session is offered the reference's six shell tools.
A command runs in a terminal the session holds, and the call answers as the reference's does.

## Files

- `CREATE: packages/sdk/src/types/shells.ts` - `ManagedShell`, `ShellCommandResult`, `HeldShell` and `Shells`, the reference's shapes.
- `CREATE: packages/sdk/src/host/shells.ts` - the session's shells: acquire, run, hold, read, write and shut down.
- `CREATE: packages/sdk/src/host/headlessterminal.ts` - the reference's headless terminal over `@xterm/headless`.
- `UPDATE: packages/sdk/package.json` - `@xterm/headless` as a dependency, with `pnpm-lock.yaml` from `pnpm add`.
- `CREATE: packages/sdk/src/tools/shell.ts` - the six tools, their descriptions and their answers.
- `UPDATE: packages/sdk/src/host/terminals.ts:266` - `heldShell`, before `heldOutputs`: a terminal with no command and the caller's claim.
- `UPDATE: packages/sdk/src/host/tooling.ts:472` - `terminalToolOn` beside `contributingTo`, and the call id from `run` into `toolContext`.
- `UPDATE: packages/sdk/src/host/context.ts` - `HostContext.shells`.
- `UPDATE: packages/sdk/src/host.ts` - make the shells after the background tasks.
- `UPDATE: packages/sdk/src/host/lifecycle.ts` - forget a session's shells when it is deleted.
- `UPDATE: packages/sdk/src/machines/terminals.ts:239` - export `MARKS`.
- `UPDATE: packages/sdk/src/types/host.ts` - `ToolCall.toolCallId`, `ToolCall.shells` and `HostTool.overridesBuiltInTool`.
- `UPDATE: packages/sdk/src/types/agent.ts` - `BoundTool.run` takes `{ toolCallId }`, and `BoundTool.overridesBuiltInTool`.
- `UPDATE: packages/sdk/src/tools/server.ts:252` - pass the call id from `_meta['claudecode/toolUseId']`.
- `UPDATE: packages/sdk/src/vscoderootconfig.ts:420` - declare `enableCustomTerminalTool` after the last key, as the reference does.
- `UPDATE: packages/sdk/src/tools/index.ts` - `hostTools()` ends with the shell tools.
- `UPDATE: packages/sdk/src/index.ts` - export the shell tools and their switch.
- `UPDATE: packages/sdk/src/types/index.ts` - export the shell types.
- `CREATE: packages/sdk/test/shell-tools.test.ts` - the tools on pipes and under a fake pseudoterminal.
- `UPDATE: packages/sdk/test/toolserver.test.ts` - the endpoint passes the call a request names.
- `UPDATE: packages/sdk/test/root-config.test.ts` - the key is declared as the reference declares it.
- `UPDATE: docs/sdk/TOOLS.md` - the agent terminal tool, its key and its grants.
- `UPDATE: docs/sdk/TERMINALS.md` - the fourth way in, the marks, the key and the grants.
- `UPDATE: docs/sdk/HOST.md` - the key among the ones this host acts on.
- `UPDATE: docs/sdk/AHP.md` - the key among the ones this host acts on.
- `UPDATE: CHANGELOG.md` - the tools, the backends and the call id.

## Steps

1. Copy the reference's `shellTypeForExecutable`, `isZsh`, history prefix, sentinel and `prepareOutputForModel` into `host/shells.ts`.
2. Open each shell with `heldShell`, claimed by the session, the chat, the turn and the call.
3. Feed each shell's headless terminal with what the shell says, and count what it says during a command.
4. Latch that a shell marks its commands at its first `terminal/commandExecuted` or `terminal/commandFinished`.
5. End a command at its `D` mark when the shell marks, and at the sentinel when it does not.
6. End it as the reference does on the alternate screen, an exit, a narrowed claim and the timeout.
7. Hold a shell past its call until its `D` mark, its sentinel or its exit.
8. Write the six tools with the reference's names, schemas, descriptions and answers.
9. Ask each tool's grant of the person who sent the turn, as a client's terminal action asks it.
10. Offer the tools only while the key is true, off Windows, on a host with a terminal store.
11. Pass the call id from every place that runs a bound tool.
12. Write the tests, then the docs.

## Validation

- `packages/sdk/test/shell-tools.test.ts` holds 17 cases.
- Its cases on pipes check the switch, the claim, a kept shell, an exit code, a timeout and the background.
- They also check read, write, shutdown, the other shell, the session's end and the grants.
- Its cases on a fake pseudoterminal check the carriage return, the marks, bracketed paste and the alternate screen.
- One more fake case fills the scrollback before its first command.
- Turn off the marks, the paste, the release of a held shell or the alternate screen, and its case fails.
- Read a command's output from the length the content had when it began, and the full scrollback's case fails.
- `packages/sdk/test/toolserver.test.ts` checks that a request's `_meta` names the call to the tool.
- `packages/sdk/test/root-config.test.ts` checks the key's property against the reference's.
- `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Resume

Done 2026-10-26.
The terminal's scrollback keeps its last 200,000 characters and drops the oldest.
Once it is full, a length measured into it no longer names a place.
A command counts what the terminal says after it begins, and reads its output back from the end.
