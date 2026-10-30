---
title: Check a restart from a client on a real daemon
plans:
  - plans/daemon/20261030-0635-a-client-restarts-the-daemon/plan.md
---

# Check a restart from a client on a real daemon

daemon/20261030-0635 is built and its tests pass.
This run uses a test daemon from `ahpd start` and a client that sends `x-ahpd/restart`.
It is the plan's final verification checklist.

## Set up

1. Start a test daemon with `ahpd start` from a build that holds the plan.
2. Connect ahpc to it as the host's own connection.

## A restart with no turn running

1. Send `x-ahpd/restart` with no params.
2. Make sure that the answer is `{ restarting: true, pid }`.
3. Make sure that the daemon restarts and the client connects again.

## A restart while a turn runs

1. Start a long turn in a session.
2. Send `x-ahpd/restart` with no params.
3. Make sure that the refusal names the session and says `force: true`.
4. Send `x-ahpd/restart` with `force: true`.
5. Make sure that the daemon restarts.

## Reply

Write "pass" for each section, or what you saw.
