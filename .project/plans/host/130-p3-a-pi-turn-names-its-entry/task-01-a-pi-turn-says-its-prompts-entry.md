---
title: A pi turn says its prompt's entry
status: todo
depends: []
layer: "agent-pi"
refs:
  - "[code://packages/agent-pi/src/session.ts#L1071-L1072](../../../../packages/agent-pi/src/session.ts#L1071-L1072) - the prompt"
  - "[code://packages/agent-pi/src/session.ts#L766-L773](../../../../packages/agent-pi/src/session.ts#L766-L773) - `agent_settled`"
  - "[code://packages/agent-pi/src/backend.ts#L60-L100](../../../../packages/agent-pi/src/backend.ts#L60-L100) - the backend port"
  - "[code://packages/agent-pi/test/fake-pi.ts](../../../../packages/agent-pi/test/fake-pi.ts) - the fake backend the suite drives"
---

## Objective

When a pi turn settles, it tells the host the id of its prompt's entry in pi's file, when that id is not the turn's.

## Files

- `UPDATE: packages/agent-pi/src/backend.ts` - `promptAfter(entryId)` on the port, from `SessionManager.getBranch`.
- `UPDATE: packages/agent-pi/src/session.ts:1071-1072` - keep the leaf before the prompt.
- `UPDATE: packages/agent-pi/src/session.ts:766-773` - at `agent_settled`, call `onTurnRecorded` with the prompt's entry.
- `UPDATE: packages/agent-pi/test/fake-pi.ts` - the fake answers `promptAfter` from the entries it wrote.
- `UPDATE: packages/agent-pi/test/agent-pi.test.ts` - the case below.

## Steps

1. Add `promptAfter(entryId: string | undefined): string | undefined` to the backend port.
2. Read the branch with `getBranch()`, and answer the first user message after `entryId`.
3. Start from the root when `entryId` is absent.
4. Keep `backend.leaf()` on the turn before `backend.prompt`.
5. At `agent_settled`, read `promptAfter` with it, and call `start.onTurnRecorded` when the entry id is not the turn's id.
6. Teach the fake the same answer from the entries it holds.

## Validation

- `packages/agent-pi/test/agent-pi.test.ts`: a turn that settles calls `onTurnRecorded` with the turn's id and its prompt's entry id.
- A turn that `replay.ts` reads back has the id `onTurnRecorded` named.
- `pnpm vitest run packages/agent-pi` passes.

## Resume

