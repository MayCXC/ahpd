---
title: A session disposed while its count is read leaves no file
domain: host
status: active
priority: high
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - git://c26f1e96 - the commit of `main` the facts were checked at
  - "[code://packages/sdk/src/host/catalogue.ts#L665-L695](../../../../packages/sdk/src/host/catalogue.ts#L665-L695) - `summaryKept`, which writes a session's counts after a `git diff`"
  - "[code://packages/sdk/src/host/catalogue.ts#L752](../../../../packages/sdk/src/host/catalogue.ts#L752) - the sessions this host is running: `sessions` and `ctx.respawning`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L350](../../../../packages/sdk/src/host/lifecycle.ts#L350) - a disposal takes the session out of `sessions`"
  - "[code://packages/sdk/src/host/lifecycle.ts#L432](../../../../packages/sdk/src/host/lifecycle.ts#L432) - and then forgets its row"
  - "[code://packages/sdk/src/host/lifecycle.ts#L759-L760](../../../../packages/sdk/src/host/lifecycle.ts#L759-L760) - a respawn holds the session in `respawning` while it is out of `sessions`"
  - "[code://packages/sdk/src/host/spawn.ts#L1715](../../../../packages/sdk/src/host/spawn.ts#L1715) - a new session's counts are read after its baseline checkpoint"
  - "[code://packages/sdk/src/sessions/sessions.ts#L678-L681](../../../../packages/sdk/src/sessions/sessions.ts#L678-L681) - a row with nothing left removes its file"
---

## Goal

A session that is disposed leaves no file in the session store.
A count of its changes that arrives after the disposal writes nothing.
The next daemon does not list a session that nobody can open.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "setChanges\(" packages/sdk/src` - the catalogue's `summaryKept` is the one writer of a session's counts.
- `rg -n "summaryKept\(" packages/sdk/src` - a turn, a checkpoint after a turn, and a new session's baseline ask for counts.
- `rg -n "sessions.delete\(uri\)" packages/sdk/src/host/lifecycle.ts` - a disposal and a respawn take a session out of `sessions`.

### Runtime path

```
createSession -> baseline checkpoint -> summaryKept -> git diff (awaited)
disposeSession -> sessions.delete -> kept.forget -> the row's file is removed
git diff ends -> kept.setChanges -> a row of counts alone -> a file of counts alone
```

### Gaps

- `summaryKept` writes its count after an await, and nothing checks that the session is still here.
- On one daemon, a session made at 03:10:12 was disposed at 03:10:13.
- It left a 142-byte file of counts, and the daemon listed it after a restart.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A session this host runs is one in `sessions` or in `ctx.respawning` | [code://packages/sdk/src/host/catalogue.ts#L752](../../../../packages/sdk/src/host/catalogue.ts#L752) | 01 |
| A count is written only for a session this host still runs | A disposal forgets the row, [code://packages/sdk/src/host/lifecycle.ts#L432](../../../../packages/sdk/src/host/lifecycle.ts#L432) | 01 |

## Proposed architecture

- **Data flow** - `summaryKept` reads a count, then writes it only when the session is in `sessions` or `ctx.respawning`.
- **Layer responsibilities** - sdk: `host/catalogue.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A count arrives for a session that is gone](task-01-a-count-arrives-for-a-session-that-is-gone.md) | todo | - |

## Risks and tradeoffs

- A count read during a respawn is kept, because the respawn holds the session in `respawning`.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-count-arrives-for-a-session-that-is-gone.md](task-01-a-count-arrives-for-a-session-that-is-gone.md).
- **Open questions:** none.
- **Watch out for:** the count is a `git diff`, so the read can end after any later event.

## Final verification checklist

- [ ] A session disposed while its count is read leaves no file.
- [ ] Every other case in `host-catalogue.test.ts` passes.
