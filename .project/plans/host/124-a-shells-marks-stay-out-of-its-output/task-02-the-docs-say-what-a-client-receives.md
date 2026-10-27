---
title: The docs say what a client receives
status: done
depends:
  - task-01-the-store-takes-the-marks-out-in-order.md
layer: "docs"
refs:
  - "[code://docs/sdk/TERMINALS.md#L73-L79](../../../../docs/sdk/TERMINALS.md#L73-L79) - \"Command boundaries\""
  - "[code://docs/sdk/AHP.md#L308-L313](../../../../docs/sdk/AHP.md#L308-L313) - the rows for the terminal actions"
---

## Objective

`TERMINALS.md`, `AHP.md` and the changelog say that the marks stay out of the output, and that detection comes with the first mark.

## Files

- `UPDATE: docs/sdk/TERMINALS.md:73-79` - "Command boundaries" says the host removes the marks and announces detection with the first one.
- `UPDATE: docs/sdk/AHP.md:308-313` - the rows for `terminal/cwdChanged` and the three command actions.
- `UPDATE: CHANGELOG.md` - an entry under `0.14.1 - unreleased`.

## Steps

1. Write "Command boundaries" again from the new behaviour.
2. Correct the four rows in `AHP.md`.
3. Add the changelog entry.
4. Run `lint-prose.mjs` on the plan folder.

## Validation

- The two docs agree with `packages/sdk/src/machines/terminals.ts`.
- `node .agents/skills/do-spec/scripts/lint-prose.mjs .project/plans/host/124-a-shells-marks-stay-out-of-its-output` prints nothing.

## Resume

Done 2026-10-27.
"Command boundaries" in `docs/sdk/TERMINALS.md` says that the marks come out, where each action goes, and when detection starts.
The rows in `docs/sdk/AHP.md` for `terminal/data` and the three command actions say the same.
The changelog has the change under `0.14.1 - unreleased`, in "Upgrading" and in "Terminals".
Task 03 corrects "What a client sees" and the scrollback paragraph.
