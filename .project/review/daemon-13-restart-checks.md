---
title: Check the Restart button in ahpapp
plans:
  - plans/daemon/13-ahpd-restart/plan.md
---

# Check the Restart button in ahpapp

I ran the daemon/13 checks on a second daemon on 2026-10-13. Steps 1, 2, 4 and 5 pass. `POST /api/restart` restarts the daemon, but only a person can click the button.

## What passed

- `ahpd start --port N --path <dir>`, then `ahpd restart`: the new daemon serves the same path, and a session made before resumes.
- During a turn, `ahpd restart` names the busy session and does nothing. `--force` restarts.
- `--plugin-option @ahpd/agent-claude.workerStop=session`, then `ahpd plugin config @ahpd/agent-claude workerStop worker`: it says the flag overrides the change.

## Fixes to the old steps

- The value in step 4 was `turn`, which is not a `workerStop` value. It is `worker`, and the plugin must be in the config's `plugins`.
- `POST /api/restart` works only on a daemon with `"http": true`.
- The HTTP refusal during a turn says `--force`. For the API, it should say `force: true`.

## Check by hand

1. Start a second daemon with `"http": true`: `ahpd start --port 9399 --path /tmp/x`.
2. Connect ahpapp to `ws://127.0.0.1:9399` and press Restart.
3. The daemon restarts, and ahpapp connects again.
4. Run `ahpd stop` for that daemon.

## Reply

Write "pass" or what you saw. Pass closes daemon/13. Tell me if the refusal text should say `force: true`.
