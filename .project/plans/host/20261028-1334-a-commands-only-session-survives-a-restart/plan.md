---
title: A session that holds only its own commands' turns survives a restart
domain: host
status: planned
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/host/130-a-commands-turn-survives-a-restart/plan.md
changes:
  - specs/sessions-and-chats.md
refs:
  - "[code://.project/specs/sessions-and-chats.md#L225-L233](../../../../.project/specs/sessions-and-chats.md#L225-L233) - the rule: a row nobody lists is pruned"
  - "[code://packages/sdk/src/host/catalogue.ts#L954-L985](../../../../packages/sdk/src/host/catalogue.ts#L954-L985) - `gone`, and the rule's reason: a transcript deleted outside this host leaves a row nothing can open again"
  - "[code://packages/sdk/src/host/catalogue.ts#L874-L888](../../../../packages/sdk/src/host/catalogue.ts#L874-L888) - nested sessions, listed from what this host recorded of them because no backend lists them"
  - "[code://packages/sdk/src/host/catalogue.ts#L889-L928](../../../../packages/sdk/src/host/catalogue.ts#L889-L928) - sessions in folders no backend read, looked up by id before anything is said about them"
  - "[code://packages/sdk/src/host/catalogue.ts#L1016-L1050](../../../../packages/sdk/src/host/catalogue.ts#L1016-L1050) - `adopt`, which holds a row under the name the store kept"
  - "[code://packages/sdk/src/host/history.ts#L324-L342](../../../../packages/sdk/src/host/history.ts#L324-L342) - a nested session opens from the host's record, with no turns of a backend"
  - "[code://packages/sdk/src/host/history.ts#L374-L394](../../../../packages/sdk/src/host/history.ts#L374-L394) - `past`, which answers nothing when the backend holds no transcript"
  - "[code://packages/sdk/src/sessions/sessions.ts#L919-L929](../../../../packages/sdk/src/sessions/sessions.ts#L919-L929) - a prune forgets the row and removes the session's folder"
  - "[code://packages/sdk/src/host/localturns.ts#L100-L130](../../../../packages/sdk/src/host/localturns.ts#L100-L130) - the local turns, one file each under the session's folder"
  - "[code://packages/sdk/src/sessions/catalog.ts#L119-L122](../../../../packages/sdk/src/sessions/catalog.ts#L119-L122) - `titleFrom`, a title out of a first message"
  - "[code://packages/agent-claude/src/session.ts#L71](../../../../packages/agent-claude/src/session.ts#L71) - a backend titles a session after its first prompt"
  - "[code://packages/agent-claude/src/transcript.ts#L522-L531](../../../../packages/agent-claude/src/transcript.ts#L522-L531) - a turn read back takes its times from its own entries"
---

## Goal

A session that ran only `!` commands is listed after a restart, and it opens with its commands' turns and their terminals.
Today the first listing after a restart prunes it, and the prune removes its folder, local turns and kept outputs with it.
The pruning rule stays, for the reason that it states: a row that nothing can open again goes.
A session whose turns the host itself keeps is a row the host can open, as a nested session is.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- On the Mac mini, 2026-10-28: a Claude session with two `!` turns and no model turn was gone after the daemon restarted.
- `rg "nestedSessions" packages/sdk/src/host` - the catalogue lists nested sessions from the store's record, and `gone` answers false for them.
- `rg "attachmentsGone" packages/sdk/src/sessions` - a prune removes the session's folder, where the local turns are.
- `rg "createdAt" packages/sdk/src/sessions/sessions.ts` - only a nested session's record holds dates.
- `rg "keepTitle\(" packages/sdk/src/host` - the host stores a title only when the maker, a client or an agent names the chat.

### Runtime path

```
restart -> listing: no backend lists the session -> gone(id) -> prune -> row and folder removed
built: gone(id) false while turns are kept -> a row from what the host kept -> past: the kept turns -> a turn wakes the backend under the id
```

### Gaps

- `gone` does not know that the host keeps turns for the session.
- The catalogue lists no row for such a session, and `past` opens none.
- A regular session's record holds no dates, and a title only when somebody named the chat.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The rule's text stays, and its reason decides which rows go. | [code://packages/sdk/src/host/catalogue.ts#L954-L955](../../../../packages/sdk/src/host/catalogue.ts#L954-L955) | 01 |
| `gone` answers false while the host keeps local turns for the session. | [code://packages/sdk/src/host/catalogue.ts#L965-L967](../../../../packages/sdk/src/host/catalogue.ts#L965-L967): a nested session is kept the same way | 01 |
| The catalogue lists such a session from what the host kept, after every listing and lookup that could offer it. | [code://packages/sdk/src/host/catalogue.ts#L874-L928](../../../../packages/sdk/src/host/catalogue.ts#L874-L928) | 01 |
| The row's title is the default chat's stored title, or else `titleFrom` of the first kept turn's text. | [code://packages/agent-claude/src/session.ts#L71](../../../../packages/agent-claude/src/session.ts#L71): a backend titles a session after its first prompt | 01 |
| The row's dates are the first kept turn's start and the last kept turn's end. | [code://packages/agent-claude/src/transcript.ts#L522-L531](../../../../packages/agent-claude/src/transcript.ts#L522-L531); `(defaulted: the store keeps dates only for a nested session, and the kept turns are what the host has of this one)` | 01 |
| The row's folder is the one the store recorded for the session. | [code://packages/sdk/src/sessions/sessions.ts#L154-L155](../../../../packages/sdk/src/sessions/sessions.ts#L154-L155) | 01 |
| Opening the session answers its kept turns when no backend holds a transcript for it. | [code://packages/sdk/src/host/history.ts#L324-L342](../../../../packages/sdk/src/host/history.ts#L324-L342): a nested session opens from the host's record | 02 |
| A session with no transcript and no kept turns is pruned, as the rule says. | [code://.project/specs/sessions-and-chats.md#L225-L233](../../../../.project/specs/sessions-and-chats.md#L225-L233) | 01 |

## Proposed architecture

- **Data flow** - the store's record and the kept turns give the row and the turns, and no backend is read for them.
- **State flow** - nothing new is stored; the turns the host keeps for the session are its record.
- **Layer responsibilities** - sdk `host/localturns.ts`: a session's kept turns · sdk `host/catalogue.ts`: `gone` and the row · sdk `host/history.ts`: the opening.
- **Source-of-truth files** - [`code://packages/sdk/src/host/localturns.ts`](../../../../packages/sdk/src/host/localturns.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The catalogue lists a session from its kept turns](task-01-the-catalogue-lists-it.md) | todo | - |
| [02 - It opens with its kept turns](task-02-it-opens-with-its-kept-turns.md) | todo | 01 |
| [03 - The spec and docs say so](task-03-the-spec-and-docs-say-so.md) | todo | 01, 02 |

## Risks and tradeoffs

- A local turn anchored to an agent turn that wrote nothing is dropped as an orphan, as the reference drops one.
- Each prune candidate costs one look at its session folder.

## Resume state

- **Done so far:** drafted 2026-10-28 against main `4c9ab9a3`.
- **Next action:** [task-01-the-catalogue-lists-it.md](task-01-the-catalogue-lists-it.md).
- **Open questions:** none.
- **Watch out for:** a prune removes the session's folder, so a test lists twice to see what stays.

## Final verification checklist

- [ ] After a restart, a session with only `!` turns is listed twice over, and it opens with its turns.
- [ ] A turn sent to it after the restart runs, after its commands' turns.
- [ ] A session with nothing behind it is still pruned.
