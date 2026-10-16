---
title: Check the agent SDK upgrades on the daemon
plans:
  - plans/pi/16-agent-pi-is-on-pi-1-3/plan.md
  - plans/claude/23-agent-claude-is-on-agent-sdk-0-3-301/plan.md
---

# Check the agent SDK upgrades on the daemon

pi/16 and claude/23 are built, and their tests pass. These checks use a real model on your daemon, after a restart onto this build.

## A pi session

1. Start a pi session, and send one turn.
2. Check that the turn gets an answer.
3. While a turn runs, send a second message as a steer.
4. Check that the model reads the steer in the same turn.

## A Claude session

1. Start a Claude session, and send one turn that runs a tool.
2. Check that the tool call shows and that the turn gets an answer.
3. Start a session from a preset that sets `extraArgs`.
4. Check that the session starts and answers.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
