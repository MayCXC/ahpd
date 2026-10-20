---
title: An agent in a machine works at the machine path
status: done
depends: [task-04-a-nested-host-and-its-attachments-cross-by-the-pair.md]
layer: agent-claude, agent-acp
refs:
  - "[code://packages/agent-claude/src/claude.ts#L385](../../../../packages/agent-claude/src/claude.ts#L385) - `cwd` to the port"
  - "[code://packages/agent-claude/src/claude.ts#L579](../../../../packages/agent-claude/src/claude.ts#L579) - the SDK's `cwd`"
  - "[code://packages/agent-claude/src/catalog.ts#L128](../../../../packages/agent-claude/src/catalog.ts#L128) - the history folder keyed by the cwd"
  - "[code://packages/agent-acp/src/session/opening.ts#L357](../../../../packages/agent-acp/src/session/opening.ts#L357) - `session/new`'s `cwd`"
  - "[code://packages/agent-acp/src/mapping.ts#L349](../../../../packages/agent-acp/src/mapping.ts#L349) - paths an agent reports, matched with the host's folders"
---

## Objective

An agent running in a machine is given the machine path as its cwd, and the paths it reports are read back as the host's.

## Files

- `UPDATE: packages/agent-claude/src/claude.ts` - the cwd an agent in a machine is given is the machine path.
- `UPDATE: packages/agent-acp/src/session/opening.ts` - `session/new`'s `cwd` for an agent in a machine is the machine path.
- `UPDATE: packages/agent-acp/src/mapping.ts` - a path an agent in a machine reports is read through `hostPathOf` before it is matched.

## Steps

1. Read how each agent learns it runs in a machine (the port's `how`), and give it `machinePathOf` of the working directory there.
2. Read a reported path through `hostPathOf` in the ACP mapping, before `inside` and the capture.
3. Say in `catalog.ts` which history folder a resume of a machine session reads, and test it.
4. Run the agent suites and the typecheck.
5. Set this task and the plan row to `implemented`.

## Validation

- On Windows an agent in a machine works in `/c/...`, and its edits land in the host's changeset under `C:\...`.
- On Linux nothing changes.

## Resume

Done 2026-10-19. Not reviewed.

Claude needed no change: its spawn hands the host folder to the port's `how`, and `within` turns it into the machine path.
The ACP bridge sends the machine path as `cwd` in `session/new`, `session/load`, `session/resume` and `session/fork` for an agent in a machine; the catalogue's record keeps the host path, the folder a client named.
A diff path and an `fs/read_text_file` or `fs/write_text_file` path an agent names is read through `hostPathOf`.
Finding: an ACP server that failed its sign-in still held its folder after the session closed, on Windows; the machine test now runs in a folder no case removes.
On Softov's Windows machine, in the runner-like setup: the computer suite passes 397 with 53 skipped, the full unit suite passes, and `pnpm -s typecheck` and `pnpm -s boundary` pass.
The Linux half of Validation is the CI run of the branch; on Linux and macOS the pair is the path itself.
