---
title: A call shows its terminal
status: done
depends:
  - task-01-the-host-offers-the-agent-terminal-tool.md
layer: "sdk, docs"
refs:
  - "[code://packages/sdk/src/host/spawn.ts#L463-L487](../../../../packages/sdk/src/host/spawn.ts#L463-L487) - a worker's link written on the call that spawned it, the pattern for content this host puts on a backend's call"
  - "[code://packages/sdk/src/host/spawn.ts#L238-L246](../../../../packages/sdk/src/host/spawn.ts#L238-L246) - `withWorkerUri`, where a backend's call actions are rewritten in `dispatch`"
  - "[code://packages/sdk/src/host/routing.ts#L375-L377](../../../../packages/sdk/src/host/routing.ts#L375-L377) - `sessionHolding`, the session a chat belongs to, lead or worker"
  - "[code://packages/sdk/src/host/snapshots.ts#L365-L373](../../../../packages/sdk/src/host/snapshots.ts#L365-L373) - where a live chat's turns are stamped for a late subscriber"
  - "[code://packages/sdk/src/host/snapshots.ts#L291-L317](../../../../packages/sdk/src/host/snapshots.ts#L291-L317) - where a worker chat's folded state is served"
  - "[code://packages/sdk/test/subagent-link.test.ts](../../../../packages/sdk/test/subagent-link.test.ts) - a fake backend that writes its own calls"
---

## Objective

A call of the agent terminal tool shows its shell's terminal in its content while the command runs.
The call it completes keeps the terminal, with the code of a command that finished.
A call a subagent makes shows the terminal once it completes, in the worker's chat, as the reference's does.
A client draws such a call as that terminal, live and in a chat it subscribes to later.

## Files

- `UPDATE: packages/sdk/src/host/shells.ts:76-119` - `shellDisplayName`, `keyOf`, and `showing`, which lays a call's terminal after its content or sets the exit on the one there.
- `UPDATE: packages/sdk/src/host/shells.ts:264-332` - `Entry.call`, `Called`, the terminal each call shows, and `HostShells.withTerminal` and `stampedTerminals`.
- `UPDATE: packages/sdk/src/host/shells.ts:412-501` - `associate`, called on both ways a shell is acquired, which writes the terminal on the call.
- `UPDATE: packages/sdk/src/host/shells.ts:634-650` - `exited`, the exit of a completed command on its call's terminal.
- `UPDATE: packages/sdk/src/host/shells.ts:728-794` - the lookup by the chat's session, the session's calls forgotten, the terminal kept on a call's later actions, and the stamp.
- `UPDATE: packages/sdk/src/host.ts:773` - `dispatch` passes each action through `withTerminal` after `withWorkerUri`.
- `UPDATE: packages/sdk/src/host/snapshots.ts:297-317` - a worker chat's folded turns stamped with their calls' terminals.
- `UPDATE: packages/sdk/src/host/snapshots.ts:365-373` - a live chat's turns stamped with their calls' terminals before `stampedCalls`.
- `CREATE: packages/sdk/test/shell-call-terminal.test.ts` - a backend's call of `bash`, on the wire and in a late subscriber's state, and a subagent's in a worker chat.
- `UPDATE: docs/sdk/TOOLS.md` - the call shows its shell, in the agent terminal tool's section.
- `UPDATE: docs/sdk/TERMINALS.md` - the call's terminal, where the agent's shells are said to open.
- `UPDATE: .project/specs/host-tools.md` - the scenario of a call's terminal.
- `UPDATE: CHANGELOG.md` - the agent terminal tool's entry under 0.14.1.

## Steps

1. Key the call that gets a shell by its session and id; the reference keys it by its id.
2. Record the call's terminal block in both ways `acquire` gets a shell.
3. Write the block on the call as `chat/toolCallContentChanged`, as spawn writes a worker's link.
4. Set `isPty: false` on a block whose terminal runs on pipes, and nothing on a pseudoterminal's.
5. Record a completed command's code on its call's block, and nothing for any other ending.
6. Look a call up under the session `sessionHolding` names for its chat, a lead's or a worker's.
7. Pass every action through `withTerminal` in `dispatch`, keeping the block on the call's content and result.
8. Stamp a live chat's turns with their calls' blocks where `snapshots.ts` serves the chat.
9. Stamp a worker chat's folded turns the same way where `snapshots.ts` serves the worker.
10. Forget a session's calls with its shells.
11. Write the five cases, then the docs, the spec and the CHANGELOG.

## Validation

- `packages/sdk/test/shell-call-terminal.test.ts` holds five cases.
- The first: the terminal while running, on the completion with code 0, and in a late subscriber's state.
- Then the code of `false`, the backend's own content keeping the terminal, and a timed-out command with no exit.
- The fifth: a subagent's call in a worker chat, whose completion and worker state carry the terminal.
- Six pieces were each taken out once, and each time the cases that check it failed.
- They were the rewrite in `dispatch`, the write on acquire, both stamps, the exit, and the worker lookup.
- `pnpm boundary`, `pnpm typecheck` and `pnpm build` pass.
- `shell-tools.test.ts`, `subagent-link.test.ts`, `subagent-chat.test.ts`, `calllinks.test.ts` and `host-tools.test.ts` pass beside the new file.
- By hand on Bun: a backend's call of `bash` shows the block on the wire and on its completion.

## Resume

Done 2026-10-27.
A host tool is bound to its session's chat.
The live write of a subagent's call goes there and names no call, as the reference's does.
The call's completion in the worker's chat carries the terminal, as the reference completes such a call on its subagent's chat.
