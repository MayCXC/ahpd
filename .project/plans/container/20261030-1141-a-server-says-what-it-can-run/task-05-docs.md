---
title: The docs say how to check a server
status: todo
depends: [task-03-a-profile-names-its-server.md, task-04-dev02-is-checked-by-hand.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the operator's page"
---

## Objective

`docs/plugins/COMPUTERS.md` says how to read a box's `server` leaf, what each item means, and how a profile names its server.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - a section on the server check.

## Steps

1. Show an `ssh.machines` entry and a read of its `server` leaf.
2. List each item and what makes it ok.
3. Show a profile with `server`, and the refusal when a need is missing.

## Validation

- Each item named in the docs exists in `ServerReport`.
- The option names match `profilesOf`.

## Resume
