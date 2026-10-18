---
title: The docs say how a box is listed as an ssh machine
status: done
depends: [task-06-dev02-runs-a-session.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the operator's page"
---

## Objective

`docs/plugins/COMPUTERS.md` says how to list a box, what it needs installed, how an id names its runtime, that every session there runs nested, and what an ssh machine cannot do.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - an "ssh machines" section.
- `UPDATE: .project/plans/container/00-container.md` - several runtimes, and ssh among them.

## Steps

1. The option, one example, the id, a policy glob for one runtime.
2. What the box needs: ahpd at the same version, its plugins, its own model credentials until p12.

## Validation

- Every option named exists in `optionsSchema`.

## Resume
Done 2026-10-18.
`docs/plugins/COMPUTERS.md` has an "ssh machines" section with the option, one example, every field, the id and a policy glob. It also says what the box needs, what runs there and what an ssh machine cannot do.
Every option named is one of `optionsSchema`'s `ssh` fields in [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts).
What the box needs comes from task 06's run, not from step 2's guess. The box keeps its backends' options in its own file, and `ahpd` must be on a non-interactive `PATH`. Its model credentials stay on the box with or without p12.
`00-container.md` names `ssh.ts` and `router.ts`, and says `docker` and `ssh` are built.
