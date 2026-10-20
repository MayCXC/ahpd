---
title: Check that the Ember session stays listed after a restart
plans:
  - plans/host/109-a-session-outside-the-paths-stays-listed/plan.md
---

# Check that the Ember session stays listed after a restart

host/109 is built, and its six tests pass. This check uses the Ember bot, whose session runs in `~/.bots/ember`, a folder outside Claude's `paths`.

## After a restart

1. Check that the Ember bot has a session from an earlier run.
2. Restart the daemon onto this build.
3. Open the session list in a client, before you send anything to Ember and before its next wake.
4. Check that the Ember session is in the list.
5. Wait for two refreshes of the list, or open the list again twice.
6. Check that the Ember session is still in the list, and that it did not leave and come back.
7. Open the Ember session from the list.
8. Check that it opens with its earlier chat.

## Reply

Write "pass", or what you saw. A pass ticks the matching line in the plan.
