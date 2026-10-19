---
title: A Windows folder has a path in the machine
domain: daemon
status: planned
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires:
  - plans/daemon/33-ahpds-checks-pass-on-windows/plan.md
changes: []
creates: []
decisions:
  - decisions/on-a-windows-host-a-folder-is-mounted-at-its-drive-style-path.md
refs:
  - "[code://packages/sdk/src/machine.ts](../../../../packages/sdk/src/machine.ts) - the module the sdk and the computer package share for machine paths: `expandHome`, `partTarget`, `PART_ROOT`"
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
  - "[code://packages/sdk/src/nested.ts#L424-L425](../../../../packages/sdk/src/nested.ts#L424-L425) - the host URI sent inside when the port names none"
  - "[code://packages/sdk/src/nested.ts#L655-L660](../../../../packages/sdk/src/nested.ts#L655-L660) - `outerDir`, a machine URI back to the host's"
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

- A read-only survey of `packages/computer/src`, `packages/sdk/src/nested.ts`, `packages/sdk/src/host` and the agents, on `a0382dc9`, for every place a host path is used as a machine path, compared with one, or read back.
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
- Not found: how Docker Desktop reports a bind's `Source` for a Windows folder in `docker inspect` (`C:\...`, or a `/run/desktop/mnt/host/c/...` path) - searched the runtime and its tests; it needs a run on a Windows machine with Docker Desktop.

### Not in this plan

- Adding the computer suite to the Windows CI job. The parent plan runs only `test:unit` on Windows; the suite's Windows cases are checked on a Windows machine.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [On a Windows host, a host folder is mounted in a machine at its drive-style path](../../../decisions/on-a-windows-host-a-folder-is-mounted-at-its-drive-style-path.md) | Softov, 2026-10-19 |

| What | Source | Task |
| --- | --- | --- |
| The pair lives in `packages/sdk/src/machine.ts`, beside `partTarget`, and is exported | (defaulted: the module both packages already share for machine paths) | 01 |
| A path inside the machine stays POSIX, and is never passed through the pair | [code://packages/computer/src/manifest.ts#L1171](../../../../packages/computer/src/manifest.ts#L1171) | 02 |

## Proposed architecture

- **Data flow** - a host path crosses into the machine through `machinePathOf`, and a machine path comes back through `hostPathOf`; nothing else turns one into the other.
- **Layer responsibilities** - sdk: the pair, the nested host's working directory and its URIs back, attachments · computer: mounts, `-w`, the dev container override, git mounts, `within` and the trees read back · agents: the cwd an agent inside a machine is given.
- **Source-of-truth files** - [`code://packages/sdk/src/machine.ts`](../../../../packages/sdk/src/machine.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A host path has a machine path](task-01-a-host-path-has-a-machine-path.md) | todo | - |
| [02 - A machine mounts a folder at its machine path](task-02-a-machine-mounts-a-folder-at-its-machine-path.md) | todo | 01 |
| [03 - What a machine answers names the host's paths](task-03-what-a-machine-answers-names-the-hosts-paths.md) | todo | 01 |
| [04 - A nested host and its attachments cross by the pair](task-04-a-nested-host-and-its-attachments-cross-by-the-pair.md) | todo | 01 |
| [05 - An agent in a machine works at the machine path](task-05-an-agent-in-a-machine-works-at-the-machine-path.md) | todo | 04 |
| [06 - The computer suite runs on a Windows machine](task-06-the-computer-suite-runs-on-a-windows-machine.md) | todo | 02, 03, 04, 05 |

## Risks and tradeoffs

- A crossing that is missed is a Windows path inside the machine, or a `/c/...` path on the host - task 06 runs the suite on Windows, and each task's tests assert both sides.
- Claude's history is keyed by its cwd (`~/.claude/projects/<slug>`), so a session's history inside a machine is under the machine path, not the host's - task 05 says which one a resume reads.

## Resume state

- **Done so far:** planned 2026-10-19 from the survey on `a0382dc9`.
- **Next action:** [task-01-a-host-path-has-a-machine-path.md](task-01-a-host-path-has-a-machine-path.md).
- **Open questions:**
  1. How Docker Desktop reports a Windows bind's `Source` - proposed: read it on a Windows machine with Docker Desktop in task 03, and match both spellings if it differs.
- **Watch out for:** on Linux and macOS the pair is the identity, so a Linux run proves nothing about the translation; only a Windows run does.

## Final verification checklist

- [ ] The computer suite passes on a Windows machine, apart from what is POSIX by nature.
- [ ] A machine made from a Windows host with a folder works there, by hand, with Docker Desktop.
- [ ] The Linux jobs pass.
- [ ] `plans/index.md` updated.
