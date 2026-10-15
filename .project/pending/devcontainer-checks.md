---
title: Check the dev container route in VS Code on Windows
plans:
  - plans/container/02-vscode-offers-our-dev-container/plan.md
---

# Check the dev container route in VS Code on Windows

container/02 waits on this run. VS Code on Windows connects to ahpd on Linux through a dev tunnel, and makes a dev container there. The last try, on 2026-09-26, stopped because the tunnel did not show in VS Code. The tunnel labels match VS Code's, so the likely cause is a tunnel made under another account.

## Set up

1. On the Linux host, run `devtunnel user login` with the provider and the account that VS Code on Windows is signed in with.
2. Install the Dev Containers CLI and Docker on the Linux host, and check that `devcontainer --version` and `docker ps` both answer.
3. Add `@ahpd/tunnel-devtunnel` and `@ahpd/computer` to the daemon's plugins, then run `ahpd restart`. The computer plugin holds the dev container launcher.
4. Run `ahpd status`, and check that it shows the tunnel.
5. In VS Code 1.140 on Windows, check that `chat.remoteAgentHostsEnabled` and `chat.agentHost.devContainer.enabled` are on.

## The tunnel shows in VS Code

1. Run "Agents: Connect to Remote Agent Host via Dev Tunnel".
2. Check that the ahpd tunnel is in the list, and connect to it.

## The folder offers "Use Dev Container"

1. In New, pick the `.scratch/devc-work` folder on the Linux host. It has a `devcontainer.json`.
2. Check that the workspace picker shows "Use Dev Container".

## The first send makes the container

1. Pick "Use Dev Container", type a prompt, and send it.
2. Check that VS Code shows "Starting Dev Container...", and then a running session.
3. On the Linux host, check that `docker ps` shows the container.

## The session survives a reload

1. Reload the VS Code window.
2. Check that the session is still there, and that it answers one more turn.

## Stop and remove act on the Linux host

1. Stop the idle dev container from VS Code, and check on the Linux host that `docker ps` no longer shows it.
2. Remove it from VS Code, and check that `docker ps -a` no longer shows it.

## If a step fails

1. Copy VS Code's Agent Host output log.
2. Copy the lines with `vscode/devContainers/isDockerAvailable` from the daemon log.
3. Add both to your reply.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
