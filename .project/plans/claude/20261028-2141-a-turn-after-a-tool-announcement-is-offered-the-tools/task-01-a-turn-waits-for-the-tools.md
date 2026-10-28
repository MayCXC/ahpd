---
title: A turn waits for the tools its session was handed
status: planned
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L492-L515](../../../../packages/agent-claude/src/session/clienttools.ts#L492-L515) - `setTools`"
  - "[code://packages/agent-claude/src/session/turns.ts#L162-L230](../../../../packages/agent-claude/src/session/turns.ts#L162-L230) - `beginTurn`"
---

## Objective

A turn begun after the session was handed new tools sends its prompt once the CLI has them.
Two changes close together reach the CLI one after the other.

## Files

- `UPDATE: packages/agent-claude/src/session/context.ts` - `retooling`, the change the CLI has not finished taking.
- `UPDATE: packages/agent-claude/src/session.ts` - `retooling` starts empty.
- `UPDATE: packages/agent-claude/src/session/clienttools.ts` - `setTools` sends a change at once when none is in hand and after it otherwise, and holds it as `retooling` until it lands.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `beginTurn` waits for `retooling` under `beginning`.
- `CREATE: packages/agent-claude/test/agent-claude-tools-before-turn.test.ts` - a fake SDK that answers `setMcpServers` when the test says, connects only a server name it does not have, and records the tools the CLI had at each prompt.
- `UPDATE: .project/specs/agent-backends.md` - the live tool change scenario.
- `UPDATE: CHANGELOG.md` - the entry under Claude.

## Steps

1. Write the cases and see the two about a change in hand fail on the code before this task.
2. Add `retooling` to the context and the session.
3. Move the body of `setTools` into `retool`, and chain each change behind the one in hand.
4. In `beginTurn`, wait for `retooling` under `beginning`, and stop if the session closed meanwhile.
5. Run the cases, the client tool cases of agent-claude, and the sdk cases that announce client tools.
6. Say it in the spec and the changelog.

## Validation

- `agent-claude-tools-before-turn.test.ts` holds three cases: a turn after one change, a turn after two changes, a turn with no change in hand.
- The first two fail before this task; the third guards that nothing waits when nothing is in hand.
- The agent-claude, sdk and server suites at one worker, once, after the change.

## Resume

Not started.
