---
title: A transcript with no message starts under its id
status: done
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/catalog.ts#L88-L128](../../../../packages/agent-claude/src/catalog.ts#L88-L128) - `holds`, `hasTranscript` and `written`"
  - "[code://packages/agent-claude/src/session/query.ts#L207-L208](../../../../packages/agent-claude/src/session/query.ts#L207-L208) - `namedUnder`"
  - "[code://packages/agent-claude/test/agent-claude-resume.test.ts](../../../../packages/agent-claude/test/agent-claude-resume.test.ts) - the cases"
---

## Objective

`written` takes a transcript for a conversation only when it holds an entry of one.
`namedUnder` deletes a transcript with no entry from the folder's project before the CLI starts under its id.

## Files

- `UPDATE: packages/agent-claude/src/catalog.ts:88-128` - the SDK's test of a transcript, `written` by it, and `clearFor`.
- `UPDATE: packages/agent-claude/src/session/query.ts:207-208` - `namedUnder` clears the transcript first.
- `UPDATE: packages/agent-claude/src/claude.ts:624-634` - the comment names the transcript with no entry.
- `UPDATE: packages/agent-claude/test/agent-claude-resume.test.ts` - the CLI's own lines, and the cases.
- `UPDATE: packages/agent-claude/test/agent-claude-read-ends.test.ts` - the CLI's own first entry.
- `UPDATE: packages/sdk/test/support/claude-sdk.ts` - `wrote` writes the CLI's own first entry.
- `UPDATE: .project/specs/agent-backends.md`, `packages/agent-claude/README.md`, `CHANGELOG.md` - the transcript with no entry.

## Steps

1. Write the transcript the CLI left on the daemon, with the same three lines.
2. Add a case that resumes it, and a case that starts a session under its id.
3. Add a case that starts a session under the id of a written conversation.
4. Make every helper that writes a conversation write the CLI's own first entry.
5. Run the cases, and see the first two fail.
6. Read each transcript with the SDK's test in `written`.
7. Delete a transcript with no entry in `namedUnder`, for a session that is not in a machine.
8. Run the cases again, and see them pass.

## Validation

- Run the new cases of `agent-claude-resume.test.ts` before steps 6 and 7, and see the first two fail.
- Run them after step 7, and see all three pass.
- `agent-claude-resume.test.ts` and `agent-claude-read-ends.test.ts` pass.
- The sdk cases that call `wrote` pass.
- The agent-claude and sdk type checks pass.

## Resume

Done 2026-10-29.
Every step is built, and every check the Validation names was run.
