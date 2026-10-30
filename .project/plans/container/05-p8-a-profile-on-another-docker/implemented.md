---
title: A profile's machines may live on another server's Docker - implemented
date: 2026-10-30
refs:
  - git://7fa9e0fa
  - "[code://packages/computer/src/plugin.ts](../../../../packages/computer/src/plugin.ts) - a profile's `server`, its runner, and the far disposable machines"
  - "[code://packages/computer/src/runtime.ts](../../../../packages/computer/src/runtime.ts) - the remote `dockerRuntime`, its mount refusal and bring-back"
  - "[code://packages/computer/src/clone.ts](../../../../packages/computer/src/clone.ts) - `codeRouteOf`, the bundle and clone routes"
  - "[code://packages/agent-cofold/src/config.ts](../../../../packages/agent-cofold/src/config.ts) - cofold's provider from the `COFOLD_*` variables"
---

A computer profile can name a box from `ssh.machines` as its `server`, and its machines are then made on that box's Docker, reached over ssh. The session's code goes in by a git bundle, or by a fetch of a public `origin`, and the commits come back to the session's branch on this host. Sessions there run nested, with the vault's values passed by name, and a credential of this host's own never goes to the box.

## What was built

- [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts) - a runner per profile with a `server`, registered as `docker-<profile>`, with bounded reads; profiles that cannot be served are left out with a line.
- [`code://packages/computer/src/runtime.ts`](../../../../packages/computer/src/runtime.ts) - a remote Docker refuses a path of this host as a mount, seeds the machine's repository and brings its commits back as a bundle.
- [`code://packages/computer/src/clone.ts`](../../../../packages/computer/src/clone.ts) - `code: "bundle"` and `code: "clone"`; `clone` fetches the branch from the https form of `origin`, with no credential.
- [`code://packages/computer/src/parts.ts`](../../../../packages/computer/src/parts.ts) - a far profile's parts are built on its box's Docker; the node part has no wrapping directory.
- [`code://packages/agent-cofold/src/config.ts`](../../../../packages/agent-cofold/src/config.ts) - cofold in a machine takes its provider from `COFOLD_BASE_URL`, `COFOLD_API_KEY` and `COFOLD_MODEL`.
- [`code://docs/plugins/COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md) - the profile with `server`, what it cannot mount, and the two `code` values.

## Verified

- [`computer-far-docker.test.ts`](../../../../packages/computer/test/computer-far-docker.test.ts), [`computer-far-git.test.ts`](../../../../packages/computer/test/computer-far-git.test.ts), and the far tests in [`computer-disposable.test.ts`](../../../../packages/computer/test/computer-disposable.test.ts) and [`computer-runtimes.test.ts`](../../../../packages/computer/test/computer-runtimes.test.ts). CI on `7fa9e0fa` is green, Windows included.
- By hand on dev02 (task 05): a bundle session and a clone session each made a commit in the machine. Each commit came back to this host. A host restart mid-session resumed in the same machine. A missing vault value refused the session with a sentence that names it, and made no machine.

## Departures from the plan

- Each task's Resume lists its own departures.
- Task 05 needed three changes the plan did not name. The parts are built on the box's Docker, and cofold reads the `COFOLD_*` variables. A far machine gets the whole record of a record agent, by name.
- Task 07 fetches a public `origin` with no credential, and private repositories wait. Softov chose this on 2026-10-30.

## Left for later

- See [deferred.md](deferred.md).
- A disposal of a session this process does not hold leaves its disposable machine. This is on `main` too, and a plan of its own fixes it.
