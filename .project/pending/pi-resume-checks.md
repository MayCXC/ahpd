---
title: Check that a failed pi turn resumes
plans:
  - plans/pi/20261031-0736-a-failed-pi-turn-is-resumed/plan.md
---

# Check that a failed pi turn resumes

The plan `pi/20261031-0736-a-failed-pi-turn-is-resumed` is implemented, and its tests pass. These checks need a real model and a test ahpd under XDG scratch directories.

## Set up

1. Start a test ahpd from the merged tree, with `XDG_CONFIG_HOME` and `XDG_DATA_HOME` set to scratch folders.
2. Open a pi session in VS Code or ahpc.

## Steps

1. Give pi a bad key for its provider, and send a prompt that reads a file. Expect the turn to fail with a retry control.
2. Put back a good key, and click retry. Expect the same turn to continue, with no second read of the file.
3. Expect the turn to end complete, with the old error part and the new answer in it.
4. Make a turn fail again, and restart the test ahpd. Open the session. Expect the retry control on the last turn.
5. Click retry. Expect the turn to continue from pi's file.
6. Make a turn fail, click retry, and stop the turn. Expect it to end cancelled.

## Reply

- Write "ok", or what went wrong at which step.
