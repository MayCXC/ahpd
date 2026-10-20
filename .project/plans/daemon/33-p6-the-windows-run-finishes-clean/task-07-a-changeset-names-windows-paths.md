---
title: A changeset names Windows paths
status: done
depends: [task-03-the-windows-job-runs-to-the-end.md]
layer: sdk, agent-acp
refs:
  - "[code://packages/sdk/src/changes.ts](../../../../packages/sdk/src/changes.ts) - `slashed`, `unslashed` and `folded`, used by `beforeUri`, `capturedUri`, `pendingUri`, `sideKey`, `sideOf` and `read`"
  - "[code://packages/sdk/src/host/facts.ts](../../../../packages/sdk/src/host/facts.ts) - `dirOfFile`, which a write through the host refreshes the changeset by"
  - "[code://packages/agent-acp/src/session.ts](../../../../packages/agent-acp/src/session.ts) - `inside`, whether a path is in the session's folders"
  - "[code://packages/agent-acp/src/session/handlers.ts](../../../../packages/agent-acp/src/session/handlers.ts) - `writeTextFile`"
  - "[code://packages/agent-acp/src/mapping.ts](../../../../packages/agent-acp/src/mapping.ts) - `fileEdit`"
---

## Objective

On a Windows host, a changeset's before side, a turn's captured sides and a write through the host all name the file, and an ACP agent's files in its own folder are inside it.

## Files

- `UPDATE: packages/sdk/src/changes.ts` - a path goes into an `ahp-git:` or `ahp-edit:` URI as `/C:/a/b`, comes back as `C:\a\b`, and is compared without case on Windows.
- `UPDATE: packages/sdk/src/host/facts.ts` - `dirOfFile` compares with the system's separator.
- `UPDATE: packages/agent-acp/src/session.ts` - `inside` compares with the system's separator.
- `UPDATE: packages/agent-acp/src/session/handlers.ts` and `packages/agent-acp/src/mapping.ts` - an agent's path is normalized before it is captured.
- `UPDATE: packages/sdk/test/changes-uris.test.ts`, `packages/sdk/test/commit.test.ts`, `packages/agent-acp/test/agent-acp-catalog.test.ts`, `packages/agent-acp/test/agent-acp-turn.test.ts` - the URIs a client sends come from `uriOf`, or from the path form a URI holds.

## Steps

1. Reproduce: on Windows, `changes-uris.test.ts` and `commit.test.ts` find no before side, and `changes-refresh.test.ts` sees no change after a write through the host.
2. Find the causes: `escaped` splits a path only on `/`, so a Windows path is one encoded segment that runs into the authority; `sideOf` and `read` compare with POSIX paths; `dirOfFile` and `inside` test a prefix with `/`.
3. Write a path into the two schemes as a `file:` URI holds it, read it back to the native form, and compare without case on Windows, where VS Code prints a drive letter lowercase.
4. Compare with `sep` in `dirOfFile` and `inside`.
5. Normalize an ACP agent's path in `writeTextFile` and `fileEdit`, so one file is one row.
6. Give the test's copy of VS Code's printing the drive letter rule, with an expectation for it.
7. Run the tests and the typecheck.
8. Set this task and the plan row to `implemented`.

## Validation

- `changes-uris.test.ts`, `commit.test.ts`, `changes-refresh.test.ts` and the agent-acp suite pass on Windows.
- The Linux jobs pass.

## Resume

Done 2026-10-19. Not reviewed.

On Softov's Windows machine, with a system git config that sets `core.autocrlf=true` as a runner's does: the changes, commit and agent-acp tests pass.
`pnpm -s typecheck` and `pnpm -s boundary` pass.
On Windows a client such as VS Code connected to ahpd read every before side as nothing, and a write through the host did not move the changeset; both were the product, not the tests.
The Linux half of Validation is the CI run of the branch.
