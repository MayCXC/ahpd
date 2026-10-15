---
title: Check host/83 in VS Code's window
plans:
  - plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md
  - plans/host/83-the-host-matches-vscodes-host-p2-a-run-is-stopped-and-runs-are-capped/plan.md
  - plans/host/83-the-host-matches-vscodes-host-p3-a-remote-session-keeps-its-origin/plan.md
  - plans/host/83-the-host-matches-vscodes-host-p4-a-customization-is-switched-for-all-sessions/plan.md
---

# Check host/83 in VS Code's window

host/83 p1 to p4 are built, and their tests pass. Each one has one check that only VS Code's window can do. Use VS Code 1.140 or later.

## Set up

1. Clone `git@github.com:softov/ahpd.git` at `main`, then run `pnpm install` and `pnpm build`.
2. Write a token to a file: `echo chk-token > /tmp/ahpd-token`.
3. Use a config folder of its own: `export XDG_CONFIG_HOME=/tmp/ahpd-chk`.
4. Run `ahpd paths add <folder>`, then add `<clone>/packages/agent-claude/dist/index.js` to `"plugins"` in `/tmp/ahpd-chk/ahpd/config.json`.
5. Run `ahpd start --port 39111 --connection-token-file /tmp/ahpd-token`.
6. In VS Code's `settings.json`, set `"chat.remoteAgentHostsEnabled": true` and add `{ "name": "ahpd", "address": "ws://127.0.0.1:39111", "connectionToken": "chk-token" }` to `"chat.remoteAgentHosts"`.
7. Reload the window, and check that ahpd shows in the Chat view.

Below, `ahpd` means `node packages/server/dist/main.js`.

## p1: the host version in the Output channel

1. Open the Output panel, and choose the Agent Host channel.
2. Check that the channel shows ahpd's version, the same one `ahpd --version` prints.

## p2: Stop ends a running automation as cancelled

1. Make an automation in the window with a prompt that takes a minute or more, for example "count slowly to 200".
2. Run it, and press Stop while it runs.
3. Check that the run shows as cancelled, and that its session is still in the list.

## p3: a session sent from the window reports back

1. Also set `"chat.remoteSessions.tools.enabled": true`, and reload the window.
2. In a local chat, ask the agent to send a task to the ahpd host. For example: "list the files in the folder on ahpd, and report back".
3. Check that a new session opens on ahpd and runs the task.
4. Check that its answer comes back to the local chat that sent it.

## p4: a plugin stays off for all sessions after a restart

1. Open the customizations list for the ahpd host, and switch one plugin off for all sessions.
2. Open a new session, and check that the plugin is off there.
3. Run `ahpd restart`, and reload the window.
4. Open one more session, and check that the plugin is still off.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
