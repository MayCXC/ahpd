---
title: A session forks where the server can
status: done
depends: [task-01-a-resume-does-not-replay.md]
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/session.ts#L20-L23](../../../../packages/agent-acp/src/session.ts#L20-L23) - the comment that lists a fork as unsupported"
  - "[code://packages/agent-acp/src/session.ts#L1006-L1147](../../../../packages/agent-acp/src/session.ts#L1006-L1147) - `open`, where `Start.forkAt` becomes a fork"
  - "[code://packages/sdk/src/types/agent.ts#L357](../../../../packages/sdk/src/types/agent.ts#L357) - `chats.fork`, a static field of the agent; `probe` spawns nothing"
  - "[code://packages/sdk/src/types/session.ts#L245-L260](../../../../packages/sdk/src/types/session.ts#L245-L260) - `forkPoint`, which offers the control per turn"
  - "[code://.project/plans/host/19-a-fork-copies-through-the-turn/task-01-contract-says-fork-copies-through-turn.md](../../host/19-a-fork-copies-through-the-turn/task-01-contract-says-fork-copies-through-turn.md) - the contract this task is written to; done first"
  - "[code://packages/agent-acp/test/agent-acp.test.ts](../../../../packages/agent-acp/test/agent-acp.test.ts) - the scripted server"
---

## Objective

A client is offered a fork of an ACP session's last turn when the server advertises `session.fork`, and taking it opens a new ACP session copied from the old one.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts` - `forkSession` on the connection, which is ACP's `session/fork`.
- `UPDATE: packages/agent-acp/src/agent.ts` - `chats.fork: true`, a static field.
- `UPDATE: packages/agent-acp/src/session.ts` - `forkPoint` for the last turn only and only when the session's server advertised `session.fork`, and the fork in `session/opening.ts` when `Start.forkAt` is set.
- `UPDATE: packages/agent-acp/src/session.ts:20-23` - the comment no longer lists a fork as unsupported.
- `UPDATE: packages/agent-acp/test/agent-acp-catalog.test.ts` - the cases below.

## Steps

1. Declare `chats.fork: true` statically on the agent (`agent.ts:357`); nothing spawns at load.
   Each session reads `session.fork` from its own server's handshake, and its `forkPoint` answers `undefined` for every turn when the server did not advertise it.
2. `forkPoint(turnId)` answers the end of the chosen turn, its last entry, as host 19's contract says, and only for the last completed turn; every other turn answers `undefined`, because `session/fork` copies the whole session and cannot cut.
3. Wait for host 19 task 01, which rewrites the `forkPoint` contract this step follows.
4. In `open`, when `Start.resume` and `Start.forkAt` are set, call `unstable_forkSession` with the old session id and use the id it answers.
5. A `forkAt` that is not the end of the last turn is refused with a sentence, since the control was never offered for it.

## Validation

- `packages/agent-acp/test/agent-acp-catalog.test.ts`: with `session.fork`, the last turn's fork point is its last entry and an earlier turn has none; forking sends `session/fork` and the new session prompts under the new id; without it, the agent still declares `chats.fork` and no turn has a fork point.
- `pnpm test`, `pnpm typecheck` green.

## Resume

- **The cases went into `packages/agent-acp/test/agent-acp-catalog.test.ts`, not `test/agent-acp.test.ts`**, for the reason task 01's Resume gives: a fork point and a fork are catalogue state, read from the fixture's request log.
- Host 19 is built, so its task 01 contract is in force: a fork copies *through* the chosen turn, and `Session.forkPoint(turnId)` answers the backend's own name for the last entry that turn left behind. This bridge has no such name to give, because `session/fork` copies the whole conversation the server holds and `ForkSessionRequest` carries no cut. What it answers with is the host's own turn id, and `open` checks that id against the last turn of the conversation before it forks - an id that is not the end is refused with a sentence rather than served as a copy that still holds the turns after it.
- The connection member is `forkSession`, named the way `loadSession` and `resumeSession` are, and it sends `methods.agent.session.fork` - the SDK's stable method name for the call; `unstable_forkSession` is a different SDK surface and is not what this package uses.
- `open` reads the fork **first**: `Start.forkAt` with `Start.resume`, before the resume/load branch. A fork is not a reopen, so it must not be reached by the `reopen` test. It also refuses `forkAt` with no `resume`, since a fork names the conversation it copies.
- The refusal for a turn that is not the last is on `String(ctx.turns.at(-1)?.id)`, which on the fork path is the last turn of `Start.seed`, since the server replays nothing for a fork either. The new record is seeded from `Start.seed` through the same `hold()` task 01 added.
- The fork's own answer names a session of its own, so `ctx.acpSessionId` is set to it and the next `session/prompt` goes under that id; the conversation it copied is left where it was, which is what the test reads from the log.
- `--fork` on the fixture advertises `sessionCapabilities.fork`, which the handshake does **not** advertise by default, so the "cannot fork" half is the default server. `chats.fork` is `true` on both, which is the point of the split: the capability is the agent's and is declared statically, and what a *session* can offer is read from its own server.

