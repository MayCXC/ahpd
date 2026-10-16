---
title: A turn started on a busy chat is refused
status: done
depends: []
layer: "sdk, agent-claude, agent-acp, agent-cofold, agent-pi"
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L984-L1050](../../../../packages/sdk/src/host/lifecycle.ts#L984-L1050) - `beginOrRun`"
  - "[code://packages/agent-claude/src/session/turns.ts#L194-L206](../../../../packages/agent-claude/src/session/turns.ts#L194-L206) - `beginTurn`"
---

## Objective

The host refuses a new client turn while a turn runs, and no backend's `begin` replaces a running turn.

## Files

- `UPDATE: packages/sdk/src/host/lifecycle.ts:984-1050` - in `beginOrRun`, when `queuedAs` is undefined and `chatState()` has an active turn, return "A turn is running in this chat".
- `UPDATE: packages/agent-claude/src/session/turns.ts:124-206` - `beginTurn` refuses while `busy()`, and leaves `ctx.active` as it is.
- `UPDATE: packages/agent-acp/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/agent-cofold/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/agent-pi/src/session.ts` - the same refusal in `begin`, if `begin` can replace a running turn.
- `UPDATE: packages/sdk/test` - the host cases in Validation, in the file that tests `beginOrRun`.
- `UPDATE: packages/agent-claude/test` - the backend case, in the file that tests `beginTurn`.

## Steps

1. Write the tests first.
2. Add the check to `beginOrRun`.
3. Add the refusal to `beginTurn`, and mirror the `busy()` check in `ran`.
4. Read `begin` in agent-acp, agent-cofold and agent-pi. Add the refusal where `begin` can replace a running turn.
5. Record in the Resume section which backends needed the change.

## Validation

- A test: the host rejects a client `chat/turnStarted` on a busy chat with the sentence.
- The same test: the running turn keeps its id and parts.
- A test: a queued message starts its turn when the running turn ends.
- A test: an automation on an idle chat starts its turn as before.
- A test: agent-claude `begin` while busy leaves `ctx.active` and `ctx.turns` unchanged.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Implemented 2026-10-14. A turn asked for on a chat that is running one is refused, and the running turn stays whole. The host says the sentence to the client before a backend sees the message, and agent-claude drops the turn again if one reaches it.

### What changed, file by file

- `packages/sdk/src/host/lifecycle.ts` - `beginOrRun` returns "A turn is running in this chat" when the chat has an active turn (step 2). The check reads `chatState().activeTurn` inside `run()`, so it reads the chat at the last moment and after any wait for a followed turn. It sits above the two `set` calls, so a refused turn leaves no sender entry behind.
- `packages/agent-claude/src/session/turns.ts` - `beginTurn` returns at the top when `busy()` holds, the check `ran`, `resume` and the queue already use (step 3). `busy()` is `ctx.active !== undefined || ctx.beginning !== undefined`, so a turn whose model switch is still in flight counts as running.
- `packages/sdk/test/host-turn.test.ts` - a new `describe`, `a turn asked for while one is running`, with two cases and its own `busy()` setup.
- `packages/agent-claude/test/agent-claude-turn-recorded.test.ts` - one case, over the file's own `replay()` harness.
- `packages/agent-claude/test/agent-claude-agent-pick.test.ts` - two cases end the turn before the next `begin`, which is what one turn at a time allows.
- `packages/agent-claude/test/agent-claude-handshake.test.ts` - the replaced-query case replaces the CLI on its first turn, rather than with a second turn on a busy chat.
- `packages/server/test/server-restart.test.ts` - the restart case waits for the echo turn to end before it says the next thing, through a new `quiet` helper.

### Which backends needed the change

- agent-claude: yes. `beginTurn` wrote `ctx.active` over the running turn, and the parts the first had streamed went with it.
- agent-acp: no. `begin` already returns when `ctx.active !== undefined`.
- agent-cofold: no. `openTurn` returns `undefined` when `ctx.active !== undefined`, and `startTurn` drops the turn on that.
- agent-pi: no. `begin` queues the message behind the turn that is running.

The three Files lines for these backends stayed as written, because each carries its own condition. Nothing changed in those packages.

### What the refusal leaves out

A message that waited its turn arrives under `queuedAs`, and the backend begins it when the turn in front ends. A `!command` on a host with terminals keeps its own road, which queues it behind the running turn rather than answering it now. Both leave the check, or the queue stops.

### The cases

- `is refused, and the running turn keeps its id and its parts` - a second `chat/turnStarted` is refused with the sentence, carrying the rejected action back to the window that asked. Nothing of the turn reaches the chat, and a second subscribed window hears nothing of it. The active turn keeps its id, its text and its one part.
- `lets the next one start once the running turn has ended` - the same window says a turn again after the first ends, and it runs.
- `leaves the running turn alone when another is begun` - agent-claude's own case: `ctx.active` and `ctx.turns` are as they were, and only `t1` was ever announced.
- The queued-message case the Validation asks for already exists: `host-input.test.ts`, `becomes the next turn when the running one ends`. It passes unchanged, which is what the `queuedAs` exemption is for.

### Seen, and not this task's

- Three agent-claude and server cases began a turn on top of a running one and relied on the replacement this task removes. They now end the running turn first. Each keeps its own subject: the cost of a switch, the query replaced before its bound, and a daemon that ran on.
- `packages/sdk/test/nested-proxy.test.ts` failed in the first four-package run and passed in the second. It passes alone, and two of its cases take about four seconds, so this is the suite under load rather than the change.

### Validation

- `pnpm typecheck`, `pnpm boundary` and `pnpm schema` each exit 0. The boundary reports every package's dependencies declared and none undeclared. The schema holds the same 508 definitions from 506 exported types.
- vitest over `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` in one run, with `--maxWorkers=2 --testTimeout=10000`: 4402 cases passed in 244 files.
- Each of the four packages also passes alone: sdk 2845 cases, server 1012, agent-claude 299, agent-acp 246.

### Left

- `packages/sdk/test/fixtures/wire.jsonl` was rewritten by these runs, as it is by every run. `git checkout -- packages/sdk/test/fixtures/wire.jsonl` is denied in this session, so run it before committing.
- Nothing is committed. This task's own files are the two sources and the five test files above, plus the plan and index rows.
