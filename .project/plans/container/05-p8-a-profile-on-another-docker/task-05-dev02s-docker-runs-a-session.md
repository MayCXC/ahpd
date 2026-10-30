---
title: dev02's Docker runs a session from a profile
status: todo
depends: [task-03-the-code-arrives-by-clone.md, task-04-sessions-there-run-nested.md, task-07-a-profile-may-clone-from-origin.md]
layer: "computer (by hand)"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - the image with ahpd installed"
---

## Objective

A disposable profile with `server: "dev02"` runs a cofold session on dev02, and its commit comes back as a branch.

## Files

- None in the repository; the configuration used is written into this task's Resume.

## Steps

1. Build an image with ahpd and the agent plugins on dev02's Docker.
2. Write a profile with that image and `server`, and name `cofoldApiKey` from the vault.
3. Start a disposable session, commit, leave, and check the branch on this host.
4. Do step 3 once with `code: "bundle"` and once with `code: "clone"` on a public repository.
5. Restart this host mid-session and continue.
6. Remove the key from the vault and start a session again.
7. Check that the refusal names the key and that no other profile or session is affected.

## Validation

- By hand, as above.

## Resume
