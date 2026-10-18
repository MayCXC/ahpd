---
title: A session outside the paths stays listed
domain: host
status: active
priority: high
created: 2026-10-18
revalidated: 2026-10-18
requires: []
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L704-L886](../../../../packages/sdk/src/host/catalogue.ts#L704-L886) - `listing`, which builds the rows from the backends' lists"
  - "[code://packages/sdk/src/host/catalogue.ts#L812-L829](../../../../packages/sdk/src/host/catalogue.ts#L812-L829) - the nested sessions, a row built from what the store recorded"
  - "[code://packages/sdk/src/host/catalogue.ts#L864-L884](../../../../packages/sdk/src/host/catalogue.ts#L864-L884) - `gone`, which keeps the record of a session in a folder that no backend read"
  - "[code://packages/sdk/src/host/history.ts#L275-L290](../../../../packages/sdk/src/host/history.ts#L275-L290) - `findOf`, which asks each backend with the recorded folder"
  - "[code://packages/sdk/src/host/history.ts#L181-L207](../../../../packages/sdk/src/host/history.ts#L181-L207) - `refresh`, which replaces the rows with a new listing"
  - "[code://packages/sdk/src/types/sessions.ts#L314](../../../../packages/sdk/src/types/sessions.ts#L314) - `nestedSessions`, the store's list of one kind of record"
  - "[code://packages/sdk/src/types/sessions.ts#L366](../../../../packages/sdk/src/types/sessions.ts#L366) - `workingDirectory`, the folder a session ran in"
  - "[code://packages/agent-claude/src/catalog.ts#L34-L37](../../../../packages/agent-claude/src/catalog.ts#L34-L37) - Claude lists only its configured `paths`"
---

## Goal

A session that ran in a folder that no backend lists stays in the catalogue.
This includes a bot's own folder, such as `~/.bots/ember`, and a git worktree.
After a restart, the row is there before anything opens or wakes the session.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
restart -> listing: backends list their paths -> the store's recorded sessions whose folder is not in `read` -> agent.find(id, { workingDirectory }) -> adopt -> row
```

### What is true now

- `listing` makes rows only from what a backend lists, from nested records, and from a silent backend's last rows.
- Claude lists only its `paths`, so a session in `~/.bots/ember` is never offered.
- Opening such a session finds it through `findOf` and adds the row, but the next `refresh` removes it again.
- `gone` already keeps the store record, because it cannot say a session in an unread folder is gone.
- The comment on `gone` says the same is true of a session in a git worktree.

### Gaps

- The store has no list of every recorded session with its provider and folder. `nestedSessions` lists only the nested ones.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each listing looks up every recorded session whose folder no backend read, with `agent.find`, and adds the rows it finds | Softov, 2026-10-18, chose "Look up recorded ones" for "How should a session in a folder no backend lists stay on the session list?", because "it can be useful to list sessions not in the server" | 01 |
| A session that is running, claimed or already offered is not looked up | (defaulted: rows are keyed by session id, as for nested sessions) | 01 |
| A lookup that fails or finds nothing adds no row, and the record stays | (defaulted: the same rule as `gone`) | 01 |

## Proposed architecture

- **Data flow:** the backends answer, and `read` holds their folders. Each recorded session outside `read` goes to `agent.find` with its folder, then to `adopt`.
- **Layer responsibilities:** sdk only. The store lists its records, and the catalogue looks them up. No backend changes.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The listing looks up recorded sessions](task-01-the-listing-looks-up-recorded-sessions.md) | implemented | - |

## Risks and tradeoffs

- Each listing makes one `find` per session outside the paths. The number is small now. A cache between listings can come later if it grows.

## Resume state

- **Done so far:** The plan was written 2026-10-18.
  Task 01 is implemented, with 6 tests.
  A listing asks the backends' `find` about each recorded session in a folder that no backend read.
  The gates and the sdk suite pass.
- **Next action:** None, since task 01 is the plan's only task. Nothing is set to `done`, and the index is untouched.
- **Open questions:** none.
- **Watch out for:** the lookups run after the backends answer, because `read` is only known then. Run them at the same time with `Promise.all`, and fold them in a fixed order.
  Each pass makes one `find` per recorded session outside the paths.
  A session whose record names no folder is not looked up.

## Final verification checklist

- [ ] A test: after a restart, a session in a folder outside `paths` is listed before it is opened.
- [ ] A test: the row stays across two refreshes, with no `root/sessionRemoved`.
- [ ] A test: a session in a git worktree folder is listed the same way.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [ ] By hand: after a restart, the Ember bot's session opens from the catalogue.
- [ ] `plans/index.md` updated.
