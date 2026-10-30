---
title: Check a steered bot message on a real bot
plans:
  - plans/plugin/56-a-steered-bot-message-is-its-own-turn/plan.md
---

# Check a steered bot message on a real bot

plugin/56 is built and its tests pass.
This run uses a real bot and a real daemon.
It is the plan's final verification checklist.

## Set up

1. Restart the daemon from a build that holds plugin/56.
2. In ahpw or VS Code, open a bot chat with a bot whose back session takes some seconds to answer.

## A steer is its own turn

1. Send a message that starts a long turn.
2. While the turn runs, send a second message.
3. Make sure that the first turn ends and the second message shows as a new turn.
4. Make sure that the answer after the second message shows under the new turn.

## The turns stay after a restart

1. Restart the daemon.
2. Open the same bot chat again.
3. Make sure that the chat shows the same two turns, each with its own answer.

## Reply

Write "pass" for each section, or what you saw.
