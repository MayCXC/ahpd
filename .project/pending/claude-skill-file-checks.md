---
title: Check that each Claude customization opens its file in VS Code
plans:
  - plans/claude/20261031-0228-a-skill-names-its-own-file/plan.md
---

# Check that each Claude customization opens its file in VS Code

The plan `claude/20261031-0228-a-skill-names-its-own-file` is implemented, and its tests pass. These checks need VS Code's Agent Customizations view. Use VS Code 1.143 or later. Do these checks from a terminal that is not a Claude Code session.

## Set up

1. Use the ahpd tree of the merged plan, and run `pnpm install` and `pnpm build`.
2. Use a config folder of its own: `export XDG_CONFIG_HOME=/tmp/ahpd-skill-chk` and `export XDG_STATE_HOME=/tmp/ahpd-skill-chk/state`.
3. Run `ahpd paths add <a folder with a CLAUDE.md>`, and add `<tree>/packages/agent-claude/dist/index.js` to `"plugins"` in `/tmp/ahpd-skill-chk/ahpd/config.json`.
4. Start that ahpd on a free port, and add it to `"chat.remoteAgentHosts"` in VS Code.
5. Open a Claude session on that folder.

## Steps

1. In Agent Customizations, open `advisor`, and check that VS Code opens `~/.claude/skills/advisor/SKILL.md`.
2. Open a synced skill, and check that VS Code opens its `SKILL.md` under `~/.claude/skills/synced/`.
3. Check that the synced folder offers no way to add a skill.
4. Check that `code-review` shows under Built-in, and opens no file.
5. In the Instructions group, check that the folder's `CLAUDE.md` shows, and that VS Code opens it.

## Reply

Write "done" when each step works, or say which step stopped.
