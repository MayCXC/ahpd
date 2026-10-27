---
title: A call shows its terminal
status: done
depends:
  - task-01-the-host-offers-the-agent-terminal-tool.md
layer: "sdk, docs"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L463-L487](../../../../packages/sdk/src/host/spawn.ts#L463-L487) - a worker's link written on the call that spawned it, the pattern for content this host puts on a backend's call"
  - "[code://packages/sdk/src/host/spawn.ts#L238-L246](../../../../packages/sdk/src/host/spawn.ts#L238-L246) - `withWorkerUri`, where a backend's call actions are rewritten in `dispatch`"
  - "[code://packages/sdk/src/host/snapshots.ts#L357-L365](../../../../packages/sdk/src/host/snapshots.ts#L357-L365) - where a live chat's turns are stamped for a late subscriber"
  - "[code://packages/sdk/test/subagent-link.test.ts](../../../../packages/sdk/test/subagent-link.test.ts) - a fake backend that writes its own calls"
---

## Objective

A call of the agent terminal tool shows its shell's terminal in its content while the command runs.
The call it completes keeps the terminal, with the code of a command that finished.
A client draws such a call as that terminal, live and in a chat it subscribes to later.

## Files

- `UPDATE: packages/sdk/src/automations/calllinks.ts:59` - export `aboutCall`, the key a call is held under, for the shells to key their calls the same way.
- `UPDATE: packages/sdk/src/host/shells.ts:77-108` - `shellDisplayName`, and `showing`, which lays a call's terminal after its content or sets the exit on the one there.
- `UPDATE: packages/sdk/src/host/shells.ts:257-316` - `Entry.call`, `Called`, the terminal each call shows, and `HostShells.withTerminal` and `stampedTerminals`.
- `UPDATE: packages/sdk/src/host/shells.ts:396-481` - `associate`, called on both ways a shell is acquired, which writes the terminal on the call.
- `UPDATE: packages/sdk/src/host/shells.ts:614-630` - `exited`, the exit of a completed command on its call's terminal.
- `UPDATE: packages/sdk/src/host/shells.ts:708-766` - forget a session's calls, keep the terminal on a call's later actions, stamp a live chat's turns.
- `UPDATE: packages/sdk/src/host.ts:773` - `dispatch` passes each action through `withTerminal` after `withWorkerUri`.
- `UPDATE: packages/sdk/src/host/snapshots.ts:359-364` - a live chat's turns stamped with their calls' terminals before `stampedCalls`.
- `CREATE: packages/sdk/test/shell-call-terminal.test.ts` - a backend's call of `bash`, on the wire and in a late subscriber's state.
- `UPDATE: docs/sdk/TOOLS.md` - the call shows its shell, in the agent terminal tool's section.
- `UPDATE: docs/sdk/TERMINALS.md` - the call's terminal, where the agent's shells are said to open.
- `UPDATE: .project/specs/host-tools.md` - the scenario of a call's terminal.
- `UPDATE: CHANGELOG.md` - the agent terminal tool's entry under 0.14.1.

## Steps

1. Key the call that gets a shell by its chat and id, as the links index keys a spawning call.
2. Record the call's terminal block in both ways `acquire` gets a shell.
3. Write the block on the call as `chat/toolCallContentChanged`, as spawn writes a worker's link.
4. Set `isPty: false` on a block whose terminal runs on pipes, and nothing on a pseudoterminal's.
5. Record a completed command's code on its call's block, and nothing for any other ending.
6. Pass every action through `withTerminal` in `dispatch`, keeping the block on the call's content and result.
7. Stamp a live chat's turns with their calls' blocks where `snapshots.ts` serves the chat.
8. Forget a session's calls with its shells.
9. Write the four cases, then the docs, the spec and the CHANGELOG.

## Validation

- `packages/sdk/test/shell-call-terminal.test.ts` holds four cases.
- The first: the terminal while running, on the completion with code 0, and in a late subscriber's state.
- The others: the code of `false`, the backend's own content keeping the terminal, and a timed-out command with no exit.
- Four pieces were each taken out once: the rewrite in `dispatch`, the write on acquire, the stamp, and the exit. Each time, the cases that check it failed.
- `pnpm boundary`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- `shell-tools.test.ts`, `subagent-link.test.ts`, `subagent-chat.test.ts` and `calllinks.test.ts` pass beside the new file.
- By hand on Bun: a backend's call of `bash` shows the block on the wire and on its completion.

## Resume

Done 2026-10-27.
A host tool is bound to its session's chat.
A backend draws a subagent's call in the worker's chat, so that call shows no terminal.
