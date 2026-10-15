---
title: An archived session gives back its worktree - deferred
date: 2026-10-15
---

These cases were seen in the build and are outside the plan.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A deleted session that sleeps keeps its tree | The plan does not change that path | unplanned |
| After a restart, a tree with linked folders stays on archive and on delete | The store does not keep the linked folders | unplanned |
| After a restart, `restore` does not link the folders again | The same | unplanned |
| A delete removes a clean tree with no recorded branch without a `HEAD` check | There is no branch to compare, as on main | unplanned |
| The help text list does not name `closedChats` | It did not before this plan | unplanned |
| Under `commit`, a host with no git identity keeps the dirty tree | The commit uses the git identity of the host | unplanned |
