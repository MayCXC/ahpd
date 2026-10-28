---
title: Check the agent-cofold model list
plans:
  - plans/plugin/63-cofold-lists-models-by-provider/plan.md
---

# Check the agent-cofold model list

Plan plugin 63 lists the models of every cofold provider under its own id. Its tests use fake endpoints. These checks need your daemon and your cofold file.
Restart the daemon on main before you start.
Do these checks from a terminal that is not a Claude Code session.

## Steps

1. Open the agent-cofold model list in a client.
2. Check that the list shows `open_router/...` ids and no `cofold/...` id.
3. Pick a listed `open_router/...` model and send one turn.
4. Check that the turn answers on the model you picked.

## Reply

Write "done" when each step works, or say which step stopped.
