---
title: The docs say when a set is echoed
status: done
depends: [task-01-the-sender-hears-its-unchanged-set.md, task-03-an-idle-cancel-is-echoed-to-its-sender.md]
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L651-L659](../../../../docs/sdk/AHP.md#L651-L659) - the section on an action that changes nothing"
---

## Objective

`AHP.md` says that the sender of an unchanged set, or of a cancel with nothing to stop, gets an echo.
It says that no other client does.

## Files

- `UPDATE: docs/sdk/AHP.md:651-659` - one paragraph on the echo to the sender.

## Steps

1. Add a paragraph to the section on an action that changes nothing.
2. Say that only the sender gets the echo, and why.
3. Name a cancel with nothing to stop as the second case.
4. Say that the echo does not move `serverSeq`.
5. Set this task and the plan row to `implemented`.

## Validation

- The paragraph matches the behaviour of task 01.
- `pnpm -s docs:build` passes.

## Resume

Built 2026-10-16, uncommitted. The worktree holds `docs/sdk/AHP.md`, and with it the two tasks this one documents.

### What changed, file by file

- `docs/sdk/AHP.md` - two paragraphs under *An action that changes nothing is not a change*, after the one that ends on the loop of three hundred round trips. The first says the silence is for the other clients and that the sender is answered: a client holds the action it sent until this host answers to its `clientSeq`, so an unanswered sender holds a change nobody will confirm until it reconnects, and the action comes back to that one client with its own `origin` and no `rejectionReason` (steps 1, 2). It then says the echo comes back at the `serverSeq` the host is already at and is not buffered, so it is not state moving and not the start of another loop (step 4). The second names the cancel: `chat/turnCancelled` naming a turn that chat is not running stops nothing and is answered as an unchanged set is, while one that does name the running turn is a change and goes out to every client (step 3).

### Verified

- `pnpm -s docs:build`: build complete in 17.51s.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` all clean.
- No package changed, so no vitest run: the one file this task touches is prose.
