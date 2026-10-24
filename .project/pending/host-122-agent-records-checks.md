---
title: Agents are records after the first start
plans:
  - plans/host/122-agents-are-records-on-their-own-channel/plan.md
---

# Agents are records after the first start

Host 122 is merged in #89, and the plan closes after these checks.
Do them after the restart of your daemon, from a terminal that is not a Claude Code session.

## Steps

1. Restart your daemon on main.
2. Find the line "Moved N presets to agent records" in its log.
3. Check that `~/.config/ahpd/agents/` holds one file for each preset.
4. Check that a `config.json.bak-<stamp>` file is next to the configuration file.
5. List the agents in a client, and find `claude-deepseek-build` and the others.
6. Start a build session on `claude-deepseek-build`, and send one turn.
7. Add a second agent-cofold record, and send it one turn.
8. Change the key of a record while its session runs, and send one more turn.

## Reply

Write "done" when each step works, or say which step stopped.
