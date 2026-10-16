---
title: The origin instruction is given on each turn
status: done
depends: [task-02-the-agent-reports-back.md]
layer: "packages/sdk, packages/agent-claude"
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1061](../../../../packages/sdk/src/host/tooling.ts#L1061) - `instructions`, read once at backend start"
  - "[code://packages/sdk/src/host/spawn.ts#L560](../../../../packages/sdk/src/host/spawn.ts#L560) - where start hands the instructions to a backend"
  - "[code://packages/sdk/src/types/session.ts#L448](../../../../packages/sdk/src/types/session.ts#L448) - `begin`, and `queue` at line 484"
  - "[code://packages/agent-claude/src/session/query.ts#L265](../../../../packages/agent-claude/src/session/query.ts#L265) - the query's hooks"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/chatContributions/remoteSessionOrigin/remoteSessionOriginContribution.ts - `onOutgoingTurn` gives the instruction per turn
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentSideEffects.ts - `outgoingTurn` result passed to `send` as `hostInstructions`
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts - `getUserPromptAdditionalContext` gives `hostInstructions` to the `UserPromptSubmit` hook
---

## Objective

A client that joins a running session with `send_remote_message` makes the next turn carry the origin instruction.
The host decides the instruction when each turn begins, as VS Code's `onOutgoingTurn` does, and not once at backend start.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1061` - move the origin instruction out of `instructions` into a new per-turn function.
- `UPDATE: packages/sdk/src/types/session.ts:448` - `begin` and `queue` take the turn's instructions.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:1008` - give each turn its instructions when it begins.
- `UPDATE: packages/agent-claude/src/session/query.ts:265` - a `UserPromptSubmit` hook gives the turn's instructions as additional context.
- `UPDATE: packages/sdk/test/host-remote-session.test.ts` - the cases below.
- `UPDATE: packages/agent-claude/test` - the hook case, in the file that tests the query's hooks.

## Steps

1. Read how VS Code passes `hostInstructions` from `outgoingTurn` to `send` and into the `UserPromptSubmit` hook.
2. Add `turnInstructions(uri)` to tooling, and move the origin rule from `instructions` into it.
3. Keep the tool instructions in `instructions`, given at start as now.
4. Add the turn's instructions to `begin` and `queue` as an optional last argument that holds an options object.
5. Decide the instructions when the turn begins, so a queued turn reads the clients present when it starts.
6. Pass them from every place in `packages/sdk/src/host` that calls `begin` or `queue`, through one function.
7. In agent-claude, keep the turn's instructions and give them from a `UserPromptSubmit` hook as `additionalContext`.
8. Clear them when the turn ends, as VS Code clears `_hostInstructions`.
9. Leave the other backends unchanged, and list ACP, cofold and pi in the plan's `deferred.md`.
10. Stop and write the question in the Resume state if the hook cannot give context on this SDK version.

## Validation

- A client that joins a running session with `send_remote_message` makes the next turn carry the instruction.
- A client that leaves makes the next turn carry no instruction.
- The instruction is no longer in what the backend gets at start.
- The Claude hook gives the turn's instructions, and gives nothing on a turn without them.
- `pnpm -s typecheck`, `pnpm -s boundary`, `pnpm exec vitest run packages/sdk` and `pnpm exec vitest run packages/agent-claude` pass.

## Resume

The origin rule left `instructions` and became `turnInstructions(uri)` in `packages/sdk/src/host/tooling.ts`, which hands the backend a `TurnOptions` rather than the words themselves.

The option holds a function, not a list, and the backend calls it when the turn begins. Step 4 asked for an options object and step 5 asked for the words to be read at turn start. A list captured at `queue` time cannot do step 5. The queue entry is promoted inside the backend by `startNext`, later than the call that stored it. A function makes both true, and it is what VS Code does - its queued turns are enriched at their own send time.

`begin` and `queue` take that object as their last argument. `beginOrRun` in lifecycle is the one place a message becomes a turn, so it is where every turn is given the same thing. `moveSession` and `beginIn` are the two other roads to a turn, and both pass the same function.

agent-claude keeps the words on `ctx.hostInstructions` as `{ turn, said }`, where `turn` is the `ctx.active` the turn was given. The `UserPromptSubmit` hook answers only when `held.turn === ctx.active`. So the words expire with the turn that owns them, and no road that ends a turn has to clear them.

Step 10 does not arise. The installed `@anthropic-ai/claude-agent-sdk` types `UserPromptSubmitHookSpecificOutput` with `additionalContext`, so the hook can give context.

No file the p4 build names was edited.

Files changed:

- `packages/sdk/src/types/session.ts`
- `packages/sdk/src/types/index.ts`
- `packages/sdk/src/host/tooling.ts`
- `packages/sdk/src/host/lifecycle.ts`
- `packages/sdk/src/host/automations.ts`
- `packages/agent-claude/src/session/context.ts`
- `packages/agent-claude/src/session.ts`
- `packages/agent-claude/src/session/turns.ts`
- `packages/agent-claude/src/session/query.ts`
- `packages/sdk/test/host-remote-session.test.ts`
- `packages/agent-claude/test/agent-claude-background-work.test.ts`
- `.project/plans/host/83-p3-a-remote-session-keeps-its-origin/deferred.md`

The `packages/sdk` run rewrites its own capture, `packages/sdk/test/fixtures/wire.jsonl`. The restore command is denied in this preset, so Softov reverts it if the recording is not wanted.

`pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` pass, the last as 142 files and 2782 tests. `pnpm exec vitest run packages/agent-claude --maxWorkers=2 --testTimeout=10000` passes, as 27 files and 266 tests. One assertion was added to `host-remote-session.test.ts` after the sdk run, and that file passes on its own at 12 tests.

