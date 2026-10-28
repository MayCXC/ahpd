---
title: Plan ids that do not clash across forks
created: 2026-10-27
---

A plan's number is the next free number in its domain, read from `index.md` by hand. The MayCXC fork takes numbers from the same list at the same time, so two plans get one number.

On 2026-10-27 this happened twice in `host`. Our host/126 became host/129 and went back to 126. The fork's host/126 became host/129. Each move closed a PR, rebuilt a merge branch and edited every reference to the old number.

Ways to make an id that does not clash:

- **A date id.** The plan folder starts with its creation date, for example `host/20261027-a-new-session-is-an-ahp-session-uri`. Two plans clash only on the same day with the same slug. The date takes 8 of the 48 characters that a folder name can have.
- **A claimed number.** A plan takes its number with a commit on `main` before its first task starts. A fork uses only numbers that `main` gave it. A number on a branch that is not on `main` is not taken.
- **A range for each fork.** Each fork takes its numbers from its own range, for example 500 and up in each domain.
- **A number at merge.** A branch names its plan with its slug only, and the merge gives it the next free number.

The numbering rule is in the do-spec skill, so a change goes there and to every project that uses it. Existing plans keep their numbers.
