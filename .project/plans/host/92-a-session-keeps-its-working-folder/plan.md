---
title: A session keeps its working folder, and the backends find it there after a restart
domain: host
status: planned
priority: high
created: 2026-10-15
revalidated: 2026-10-15
requires:
  - plans/host/57-pi-cofold-and-acp-find-a-session-by-id/plan.md
refs:
  - "[code://packages/agent-claude/src/catalog.ts#L54-L62](../../../../packages/agent-claude/src/catalog.ts#L54-L62) - `findSession`, which asks `getSessionInfo` in each configured path only"
  - "[code://packages/agent-claude/src/claude.ts#L169](../../../../packages/agent-claude/src/claude.ts#L169) - `dirs`, the configured paths, fixed when the plugin loads"
  - "[code://packages/agent-claude/src/claude.ts#L498](../../../../packages/agent-claude/src/claude.ts#L498) - `find`, which calls `findSession(dirs, id)`"
  - "[code://packages/agent-claude/src/claude.ts#L524-L540](../../../../packages/agent-claude/src/claude.ts#L524-L540) - `transcript` and `subagents`, which find the folder through `findSession` too"
  - "[code://packages/agent-claude/src/catalog.ts#L83](../../../../packages/agent-claude/src/catalog.ts#L83) - `transcriptOf`, which already looks through every project folder"
  - "[code://packages/sdk/src/types/agent.ts#L611](../../../../packages/sdk/src/types/agent.ts#L611) - `Agent.find(id)`, which has no way to say where to look"
  - "[code://packages/sdk/src/types/agent.ts#L685](../../../../packages/sdk/src/types/agent.ts#L685) - `Agent.transcript(id)`, the same"
  - "[code://packages/sdk/src/types/agent.ts#L699](../../../../packages/sdk/src/types/agent.ts#L699) - `Agent.subagents(id, turns)`, the same"
  - "[code://packages/sdk/src/host/history.ts#L263-L275](../../../../packages/sdk/src/host/history.ts#L263-L275) - `findOf`, which asks each backend's `find` with the id alone"
  - "[code://packages/sdk/src/host/history.ts#L364](../../../../packages/sdk/src/host/history.ts#L364) - `past` reads the transcript with the id alone"
  - "[code://packages/sdk/src/host/snapshots.ts#L391](../../../../packages/sdk/src/host/snapshots.ts#L391) - a subscribe reads the transcript with the id alone"
  - "[code://packages/sdk/src/host/snapshots.ts#L541](../../../../packages/sdk/src/host/snapshots.ts#L541) - the -32001 refusal a client gets for a session that `past` cannot find"
  - "[code://packages/sdk/src/sessions.ts#L331-L347](../../../../packages/sdk/src/sessions.ts#L331-L347) - `Row`, the session record, which keeps no working folder"
  - "[code://packages/sdk/src/sessions.ts#L254-L273](../../../../packages/sdk/src/sessions.ts#L254-L273) - `nestedOf`, the one record that keeps `workingDirectories`"
  - "[code://packages/agent-pi/src/replay.ts#L212](../../../../packages/agent-pi/src/replay.ts#L212) - pi's `SessionManager.findById(directory, id)`, which looks in one project folder too"
  - npm://@anthropic-ai/claude-agent-sdk - `getSessionInfo(id, { dir })` and `listSessions({ dir })` read one exact project folder and its git worktrees, not its subfolders
---

## Goal

A session whose working folder is not exactly a configured path opens again after a daemon restart.
Today such a session is lost. Examples are a bot's session under `~/.bots`, a session in a subfolder of a path, and a worktree outside the paths.
The client gets -32001 "no such session", although the transcript is still on disk.
The host keeps each session's working folder in its record, and gives it to the backend that finds and reads the session.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "findSession" packages/agent-claude/src` - `find`, `transcript` and `subagents` all find the folder through the configured paths.
- `rg -n "workingDirector" packages/sdk/src/sessions.ts` - only the nested record keeps working folders.
- `rg -n "agent.find|transcript\?\.\(" packages/sdk/src/host` - every caller passes the id alone.
- `rg -ln -i "working folder|workingDirector" .project/plans` - no plan covers the record. host/23 covers git facts only.

### Runtime path

```
restart -> subscribe to a session -> past(id) -> findOf -> agent.find(id) -> getSessionInfo in each configured path -> nothing -> -32001
```

### Gaps

- The session record has no working folder.
- `find`, `transcript` and `subagents` cannot be told where a session ran.
- agent-claude and agent-pi look only in the configured paths.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| The session record keeps its working folder, and find and transcript look there; this fixes bots, subfolders and worktrees together | Softov, 2026-10-15, to "A session outside the exact served paths is lost after a restart. What to do?" - "Plan it: keep the folder" | 01, 02, 03 |
| The folder reaches the backend as an optional last argument `at?: { workingDirectory?: string }` on `find`, `transcript` and `subagents` | (defaulted: a backend that ignores it keeps working) | 01 |
| A session with no folder in its record is looked for in the configured paths, as today | (defaulted: records written before this plan have none) | 02, 03 |

## Proposed architecture

- **Data flow** - The host writes `workingDirectory` into the session record when it creates a session. It also writes it when a listing or a `find` gives a row with one. It passes the folder to `find`, `transcript` and `subagents`.
- **Event flow** - No new event.
- **State flow** - The folder lives in `<configDir>/sessions/<id>.json`, beside the owner and the provider.
- **Layer responsibilities** - sdk: the record field, the `Agent` argument, the callers · agent-claude: look in the folder first · agent-pi: the same · docs: `AGENT.md` names the argument.
- **Source-of-truth files** - [`code://packages/sdk/src/sessions.ts`](../../../../packages/sdk/src/sessions.ts), [`code://packages/sdk/src/types/agent.ts`](../../../../packages/sdk/src/types/agent.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The record keeps the folder, and the host passes it](task-01-the-record-keeps-the-folder-and-the-host-passes-it.md) | done | - |
| [02 - Claude looks in the folder first](task-02-claude-looks-in-the-folder-first.md) | done | 01 |
| [03 - pi looks in the folder first](task-03-pi-looks-in-the-folder-first.md) | todo | 01 |

## Risks and tradeoffs

- A record folder is a path that a client chose - The backend reads only a session by its id in that folder. The id is already checked as a filename.
- A folder can move or be deleted - The backend then looks in the configured paths, as today.
- A session that a listing never showed has no folder after the upgrade - It stays lost until it is opened once from its folder. The plan does not scan every project folder at load.

## Resume state

- **Done so far:** the plan, 2026-10-15, from the plugin/48 review. Task 01 is done, 2026-10-15.
- **Next action:** [task-02-claude-looks-in-the-folder-first.md](task-02-claude-looks-in-the-folder-first.md) and [task-03-pi-looks-in-the-folder-first.md](task-03-pi-looks-in-the-folder-first.md).
- **Open questions:** none.
- **Watch out for:**
  - plugin/48 closes after this plan, because a webhook thread's chat lives in a bot session under `~/.bots`.
  - The catalogue still lists only the configured paths. A session outside them opens by its link, but the session list does not show it.
  - cofold and ACP find a session by id in their own store, so they need no change.

## Final verification checklist

- [ ] A bot session under `~/.bots` opens after a restart on a test daemon.
- [ ] A session in a subfolder of a configured path opens after a restart.
- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- [ ] Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude`, `packages/agent-acp` and `packages/agent-pi` passes.
- [ ] `plans/index.md` updated.
