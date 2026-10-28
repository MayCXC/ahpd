---
title: A conversation the CLI never wrote starts under its id
status: done
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/claude.ts#L594-L595](../../../../packages/agent-claude/src/claude.ts#L594-L595) - the chat's id and the folder"
  - "[code://packages/agent-claude/src/claude.ts#L655-L657](../../../../packages/agent-claude/src/claude.ts#L655-L657) - the resume, the fork point and the rewind point"
  - "[code://packages/agent-claude/src/catalog.ts#L81-L99](../../../../packages/agent-claude/src/catalog.ts#L81-L99) - `hasTranscript` and `projectsDir`"
  - "[code://packages/agent-claude/test/agent-claude-trust.test.ts#L60-L85](../../../../packages/agent-claude/test/agent-claude-trust.test.ts#L60-L85) - the options of a session that `create` built"
---

## Objective

When the host asks agent-claude to resume an id that the CLI never wrote, the session starts a new conversation under that id.

## Files

- `UPDATE: packages/agent-claude/src/catalog.ts:81-99` - `written`, whether a project folder holds a transcript for an id.
- `UPDATE: packages/agent-claude/src/claude.ts:594-595` - give the id to a chat that resumes nothing and has no id of its own.
- `UPDATE: packages/agent-claude/src/claude.ts:655-657` - pass `resume`, `forkAt` and `rewindAt` only for a written conversation.
- `CREATE: packages/agent-claude/test/agent-claude-resume.test.ts` - the cases below, over a temporary `CLAUDE_CONFIG_DIR`.
- `UPDATE: packages/sdk/test/support/claude-sdk.ts` - a `CLAUDE_CONFIG_DIR` of the fake's own, and `wrote(id, cwd)`.
- `UPDATE: packages/sdk/test/host-catalogue.test.ts`, `host-chats.test.ts`, `host-files.test.ts`, `host-names.test.ts` - each case that resumes a conversation says the CLI wrote it.
- `UPDATE: packages/agent-claude/README.md` - say which conversations a session resumes.
- `UPDATE: .project/specs/agent-backends.md` - the scenario for a conversation the CLI never wrote.
- `UPDATE: CHANGELOG.md` - the entry under Agents.

## Steps

1. Add `written(id, folder)` to `catalog.ts`.
2. Answer true when `hasTranscript(id, folder)` is true.
3. Otherwise, answer true when any folder under `projectsDir()` holds a non-empty `<id>.jsonl`.
4. Answer false for an id that is not a file name.
5. In `create`, read `written` once for the host's `resume` and the session's folder.
6. Pass `resume`, `forkAt` and `rewindAt` only when `written` answers true.
7. Otherwise, pass the chat's own id, or the host's `resume` when the chat has none.
8. Write the cases in `agent-claude-resume.test.ts`.
9. Run the cases on the code before this change, and record that the first one fails.

## Validation

- A resume of an id with no transcript builds a query with `sessionId` set to that id and no `resume`.
- A chat with an id of its own keeps it, and the query carries no `forkSession` and no `resumeSessionAt`.
- The query resumes a conversation in the folder's project, and one in another folder's project.
- `pnpm exec vitest run packages/agent-claude` passes.
- `pnpm exec vitest run packages/sdk` passes, at one worker.

## Resume

- **Done:** 2026-10-28.
  The three cases for a conversation the CLI never wrote fail on the code before this task.
  The two for a written one pass on both.
  A session in a machine is resumed as the host asks, because its files are in the machine.
  Five sdk cases resumed a conversation that only the fake SDK held, and now say that the CLI wrote it.
