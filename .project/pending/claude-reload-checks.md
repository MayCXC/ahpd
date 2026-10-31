---
title: Check that a written Claude customization shows without a restart
plans:
  - plans/claude/20261031-0258-a-written-agent-shows-at-once/plan.md
---

# Check that a written Claude customization shows without a restart

The plan `claude/20261031-0258-a-written-agent-shows-at-once` is implemented, and its tests pass. These checks need VS Code's Agent Customizations view and a test ahpd. Do these checks from a terminal that is not a Claude Code session.

## Set up

1. Do the set up of [claude-skill-file-checks.md](claude-skill-file-checks.md), with the tree of the merged plan.
2. Set `CLAUDE_CONFIG_DIR` to a scratch folder before you start that ahpd, so the checks do not write into your own `~/.claude`.
3. Open a Claude session on a folder with a `CLAUDE.md`.

## Steps

1. In Agent Customizations, add an agent to the user `agents` directory. Expect it in the list and in the `/agent` picker, with no restart.
2. Write `<config dir>/agents/scout.md` by hand, with `name: scout` in its frontmatter. Expect `scout` in the open session within a second.
3. Open a new session. Expect `scout` there, and in the agent list before the session starts.
4. Write `<working directory>/.claude/skills/build/SKILL.md`. Expect `build` in the project `skills` directory of that session.
5. Change the `name` of `scout`, and then delete its file. Expect each change in the list.
6. In a turn, ask the agent to run `scout` through its Task tool. Expect the turn to run it.
