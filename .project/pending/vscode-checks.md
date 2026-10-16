---
title: Check host/83 and host/95 in VS Code's window
plans:
  - plans/host/83-p1-the-host-describes-itself/plan.md
  - plans/host/83-p2-a-run-is-stopped-and-runs-are-capped/plan.md
  - plans/host/83-p3-a-remote-session-keeps-its-origin/plan.md
  - plans/host/83-p4-customization-switched-for-all-sessions/plan.md
  - plans/host/95-an-automation-moves-as-vscodes-file/plan.md
---

# Check host/83 and host/95 in VS Code's window

host/83 p1 to p4 and host/95 are implemented, and their tests pass. Each one has one check that only VS Code's window can do. Use VS Code 1.140 or later.

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

## host/95: an automation file moves both ways

1. Run `ahpd automation export <id> --out /tmp/ahpd-chk/one.automation.md` for an automation with a daily schedule.
2. In VS Code's Automations view, import `/tmp/ahpd-chk/one.automation.md`.
3. Check that the name, prompt and schedule are the same, and that the automation is switched off.
4. In VS Code, export one automation to `/tmp/ahpd-chk/two.automation.md`.
5. Run `ahpd automation import /tmp/ahpd-chk/two.automation.md --folder <folder>`.
6. Reload the window, and check that the ahpd host lists it with the same name, prompt and schedule.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.

## Results on Windows, 2026-10-16

Run by Softov on Windows 10 with VS Code 1.141.2 and Node 24.12.0, from ahpd `main` at `ea7a01b8` with the fixes below.
A recording proxy, `scripts/tee.mjs`, sat between the window and ahpd for p2 to p4.

- **Set up:** pass, after a fix.
  A plugin named by a Windows drive path, as step 4 does, stopped ahpd from starting: `hasScheme` read `F:` as a URL scheme.
- **p1:** pass.
  The Agent Host channel shows `Agent host version 0.12.0`.
- **p2:** pass, after a fix.
  Stop ended the run as `cancelled`, but the session was drawn as failed.
  See the departure in host/83 p2's `implemented.md`.
- **p3:** pass, after a fix.
  The window sends the origin on the request's `_meta`, not in `config._meta`, so the agent never reported back.
  See the departure in host/83 p3's `implemented.md`.
- **p4:** pass, after a fix.
  Switching off one built-in plugin switched off all three, because they shared the enablement key `builtin`.
  With the fix, `cc-plugin-agents-md` switched off stays off in a new session after `ahpd restart`, and the other two stay on.
  "Disable (Session)" does not stay; see host/83 p4's `implemented.md`.
- **host/95:** not run.

### Seen on the way, not fixed

- The window's slash list names the skills of the "VS Code Synced Data" plugin by its nonce, as in `/1683262406:advisor`.
- The Automations view once showed "The agent host is disconnected on ahpd" while ahpd ran the whole time.
- On Windows, `pnpm boundary` fails: `scripts/boundary.mjs:60` builds `/github/ahpd/packages` from a URL pathname.
- On Windows, vitest fails 17 tests in `packages/agent-claude` and about 200 in `packages/sdk`, the same with and without the fixes.
  Most assume POSIX paths, such as `/dev/zero` and `/home/softov`, or a POSIX shell, git worktree or pty.
