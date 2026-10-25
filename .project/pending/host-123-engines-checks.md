---
title: Engines replace agent kinds
plans:
  - plans/host/123-agent-kinds-on-their-own-channel/plan.md
---

# Engines replace agent kinds

Host 123 tasks 02 and 03 are on main and not committed.
Task 03 renames the agent record field `kind` to `engine`, and the daemon reads a record with `kind` as `unavailable`.
Your three records in `~/.config/ahpd/agents/` still say `kind`.
ahpw plugins 08 task 05 is on ahpw main and not committed, and it reads `x-ahpd-engines`. Run ahpw from that tree for steps 6 to 8.
Do these checks from a terminal that is not a Claude Code session.

## Steps

1. Stop the daemon.
2. In each file in `~/.config/ahpd/agents/`, rename the key `kind` to `engine`.
3. Start the daemon on main.
4. Check that its log has no line "names no engine".
5. List the agents in a client, and check that no agent is `unavailable`.
6. Open the agents page in ahpw, and check that each engine shows its icon.
7. Check that page in light and dark.
8. Add an agent from an engine, and send it one turn.

## Reply

Write "done" when each step works, or say which step stopped.
