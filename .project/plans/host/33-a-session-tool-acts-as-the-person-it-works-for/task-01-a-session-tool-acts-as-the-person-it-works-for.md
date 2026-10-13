---
title: A session tool acts as the person it works for
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/types/host.ts#L701-L805](../../../../packages/sdk/src/types/host.ts#L701-L805) - `ToolCall`, what a tool sees: it carries no person"
  - "[code://packages/sdk/src/host/tooling.ts#L1048-L1217](../../../../packages/sdk/src/host/tooling.ts#L1048-L1217) - `toolContext`, the one place a `ToolCall` is made, and `send`, `create`, `createChat`, `remove`"
  - "[code://packages/sdk/src/host/tooling.ts#L1337](../../../../packages/sdk/src/host/tooling.ts#L1337) - the one caller, in `offeredTools`"
  - "[code://packages/sdk/src/host/owners.ts#L97-L116](../../../../packages/sdk/src/host/owners.ts#L97-L116) - `senders` and `sentBy`, the person and the window of each turn, by turn id"
  - "[code://packages/sdk/src/host/lifecycle.ts#L959-L1012](../../../../packages/sdk/src/host/lifecycle.ts#L959-L1012) - `beginOrRun`, where a turn's sender is recorded"
  - "[code://packages/sdk/src/host/spawn.ts#L672-L680](../../../../packages/sdk/src/host/spawn.ts#L672-L680) - the sender moved from a queued message to the turn it became"
  - "[code://packages/sdk/src/host/automations.ts#L619-L628](../../../../packages/sdk/src/host/automations.ts#L619-L628) - an automation turn records its creator in `senders`"
  - "[code://packages/sdk/src/host/wakes.ts#L79-L100](../../../../packages/sdk/src/host/wakes.ts#L79-L100) - a wake begins its turn with no sender"
  - "[code://packages/sdk/src/types/sessions.ts#L104-L109](../../../../packages/sdk/src/types/sessions.ts#L104-L109) - the stored wake, which keeps no person"
  - "[code://packages/sdk/src/host/lifecycle.ts#L441-L452](../../../../packages/sdk/src/host/lifecycle.ts#L441-L452) - `mayDispose`, which `remove` asks as the calling session's owner"
  - "[code://packages/sdk/src/types/users.ts#L53](../../../../packages/sdk/src/types/users.ts#L53) - `Principal.can(grant)`"
  - "[code://packages/sdk/src/host/gate.ts#L412](../../../../packages/sdk/src/host/gate.ts#L412) - `refusalReason`, the words a missing grant is refused with"
  - "[code://packages/sdk/src/tools/session.ts#L346-L660](../../../../packages/sdk/src/tools/session.ts#L346-L660) - the nine session tools"
---

## Objective

Under a users directory, each session tool asks the grants of its turn's person before it acts.
`list_sessions` lists only the sessions that person may read.
A turn that a session tool or a wake starts carries the person of the turn that started it.
A turn with no person gets no session tool that writes.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:701-805` - `ToolCall` gains `may(grant)`, which answers whether the turn's person holds the grant here.
- `UPDATE: packages/sdk/src/host/tooling.ts:1048-1217` - `toolContext` builds `may` from the turn's sender, filters `sessions()`, and records the sender on the turns `send`, `create` and `createChat` begin.
- `UPDATE: packages/sdk/src/tools/session.ts:346-660` - each session tool asks `may` before it acts and refuses with the host's words.
- `UPDATE: packages/sdk/src/types/sessions.ts:104-109` - the stored wake keeps the `Owner` of the turn that set it.
- `UPDATE: packages/sdk/src/host/wakes.ts:79-100` - a wake begins its turn with the stored owner as its sender.
- `UPDATE: packages/sdk/test/sessiontools.test.ts` - the grant cases below.
- `UPDATE: docs/TOOLS.md` - what each session tool needs under a users directory.

## Steps

1. Read the plan's *Decisions locked in* rows for task 01.
2. Add `may(grant: Grant): boolean` to `ToolCall`, with a comment that says it is always true when the host has no users directory.
3. In `toolContext`, find the turn's person with `senderOf(activeTurnOf(chatUri))` and its principal with `principalFor`.
4. Answer true from `may` when `options.users` has no value, and for root, as `admit` in `admission.ts` does.
5. Answer false from `may` for a turn with no person under a users directory.
6. Otherwise answer `principal.can(grant)` from `may`.
7. Filter `sessions()` so it returns only the rows the person may `session:read`.
8. Require `session:read` in `get_current_session` and `get_session_context`.
9. Require `session:write` in `set_workspace`, `create_session`, `create_chat`, `rename_chat`, `send_message` and `delete_session`.
10. Leave `list_sessions` without a check, because `sessions()` is already filtered.
11. Refuse a missing grant with the words `refusalReason` in `gate.ts` gives: `<id> may not <grant> here`.
12. In `send`, `create` and `createChat`, record the calling turn's `Owner` in `senders` under the new turn id.
13. Record the calling turn's connection in `sentBy` too, when `sentBy` holds one for it.
14. For a message that `send` queues, record the owner under the queued id. The move in `spawn.ts` carries it to the turn.
15. Add `sender?: Owner` to the stored wake, and set it from the calling turn's owner in `scheduleWake`.
16. In `wakes.ts`, record the stored owner in `senders` for the turn the wake begins.
17. Make `remove` ask `mayDispose` as the turn's person, not as the calling session's owner.
18. Leave `schedule_wakeup` without a check, because it acts only on the calling chat.
19. Write each tool's grant in `docs/TOOLS.md`, one line per tool.

## Validation

- `sessiontools.test.ts`: under a users directory, a guest's turn lists only sessions it may read. The host refuses its `create_session` with `may not session:write here`.
- `sessiontools.test.ts`: a member's turn creates a session, and the child's turn carries the member's grants.
- `sessiontools.test.ts`: a turn with no person reads, and the host refuses it every writing tool.
- `sessiontools.test.ts`: a member's wake begins a turn that carries the member, also after a reload of the store.
- `sessiontools.test.ts`: with no users directory, every tool acts as it does today.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume
