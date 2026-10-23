---
title: Steering messages share the list
status: todo
depends: [01]
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/context.ts#L191-L201](../../../../packages/agent-claude/src/session/context.ts#L191-L201) - `steering`, the one slot"
  - "[code://packages/agent-claude/src/session/turns.ts#L484-L503](../../../../packages/agent-claude/src/session/turns.ts#L484-L503) - `steer`, which sets the slot and emits `chat/pendingMessageSet`"
  - "[code://packages/agent-claude/src/session/query.ts#L186-L200](../../../../packages/agent-claude/src/session/query.ts#L186-L200) - the input loop, which clears the slot on each read"
  - "[code://packages/agent-claude/src/session.ts#L255-L265](../../../../packages/agent-claude/src/session.ts#L255-L265) - the snapshot, with `steeringMessage` and `queuedMessages`"
  - "[code://packages/sdk/src/host/sleep.ts#L104](../../../../packages/sdk/src/host/sleep.ts#L104) - reads `queuedMessages` as the waiting messages"
  - "[code://packages/sdk/src/host/owners.ts#L187](../../../../packages/sdk/src/host/owners.ts#L187) - reads `queuedMessages` as the queued messages"
  - "[code://packages/sdk/src/host/spawn.ts#L303-L304](../../../../packages/sdk/src/host/spawn.ts#L303-L304) - moves both fields on the way out"
  - "git://github.com/microsoft/agent-host-protocol@5d542f9e - the reducer rules for `kind`"
  - "git://github.com/microsoft/vscode@0b4e0632b1f - `getPendingSteeringMessages`"
---

## Objective

agent-claude keeps a list of steering messages, and its snapshot matches what the 1.1.0 reducer makes of its actions.
No steering id stays in the list after the CLI reads it.

## Files

- `CREATE: packages/agent-claude/test/steering.test.ts` - the steering list cases.
- `UPDATE: packages/agent-claude/src/session/context.ts:191-201` - `steering` becomes a list of `{ id, message }`.
- `UPDATE: packages/agent-claude/src/session/turns.ts:484-503` - `steer` appends to the list.
- `UPDATE: packages/agent-claude/src/session/query.ts:186-200` - each read removes the oldest entry and emits its `chat/pendingMessageRemoved`.
- `UPDATE: packages/agent-claude/src/session.ts:255-265` - steering entries go into `queuedMessages` with `kind: 'steering'`, and `steeringMessage` is the latest one.
- `UPDATE: packages/sdk/src/host/sleep.ts:104` - count only the queued kind, if the check means queued messages.
- `UPDATE: packages/sdk/src/host/owners.ts:187` - the same check.

## Steps

1. Change the slot to a list, and append in `steer`.
2. In the input loop, remove the oldest steering entry after each yield, and emit its removal.
3. Build the snapshot with steering entries first, then queued entries, as the window groups them.
4. Read each host reader of `queuedMessages`, and record in Resume whether it means queued only or both.
5. Change a reader that means queued only to skip `kind: 'steering'`.

## Validation

- `packages/agent-claude/test/steering.test.ts` - two steers before a read, then two reads, leave an empty list.
- The same file - the snapshot equals the 1.1.0 reducer applied to the emitted actions.
- `packages/sdk/test/conformance.test.ts` - replays `chat/pendingMessageSet` with both kinds.
- `pnpm vitest run` passes in sdk and agent-claude.

## Resume

