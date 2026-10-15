---
title: Claude looks in the folder first
status: done
depends: [task-01-the-record-keeps-the-folder-and-the-host-passes-it.md]
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/catalog.ts#L54-L62](../../../../packages/agent-claude/src/catalog.ts#L54-L62) - `findSession`, which asks the configured paths only"
  - "[code://packages/agent-claude/src/claude.ts#L498](../../../../packages/agent-claude/src/claude.ts#L498) - `find`"
  - "[code://packages/agent-claude/src/claude.ts#L524-L540](../../../../packages/agent-claude/src/claude.ts#L524-L540) - `transcript` and `subagents`"
---

## Objective

agent-claude finds and reads a session in the folder the host gives, before it looks in the configured paths.
A bot session, a subfolder session and a worktree session open after a restart.

## Files

- `UPDATE: packages/agent-claude/src/catalog.ts:54-62` - `findSession` takes the given folder first, then the configured paths.
- `UPDATE: packages/agent-claude/src/claude.ts:498` - `find` passes `at.workingDirectory`.
- `UPDATE: packages/agent-claude/src/claude.ts:524-540` - `transcript` and `subagents` pass `at.workingDirectory`.
- `UPDATE: packages/agent-claude/test/agent-claude-find.test.ts` - the cases below.

## Steps

1. Give `findSession` an optional folder, and ask `getSessionInfo` there before the configured paths.
2. Skip the given folder when it is one of the configured paths, so `getSessionInfo` reads each folder once.
3. Pass `at?.workingDirectory` from `find`, `transcript` and `subagents`.
4. Add the test cases below.

## Validation

- `agent-claude-find.test.ts`: give a folder outside the paths, and `find` answers the session in it.
- `agent-claude-find.test.ts`: give no folder, and `find` answers nothing for the same session.
- `agent-claude-find.test.ts`: a given folder that does not exist falls back to the configured paths.
- Run `pnpm -s typecheck` and `pnpm -s boundary`; each exits 0.
- Run vitest on `packages/agent-claude` and `packages/sdk`; all pass.
- By hand on a test daemon: make a bot, restart, and subscribe to its session. The snapshot comes back.

## Resume

### Built

- `findSession` in `catalog.ts` takes an optional `folder` after the id.
- A folder outside the configured paths is asked first, and only when its project folder holds a transcript for the id that is not empty.
- That check reads one file path under `~/.claude/projects`, from the real path of the folder or from the path as given.
- The check keeps the filename test on the id, so an id that is not a filename finds nothing there.
- A folder that is one of the configured paths moves to the front of the paths and is asked once.
- When the folder does not have the session, or does not exist, the configured paths are asked in their order.
- `find`, `transcript` and `subagents` in `claude.ts` pass `at?.workingDirectory` to `findSession`.
- `projectsDir()` in `catalog.ts` names the projects folder, and `transcriptOf` uses it.
- `stateFile` and `delete` do not use `findSession`, so they have no change.
- `stateFile` gets a folder from the host, and `transcriptOf` already looks in every project folder.
- `delete` calls `deleteSession` with no folder, so the SDK looks in every project folder.

### Validation

- `agent-claude-find.test.ts` has six new cases, and the file passes 11 tests.
- Two cases give a folder outside the paths, and one case gives no folder.
- Two cases give a folder that does not exist, and a folder with no transcript.
- The other cases are a folder that is a configured path, and `transcript` and `subagents` with a folder.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest on `packages/agent-claude`, `packages/sdk`, `packages/server` and `packages/agent-acp` passes 4503 of 4504 tests in 248 files.
- The one failure is `proxy-forward.test.ts` under load, and it passes 25 of 25 when it runs alone, two times.
- By hand, a test daemon ran on port 39433 with its own `XDG_CONFIG_HOME` and `CLAUDE_CONFIG_DIR`.
- The daemon served one empty path, and a written transcript was in a bot folder outside it.
- After a restart, a subscribe to the session with the folder in its record gave the snapshot and the turn.
- The same session with no folder in its record gave -32001.
- The bot was not made through the bot plugin, because a real turn needs the Claude API.

### Seen and not done

- With a folder, `getSessionInfo` runs `git worktree list` in that folder when the transcript is not in its project folder.
- The transcript check before the call stops that for a folder that is not a configured path.
- The check spells the project folder as `transcriptOf` does, so a path longer than 200 characters is not found there.
- The SDK adds a hash to such a project folder name, and the configured paths are then the fallback.
