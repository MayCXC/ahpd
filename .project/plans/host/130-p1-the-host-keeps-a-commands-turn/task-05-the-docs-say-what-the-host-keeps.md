---
title: The docs say what the host keeps
status: todo
depends: [task-02-a-transcript-read-puts-the-local-turns-back.md, task-03-a-cut-at-a-local-turn-goes-to-the-turn-before-it.md, task-04-local-turns-go-and-move-with-their-chat.md]
layer: "docs"
refs:
  - "[code://docs/sdk/TERMINALS.md#L48](../../../../docs/sdk/TERMINALS.md#L48) - the `!` command"
  - "[code://docs/sdk/CHATS.md#L30](../../../../docs/sdk/CHATS.md#L30) - a fork"
  - "[code://docs/sdk/CHATS.md#L54](../../../../docs/sdk/CHATS.md#L54) - a truncation"
  - "[code://packages/sdk/src/types/agent.ts#L517-L530](../../../../packages/sdk/src/types/agent.ts#L517-L530) - `onTurnRecorded`, whose comment says what the host keeps under a transcript id"
  - "[code://.project/specs/sessions-and-chats.md#L111-L117](../../../../.project/specs/sessions-and-chats.md#L111-L117) - the scenario for `onTurnRecorded`"
---

## Objective

The docs, the port's comment and the spec say what the host keeps, where it puts it back, and what a cut does.

## Files

- `UPDATE: docs/sdk/TERMINALS.md:48` - a `!` command's turn is a local turn of its chat, kept in the session's folder and read back after a restart.
- `UPDATE: docs/sdk/CHATS.md:30` - a fork at a `!` turn forks the agent at the turn before it.
- `UPDATE: docs/sdk/CHATS.md:54` - a truncation at a `!` turn rewinds the agent at the turn before it.
- `UPDATE: docs/sdk/AGENT.md` - a backend that reads turns back under ids of its own names them through `onTurnRecorded`, or a `!` turn after them is lost.
- `UPDATE: packages/sdk/src/types/agent.ts:517-530` - the comment names the anchors of local turns beside the sender.
- `UPDATE: .project/specs/sessions-and-chats.md:111-117` - the scenario adds the anchor, and new scenarios hold a local turn, its read and a cut at it.
- `UPDATE: CHANGELOG.md` - one entry under `Sessions and VS Code parity`.

## Steps

1. Write one paragraph after the `!` command's paragraph in `TERMINALS.md`.
2. Add one sentence each to the fork and the truncation in `CHATS.md`.
3. Add the anchor to the `onTurnRecorded` comment and to `AGENT.md`.
4. Add the scenarios to the spec, in its WHEN and THEN form.
5. Add the changelog entry.
6. Run `node .agents/skills/do-spec/scripts/lint-prose.mjs` on the plan folders and the spec.

## Validation

- The prose linter passes on the plan folders and the spec.
- Each link in the changed docs resolves.

## Resume

