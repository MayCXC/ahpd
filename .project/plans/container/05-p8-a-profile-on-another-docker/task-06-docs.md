---
title: The docs say how a profile uses another server's Docker
status: done
depends: [task-05-dev02s-docker-runs-a-session.md, task-07-a-profile-may-clone-from-origin.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the operator's page"
---

## Objective

`docs/plugins/COMPUTERS.md` says what `server` does for a Docker profile, how it differs from the plugin's `env.DOCKER_HOST`, what a remote machine cannot mount, and how the code gets there and back.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - a section on a profile with `server`.

## Steps

1. Show one example profile with `server` and the `ssh.machines` entry it names.
2. Say what `code: "bundle"` and `code: "clone"` each do, that `bundle` is the default and puts no credential in the box, and that `clone` needs the branch on a public `origin`, fetched by https.

## Validation

- The option names match `profilesOf`.

## Resume

- **Done:** 2026-10-30, in the profiles section of [`COMPUTERS.md`](../../../../docs/plugins/COMPUTERS.md). It has an example profile with `server` and its `ssh.machines` entry, and a table of the two `code` values. It says how `server` differs from `env.DOCKER_HOST`, and what a machine on another box cannot mount.
- **Also:** how a record agent reaches such a machine, and cofold's `COFOLD_*` variables, with the slash rule for an OpenRouter model.
