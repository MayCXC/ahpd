---
title: The docs say where a turn read back ends
status: todo
depends: [task-01-a-fork-wakes-a-sleeping-session.md, task-02-claude-names-where-a-read-turn-ended.md]
layer: docs
refs:
  - "[code://packages/sdk/src/types/session.ts#L450-L480](../../../../packages/sdk/src/types/session.ts#L450-L480) - the contract of `forkPoint` and `endPoint`"
  - "[code://docs/sdk/CHATS.md#L63](../../../../docs/sdk/CHATS.md#L63) - the rewind paragraph"
  - "[code://docs/sdk/SESSIONS.md#L38](../../../../docs/sdk/SESSIONS.md#L38) - what wakes a sleeping session"
  - "[code://.project/specs/sessions-and-chats.md](../../../../.project/specs/sessions-and-chats.md) - the scenarios of sessions and chats"
---

## Objective

The contract, the chats page, the sessions page and the spec say when a turn read back is a point to fork and cut at.
They also say that a new chat wakes a sleeping session.

## Files

- `UPDATE: packages/sdk/src/types/session.ts:466-480` - the contract says when a turn read back has a point.
- `UPDATE: docs/sdk/CHATS.md:63` - the rewind paragraph's refused forms.
- `UPDATE: docs/sdk/SESSIONS.md:38` - a new chat, a fork among them, wakes a sleeping session.
- `UPDATE: .project/specs/sessions-and-chats.md` - two scenarios: a fork wakes a sleeping session, and a turn read back is a point to fork and cut at.
- `CREATE: .project/plans/host/20261028-1248-a-turn-read-back-is-a-fork-point/implemented.md` - the record of what was built.

## Steps

1. Write the contract's sentence on read turns as a first version.
2. Rewrite the refused forms in the rewind paragraph.
3. Add a new chat to the things that wake a sleeping session.
4. Add the two scenarios to the spec.
5. Write `implemented.md`, and set the tasks and the plan to `done` and `built`.

## Validation

- `node .agents/skills/do-spec/scripts/lint-prose.mjs .project/plans/host/20261028-1248-a-turn-read-back-is-a-fork-point` passes.
- `rg "are not recorded" packages docs` finds nothing.

## Resume
