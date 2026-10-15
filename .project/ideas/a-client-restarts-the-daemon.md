---
title: ahpapp and ahpw restart the daemon
created: 2026-10-15
---

`POST /api/restart` restarts a daemon started with `ahpd start`. It passed on 2026-10-15 with curl, on a daemon with `"http": true` (daemon/13).

- **ahpapp** has a Restart button. Nobody has pressed it against a daemon. To check it: start a second daemon with `"http": true`, connect ahpapp to it, press Restart, and see that ahpapp connects again.
- **ahpw** has no Restart button. It could call the same endpoint, and show the refusal when a turn runs.

The refusal during a turn says `pass --force`. For an API caller it would say `force: true`.
