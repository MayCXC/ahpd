---
title: Claude names where a turn it read back ended
status: todo
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/transcript.ts#L48-L66](../../../../packages/agent-claude/src/transcript.ts#L48-L66) - `turnsOf`, the read"
  - "[code://packages/agent-claude/src/transcript.ts#L274-L534](../../../../packages/agent-claude/src/transcript.ts#L274-L534) - `buildTurns`, where each entry joins a turn"
  - "[code://packages/agent-claude/src/session/query.ts#L650-L662](../../../../packages/agent-claude/src/session/query.ts#L650-L662) - the rule that names a live turn's end"
  - "[code://packages/agent-claude/src/claude.ts#L537-L554](../../../../packages/agent-claude/src/claude.ts#L537-L554) - `transcript`"
  - "[code://packages/agent-claude/src/claude.ts#L587-L700](../../../../packages/agent-claude/src/claude.ts#L587-L700) - `create`"
  - "[code://packages/agent-claude/src/session/context.ts#L22-L60](../../../../packages/agent-claude/src/session/context.ts#L22-L60) - `ClaudeSessionOptions`"
  - "[code://packages/agent-claude/test/agent-claude-resume.test.ts](../../../../packages/agent-claude/test/agent-claude-resume.test.ts) - the SDK fake and the written transcript that a resume needs"
  - "[code://packages/agent-claude/test/agent-claude-transcript.test.ts](../../../../packages/agent-claude/test/agent-claude-transcript.test.ts) - the frames a read is fed"
---

## Objective

A Claude session that resumes a conversation answers `forkPoint` and `endPoint` for each turn that the host read back from its transcript.
The answer is the turn's last `user` or `assistant` entry in the conversation chain.

## Files

- `UPDATE: packages/agent-claude/src/transcript.ts:48-66` - `turnsOf` takes a map of turn ends to fill.
- `UPDATE: packages/agent-claude/src/transcript.ts:274-534` - `buildTurns` names the last user or assistant entry of each turn.
- `UPDATE: packages/agent-claude/src/claude.ts:537-554` - `transcript` keeps the ends of the conversation that it read.
- `UPDATE: packages/agent-claude/src/claude.ts:587-700` - `create` gives those ends to a session that resumes the conversation without a fork.
- `UPDATE: packages/agent-claude/src/session/context.ts:22-60` - `ClaudeSessionOptions` gets `seedEnds`.
- `UPDATE: packages/agent-claude/src/session/query.ts:535-545` - `ends` starts from `seedEnds`.
- `CREATE: packages/agent-claude/test/agent-claude-read-ends.test.ts` - the tests.

## Steps

1. Write the tests first, and see each fail on main.
2. Give `buildTurns` an optional map, and set a turn's end at each user or assistant entry of the turn.
3. Give `turnsOf` the same optional map, and pass it to `buildTurns`.
4. In `claude.ts`, keep a map of read ends by conversation id, and fill it in `transcript`.
5. In `create`, give a session the read ends of the conversation it resumes when the start has no `forkAt`.
6. Add `seedEnds` to `ClaudeSessionOptions`, with its comment.
7. Start `ends` in `query.ts` from `seedEnds`.
8. Set this task and the plan's Tasks table to `done`.

## Validation

- `agent-claude-read-ends.test.ts`: a session resumed after a read answers `forkPoint` and `endPoint` with each read turn's last entry.
- `agent-claude-read-ends.test.ts`: tool results and an answer move a turn's end, and the next prompt starts the next turn.
- `agent-claude-read-ends.test.ts`: a session that forks the conversation answers no read point.
- `agent-claude-read-ends.test.ts`: a session resumed with no read answers no point.
- `agent-claude-transcript.test.ts` passes unchanged.
- The agent-claude and sdk suites pass at one worker.

## Resume
