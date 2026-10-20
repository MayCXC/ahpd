---
title: Make check-windows a required check
plans:
  - plans/daemon/33-p4-the-windows-job-is-required/plan.md
---

# Make check-windows a required check

The `check-windows` job no longer has `continue-on-error`, so a failure in it fails the CI run.
A merge waits for it only when the branch rule names it, and only the owner of the repository can change that rule on GitHub.

## Add the job to the branch rule

1. On GitHub, open the repository settings.
2. Open the rule or ruleset for `main`.
3. Find the list of status checks that must pass.
4. Add `check-windows`.
5. Save the rule.

## Make sure that it works

1. Open a pull request.
2. Make sure that the pull request shows `check-windows` as required.

## Reply

Write "pass", or what you saw. A pass ticks the first line of the p4 plan's final checklist.
