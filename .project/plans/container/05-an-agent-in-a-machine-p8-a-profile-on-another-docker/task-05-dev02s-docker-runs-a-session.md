---
title: dev02's Docker runs a session from a profile
status: todo
depends: [task-03-the-code-arrives-by-clone.md, task-04-sessions-there-run-nested.md, task-07-a-profile-may-clone-from-origin.md]
layer: "computer (by hand)"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the image with ahpd installed"
---

## Objective

A disposable profile with `dockerHost: "ssh://softov@dev02.example.com"` runs a cofold session on dev02, and its commit comes back as a branch.

## Files

- None in the repository; the configuration used is written into this task's Resume.

## Steps

1. Build an image with ahpd and the agent plugins on dev02's Docker.
2. A profile with that image and `dockerHost`, and `needs.cofoldConfig` naming a cofold config written for dev02 that reaches models through p12's proxy and holds no key (task 02 refuses the host's own); start a disposable session, commit, leave; check the branch on this host. Once with the default `code: "bundle"`, once with `code: "clone"` and a `gitCredential` from the vault.
3. Restart this host mid-session and continue.
4. Run it again with the vault's key and the `gitCredential` secret absent: the `bundle` session still runs, a `clone` profile's create is refused with a sentence naming the secret, and no other profile or session is affected.

## Validation

- By hand, as above.

## Resume
