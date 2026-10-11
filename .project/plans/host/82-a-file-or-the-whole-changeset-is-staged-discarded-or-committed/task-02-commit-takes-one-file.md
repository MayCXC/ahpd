---
title: Commit takes one file
status: todo
depends: [03]
layer: sdk
refs:
  - "[code://packages/sdk/src/changes.ts#L227-L256](../../../../packages/sdk/src/changes.ts#L227-L256) - `COMMIT` and `commitConfirmation`"
  - "[code://packages/sdk/src/changes.ts#L1328-L1364](../../../../packages/sdk/src/changes.ts#L1328-L1364) - commit in `invoke`"
---

## Objective

Commit takes one file or the whole changeset.
On one file it commits that path only, and other staged files stay staged.

## Files

- `UPDATE: packages/sdk/src/changes.ts:227-256` - `scopes: ['changeset', 'resource']`; the confirmation names the message, then what the whole changeset takes.
- `UPDATE: packages/sdk/src/changes.ts:1328-1364` - with a resource target, commit that path only.
- `UPDATE: packages/sdk/test/commit.test.ts` - one file, with another file staged and a third unstaged.
- `UPDATE: docs/AHP.md:697-710` - commit takes a file or the whole changeset.

## Steps

1. Add `'resource'` to the scopes of `COMMIT`.
2. Start the confirmation with "Commit as 'X'?".
3. End it with "The whole changeset takes 3 staged files." or "The whole changeset takes 4 files, 1 untracked."
4. With a resource target, refuse a folder and a path outside the directory, as discard does.
5. Run `git add -- <path>` so that git knows an untracked file.
6. Run `git commit --only -m <message> -- <path>`.
7. On a renamed row, pass the old path and the new path to both commands.
8. Answer as the whole-changeset commit does: the short sha and the subject.

## Validation

- One file commits that file's working-tree content, staged or not.
- Another staged file is still staged after the commit.
- An untracked file commits as a new file.
- A deleted file commits as a deletion.
- A renamed file commits as one rename.
- The whole-changeset commit works as before.
- The gates pass.
