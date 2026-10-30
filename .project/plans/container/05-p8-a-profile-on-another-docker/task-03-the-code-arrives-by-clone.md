---
title: The session's code arrives by bundle and returns as a branch
status: todo
depends: [task-02-no-bind-mount-on-another-docker.md]
layer: "computer | sdk"
refs:
  - "[code://packages/sdk/src/types/computers.ts#L103-L104](../../../../packages/sdk/src/types/computers.ts#L103-L104) - `MachineSource.folder`, the session's folder on this host"
  - "[code://packages/sdk/src/repo/worktrees.ts](../../../../packages/sdk/src/repo/worktrees.ts) - the worktrees port, where the session's branch is"
  - "[code://packages/computer/src/runtime.ts#L2105-L2150](../../../../packages/computer/src/runtime.ts#L2105-L2150) - `seedGit`, which reads the host's objects through a read-only bind"
  - "[code://packages/computer/src/runtime.ts#L2455-L2580](../../../../packages/computer/src/runtime.ts#L2455-L2580) - host/67's bring-back: a bundle on `docker exec`'s stdout, fetched into `refs/ahpd/machines/<machine>/<branch>`"
  - "[code://packages/computer/src/runtime.ts#L625](../../../../packages/computer/src/runtime.ts#L625) - `putIn`, a copy of host paths into a running machine"
---

## Objective

A machine on another Docker made for a session holds a clone of the session's branch at its working directory.
What the session committed there reaches this host's repository through host/67's bring-back, unchanged.
This task builds the default way in, `code: "bundle"`: no credential reaches the box.
Task 07 adds `code: "clone"` behind the same interface.

## Files

- `CREATE: packages/computer/src/clone.ts` - `codeRouteOf(profile)`, which answers `bundle` for now, and `bringIn(route, machine, session)`, so a route is one branch in `bringIn`.
- `UPDATE: packages/computer/src/runtime.ts:2105-2150` - a remote runner seeds the machine's repository with `bringIn`, in place of `seedGit`'s bind.
- `UPDATE: packages/computer/src/runtime.ts:2455-2580` - the bring-back reads a remote machine's layout without its mounts.
- `UPDATE: packages/computer/src/plugin.ts:1547-1750` - `create` brings the code in after the machine starts, for a remote runner.
- `UPDATE: packages/computer/test/computer-disposable.test.ts` - the cases below.

## Steps

1. Make a `git bundle` of the session's branch on this host.
2. Put the bundle in the machine with `putIn`.
3. Clone the bundle to the machine's `workdir` on that branch, in the layout host/67's bring-back reads.
4. Set the clone's `origin` to the repository's own origin URL, so the clone looks like a normal checkout.
5. Send no credential: the bundle holds the objects the clone needs.
6. Run host/67's bring-back when the session leaves the machine, and before the removal of a disposable machine.
7. Keep host/67's rules: move a branch the folder is not on as a ref, and leave other work under its hidden ref.
8. Refuse a folder that is not a repository with a sentence.
9. Keep the copy in behind the runtime, so a VM (task 10) can use `scp`.

## Validation

- With the fake Docker, a create puts a bundle in, runs `git clone` inside, and sets `origin` to the repository's URL.
- With the fake Docker, the leave of a remote machine runs host/67's bring-back over `docker exec` with the remote `DOCKER_HOST`.
- With a fake whose bring-back fails, a disposable remote machine is not removed, and the log names it.
- A real temporary repository: a bundle-seeded machine's commit comes back and fast-forwards the session's branch.
- By hand on dev02 in task 05.

## Resume

