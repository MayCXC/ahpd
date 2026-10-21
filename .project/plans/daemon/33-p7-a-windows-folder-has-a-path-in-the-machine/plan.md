---
title: A Windows folder has a path in the machine
domain: daemon
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-20
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
decisions:
  - decisions/on-a-windows-host-a-folder-is-mounted-at-its-drive-style-path.md
  - decisions/a-machine-reads-the-tree-as-the-hosts-git-does.md
  - decisions/an-open-machine-is-given-the-hosts-reading-in-its-environment.md
  - decisions/an-open-worktree-on-windows-is-given-its-machine-path.md
refs:
  - "[code://packages/sdk/src/machines/machine.ts](../../../../packages/sdk/src/machines/machine.ts) - the module the sdk and the computer package share for machine paths: `expandHome`, `partTarget`, `PART_ROOT`"
  - "[code://packages/computer/src/manifest.ts#L1133-L1173](../../../../packages/computer/src/manifest.ts#L1133-L1173) - `mountedAt`, the folder's mount at its own path, and the `workdir` default"
  - "[code://packages/computer/src/runtime.ts#L3404-L3451](../../../../packages/computer/src/runtime.ts#L3404-L3451) - `docker run -v` for the folder and the git binds, and `-w`"
  - "[code://packages/computer/src/runtime.ts#L1353-L1393](../../../../packages/computer/src/runtime.ts#L1353-L1393) - the dev container override: `workspaceFolder` and `workspaceMount`"
  - "[code://packages/computer/src/runtime.ts#L1176-L1189](../../../../packages/computer/src/runtime.ts#L1176-L1189) - `within`, a host cwd matched against a mount's source with `/`"
  - "[code://packages/computer/src/runtime.ts#L2104-L2111](../../../../packages/computer/src/runtime.ts#L2104-L2111) - `seedGit`, `--work-tree` inside the machine"
  - "[code://packages/computer/src/runtime.ts#L3559-L3573](../../../../packages/computer/src/runtime.ts#L3559-L3573) - `putIn` and `takeOut`, an attachment's host path used inside"
  - "[code://packages/computer/src/gitdir.ts#L313-L351](../../../../packages/computer/src/gitdir.ts#L313-L351) - `gitMounts`, host paths used as targets"
  - "[code://packages/computer/src/gitdir.ts#L540-L545](../../../../packages/computer/src/gitdir.ts#L540-L545) - a bind with no target mounts at its own path"
  - "[code://packages/computer/src/devcontainer.ts#L321-L330](../../../../packages/computer/src/devcontainer.ts#L321-L330) - `workdirOf`, a record's mount matched by its source"
  - "[code://packages/computer/src/plugin.ts#L1518](../../../../packages/computer/src/plugin.ts#L1518) - the nested host's working directory, through `within`"
  - "[code://packages/sdk/src/sessions/nested.ts#L424-L425](../../../../packages/sdk/src/sessions/nested.ts#L424-L425) - the host URI sent inside when the port names none"
  - "[code://packages/sdk/src/sessions/nested.ts#L655-L660](../../../../packages/sdk/src/sessions/nested.ts#L655-L660) - `outerDir`, a machine URI back to the host's"
  - "[code://packages/sdk/src/host/machines.ts#L207-L230](../../../../packages/sdk/src/host/machines.ts#L207-L230) - attachments put in and taken out by host path"
  - "[code://packages/agent-claude/src/claude.ts#L579](../../../../packages/agent-claude/src/claude.ts#L579) - the SDK given the host path as its cwd"
  - "[code://packages/agent-acp/src/session/opening.ts#L357](../../../../packages/agent-acp/src/session/opening.ts#L357) - `session/new` sent the host path as its cwd"
---

## Goal

A Windows ahpd makes a machine with a host folder, as a Linux one does.
The folder is mounted at its drive-style path, `/c/Users/ana/proj` for `C:\Users\ana\proj`, a session inside works there, and what comes back from the machine names the host's own paths.
On Linux and macOS nothing changes.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- A read-only survey of `packages/computer/src`, `packages/sdk/src/sessions/nested.ts`, `packages/sdk/src/host` and the agents, on `a0382dc9`, for every place a host path is used as a machine path, compared with one, or read back.
- `rg "same path" packages/computer/src` - the rule, at `manifest.ts:84`, `:517` and `:992`.

### Runtime path

```
createSession (folder, Windows path) -> computer manifestOf (folder, mountedAt, workdir)
  -> runtime: docker run -v / devcontainer override / git binds, -w
  -> nested host started inside (workingDirectory) -> agent cwd
  -> back: workingDirectories, trees, attachments -> the host's client
```

### Gaps

- No function turns a host path into its machine path; the only Windows-aware piece is `absoluteOnHost` in `manifest.ts`.
- `within`, `workdirOf`, `gitInside` and `spellingOf` compare with `/` and the host spelling.
- `outerDir` maps only `workingDirectories`; the other file URIs a nested host sends back are not mapped.
- Docker Desktop reports a Windows folder's bind `Source` as `C:\...` or as `/run/desktop/mnt/host/c/...`, both seen from one config on Docker Desktop 29.9.1; `sourceOnHost` reads both.
- A machine's git reads a Windows folder's files as changed: Docker Desktop shows them as `0777`, and Git for Windows checks them out with CRLF under its system `core.autocrlf=true` - task 07.
- Under `open`, a linked worktree's `.git` names its entry by a drive path the machine's git cannot open - task 08.

### Not in this plan

- Adding the computer suite to the Windows CI job. The parent plan runs only `test:unit` on Windows; the suite's Windows cases are checked on a Windows machine.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [On a Windows host, a host folder is mounted in a machine at its drive-style path](../../../decisions/on-a-windows-host-a-folder-is-mounted-at-its-drive-style-path.md) | Softov, 2026-10-19 |
| 2 | [A machine's own git directory reads the tree as the host's git does](../../../decisions/a-machine-reads-the-tree-as-the-hosts-git-does.md) | Softov, 2026-10-20 |
| 3 | [A machine under open is given the host's reading of the tree in its environment](../../../decisions/an-open-machine-is-given-the-hosts-reading-in-its-environment.md) | Softov, 2026-10-20 |
| 4 | [Under open on Windows, a linked worktree's entry is named to the machine by its machine path](../../../decisions/an-open-worktree-on-windows-is-given-its-machine-path.md) | Softov, 2026-10-20 |

| What | Source | Task |
| --- | --- | --- |
| The pair lives in `packages/sdk/src/machines/machine.ts`, beside `partTarget`, and is exported | (defaulted: the module both packages already share for machine paths) | 01 |
| A path inside the machine stays POSIX, and is never passed through the pair | [code://packages/computer/src/manifest.ts#L1171](../../../../packages/computer/src/manifest.ts#L1171) | 02 |
| Tasks 07 and 08 belong to this plan; an ACP agent's terminal in a machine is acp/19 | Softov, 2026-10-20, "p7 tasks 07 and 08 (Recommended)" and "New plan (Recommended)" | 07, 08 |

## Proposed architecture

- **Data flow** - a host path crosses into the machine through `machinePathOf`, and a machine path comes back through `hostPathOf`; nothing else turns one into the other.
- **Layer responsibilities** - sdk: the pair, the nested host's working directory and its URIs back, attachments · computer: mounts, `-w`, the dev container override, git mounts, `within` and the trees read back · agents: the cwd an agent inside a machine is given.
- **Source-of-truth files** - [`code://packages/sdk/src/machines/machine.ts`](../../../../packages/sdk/src/machines/machine.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A host path has a machine path](task-01-a-host-path-has-a-machine-path.md) | done | - |
| [02 - A machine mounts a folder at its machine path](task-02-a-machine-mounts-a-folder-at-its-machine-path.md) | done | 01 |
| [03 - What a machine answers names the host's paths](task-03-what-a-machine-answers-names-the-hosts-paths.md) | done | 01 |
| [04 - A nested host and its attachments cross by the pair](task-04-a-nested-host-and-its-attachments-cross-by-the-pair.md) | done | 01 |
| [05 - An agent in a machine works at the machine path](task-05-an-agent-in-a-machine-works-at-the-machine-path.md) | done | 04 |
| [06 - The computer suite runs on a Windows machine](task-06-the-computer-suite-runs-on-a-windows-machine.md) | done | 02, 03, 04, 05 |
| [07 - A machine reads the tree as the host's git does](task-07-a-machine-reads-the-tree-as-the-hosts-git-does.md) | done | 06 |
| [08 - An open machine on a linked worktree reaches its entry on Windows](task-08-an-open-worktree-has-its-machine-path.md) | done | 06 |

## Risks and tradeoffs

- A crossing that is missed is a Windows path inside the machine, or a `/c/...` path on the host - task 06 runs the suite on Windows, and each task's tests assert both sides.
- Claude's history is keyed by its cwd (`~/.claude/projects/<slug>`), so a session's history inside a machine is under the machine path, not the host's - task 05 says which one a resume reads.

## Resume state

- **Done so far:** planned 2026-10-19 from the survey on `a0382dc9`. Tasks 01 to 06 implemented 2026-10-19 on Softov's Windows machine. On 2026-10-20, on a Windows VM with Docker Desktop 29.9.1: the real-Docker cases and the hand check of task 06 step 4 ran, and found what tasks 07 and 08 fix; tasks 07 and 08 implemented, and the real-Docker git cases pass there. PR #43 passed every CI job and Softov merged it on 2026-10-20 and chose to close the plan. The plan is built: see [implemented.md](implemented.md).
- **Next action:** none. The hand check's terminal turn is run again when [acp/19](../../acp/19-a-terminal-in-a-machine-runs-in-the-machine/plan.md) is built.
- **Open questions:** none.
- **Watch out for:** on Linux and macOS the pair is the identity, so a Linux run proves nothing about the translation; only a Windows run does.

## Final verification checklist

- [x] The computer suite passes on a Windows machine, apart from what is POSIX by nature.
- [x] A machine made from a Windows host with a folder works there, by hand, with Docker Desktop.
- [x] The Linux jobs pass.
- [x] `plans/index.md` updated.
