---
title: Check the host marks
plans:
  - plans/plugin/69-a-plugin-names-a-host-mark/plan.md
---

# Check the host marks

Plan plugin 69 is merged in #102. These checks need your daemon and ahpw.
Restart the daemon on main before you start.
Do these checks from a terminal that is not a Claude Code session.

## Steps

1. Put `{ "src": "mark:whatsapp" }` in a test plugin's manifest, and check that its plugins row has a `data:image/svg+xml` icon.
2. Open the connectors page in ahpw, and check that Jira, Linear, Resend and WhatsApp show their marks.
3. Check in the daemon log that the CDN is not fetched for those four pieces.
4. Check that a webhook connector shows the webhook plugin's icon.
5. Open the agents page in ahpw, and check that your Codex record shows the OpenAI mark.
6. Check that page in light and dark.

## Reply

Write "done" when each step works, or say which step stopped.
