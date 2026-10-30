---
title: A server check installs what is missing
created: 2026-10-30
refs:
  - "[code://.project/plans/container/20261030-1141-a-server-says-what-it-can-run/plan.md](../plans/container/20261030-1141-a-server-says-what-it-can-run/plan.md) - the check, which prints the fixes and installs nothing"
---

The server check prints the commands that fix a box, and the operator runs them.
A later step could run those commands for the operator, over ssh as root, after a confirm in the client.
It would need a way to reach root on the box, such as `sudo` without a password or a root key.
It would also need the client to show the commands before they run.
