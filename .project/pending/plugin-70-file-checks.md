---
title: Check a piece action with a file
plans:
  - plans/plugin/70-a-piece-action-takes-a-file/plan.md
---

# Check a piece action with a file

Plan plugin 70 is merged in #103. Its tests use a fake piece and no network. This check needs your daemon, a real piece and the network.
Restart the daemon on main before you start.
Do these checks from a terminal that is not a Claude Code session.

## Steps

1. Bind a connector for a piece whose action takes a `FILE` prop.
2. In a session, attach a file, and ask the agent to run the action with the attachment's name.
3. Check that the action receives the file.
4. Run the action again with an `https:` URL to a public file.
5. Run it with `https://127.0.0.1/x`, and check that the refusal names only the host.
6. Run an action that writes a file, and check that the file is in the session's attachments.

## Reply

Write "done" when each step works, or say which step stopped.
