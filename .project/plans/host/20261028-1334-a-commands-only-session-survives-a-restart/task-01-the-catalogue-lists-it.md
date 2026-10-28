---
title: The catalogue lists a session from its kept turns
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/localturns.ts#L100-L130](../../../../packages/sdk/src/host/localturns.ts#L100-L130) - where a chat's local turns are, and `keptIn`"
  - "[code://packages/sdk/src/host/catalogue.ts#L874-L928](../../../../packages/sdk/src/host/catalogue.ts#L874-L928) - nested sessions and the lookups of unread folders"
  - "[code://packages/sdk/src/host/catalogue.ts#L954-L985](../../../../packages/sdk/src/host/catalogue.ts#L954-L985) - `gone` and the prune"
  - "[code://packages/sdk/test/host-local-turns.test.ts](../../../../packages/sdk/test/host-local-turns.test.ts) - a host started again on the same store, and the backend these cases share"
---

## Objective

A session whose turns the host keeps is not pruned, and the catalogue lists it from what the host kept when no backend offers it.

## Files

- `UPDATE: packages/sdk/src/host/localturns.ts:100-130` - `keptTurnsOf(id)`, every turn a session's chats keep, read by the same check as `keptIn`.
- `UPDATE: packages/sdk/src/host/catalogue.ts:874-985` - a row for such a session after the lookups, and `gone` false for it.
- `UPDATE: packages/sdk/test/host-local-turns.test.ts` - the cases of a session that ran only commands.

## Steps

1. Write the tests first, and see each fail on main.
2. Read a chat folder's files with one helper, and use it in `keptIn` and in `keptTurnsOf`.
3. Answer every kept turn of a session from `keptTurnsOf`, across its chats.
4. In `gone`, answer false for a session that keeps a turn.
5. After the lookups, list each recorded session that nothing offered and that keeps a turn.
6. Title the row from the stored title of its default chat, or else from its first kept turn with `titleFrom`.
7. Date the row from its first kept turn's start and its last kept turn's end.
8. Set this task and the plan's Tasks table to `done`.

## Validation

- `host-local-turns.test.ts`: after a restart, two listings both hold a session that ran only `!` turns.
- `host-local-turns.test.ts`: the row carries the first command's text as its title and the turns' times as its dates.
- `host-local-turns.test.ts`: after a restart, the prune removes a session with no turns at all.

## Resume
