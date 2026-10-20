---
title: Check that VS Code and ahpapp draw a session's own counts
plans:
  - plans/host/103-a-rows-diff-stat-is-the-sessions-work/plan.md
---

# Check that VS Code and ahpapp draw a session's own counts

host/103 is implemented, and its tests pass. This check uses VS Code's sessions view and ahpapp, connected to a daemon on this build. The problem [a-sessions-changes-are-kept-under-two-keys.md](../problems/a-sessions-changes-are-kept-under-two-keys.md) is open, so test in a git repository.

## Two sessions in one folder

1. Start two sessions in one git repository.
2. In the first session, ask the agent to change one file.
3. In the second session, ask the agent to change another file.
4. Check that each row in VS Code's sessions view shows the `+` and `-` counts of its own file only.
5. Check that ahpapp shows the same counts for each row.
6. Commit the two changes in a terminal.
7. Check that both rows keep their counts in VS Code and in ahpapp.

## A worktree session

1. Start a session with worktree isolation.
2. Ask the agent to change one file, and commit the change in the worktree.
3. Check that the row shows the counts of the branch against its base, in VS Code and in ahpapp.

## After a restart

1. Note the counts of each row.
2. Restart the daemon.
3. Check that each row shows the same counts in VS Code and in ahpapp, before you open the session.

## Reply

Write "pass", or what you saw. A pass ticks the matching line in the plan.
