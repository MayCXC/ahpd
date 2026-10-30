---
title: Check the session pickers in a client
plans:
  - plans/host/20261030-0618-every-session-setting-is-a-picker/plan.md
---

# Check the session pickers in a client

host/20261030-0618 is built and its tests pass.
This run uses a real daemon and ahpw or VS Code.
It is the plan's final verification checklist.

## Set up

1. Restart the daemon from a build that holds the plan.
2. Open the new session form in ahpw or VS Code.

## The Bot chat offers its bots

1. Choose the Bot chat agent.
2. Make sure that the `Bot` setting is a picker with each bot by its name.
3. Choose a bot, and make sure that the chat opens with it.

## ACP approvals list their modes

1. Choose a Codex, Gemini or Qwen ACP agent.
2. Make sure that `Approvals` is a picker with the modes of that agent.

## The form order

1. Make sure that the computer comes first, then isolation and branch, then the agent's own settings.

## Reply

Write "pass" for each section, or what you saw.
