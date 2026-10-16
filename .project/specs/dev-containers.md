---
title: Dev containers
status: current
covers:
  - packages/computer/src/devcontainer.ts
  - packages/computer/src/owners.ts
  - packages/computer/src/plugin.ts
  - packages/computer/src/manifest.ts
  - packages/sdk/src/types/containers.ts
  - packages/sdk/src/host/vscodemethods.ts
  - packages/sdk/src/host/gate.ts
  - packages/sdk/src/host/admission.ts
  - packages/tunnel-devtunnel/src/**
decisions:
  - decisions/a-dev-container-is-reached-by-docker-exec.md
  - decisions/a-dev-container-owner-is-kept-beside-the-config.md
  - decisions/dev-containers-need-allowed-folders-on-a-host-with-users.md
refs:
  - "[code://packages/computer/src/devcontainer.ts#L54-L68](../../packages/computer/src/devcontainer.ts#L54-L68) - `idLabels`, the two labels every `up` passes"
  - "[code://packages/computer/src/devcontainer.ts#L689-L696](../../packages/computer/src/devcontainer.ts#L689-L696) - `definitionOf`, the two names of a definition"
  - "[code://packages/computer/src/devcontainer.ts#L1100-L1146](../../packages/computer/src/devcontainer.ts#L1100-L1146) - the host inside started by `docker exec`, and the connect result"
  - "[code://packages/computer/src/plugin.ts#L662-L680](../../packages/computer/src/plugin.ts#L662-L680) - `folderFor`, the folder rule"
  - "[code://packages/computer/src/plugin.ts#L2025-L2075](../../packages/computer/src/plugin.ts#L2025-L2075) - `registerContainers`: connect, stop and remove on the computer a folder is"
  - "[code://packages/computer/src/runtime.ts#L3262-L3276](../../packages/computer/src/runtime.ts#L3262-L3276) - a second name for one folder is refused"
  - "[code://packages/computer/src/owners.ts#L211-L216](../../packages/computer/src/owners.ts#L211-L216) - `claimOwned`, the first owner kept in `computers.json`"
  - "[code://packages/computer/src/manifest.ts#L449-L486](../../packages/computer/src/manifest.ts#L449-L486) - the flat `source` choice and the `devcontainer` folder field"
  - "[code://packages/computer/src/manifest.ts#L884-L898](../../packages/computer/src/manifest.ts#L884-L898) - an image beside a folder, unless it is the default"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L211-L235](../../packages/sdk/src/host/vscodemethods.ts#L211-L235) - `devContainerStopped`, stop and remove"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L490-L612](../../packages/sdk/src/host/vscodemethods.ts#L490-L612) - the `vscode/devContainers/*` methods and the relay for each connection"
  - "[code://packages/sdk/src/host/gate.ts#L87-L101](../../packages/sdk/src/host/gate.ts#L87-L101) - the `container:*` grants"
  - "[code://packages/sdk/src/host/admission.ts#L157-L166](../../packages/sdk/src/host/admission.ts#L157-L166) - stop and remove also need `computer:write`"
  - "[code://packages/sdk/src/host/handshake.ts#L322-L327](../../packages/sdk/src/host/handshake.ts#L322-L327) - `_meta['vscode.devContainers']`, sent only where a container can be made"
  - git://d9d4f950^ - the deleted decisions this spec was written from: a-dev-container-is-a-computer-made-from-its-devcontainer-json, a-dev-container-is-made-by-the-dev-container-cli, a-dev-container-is-made-only-from-a-folder-the-operator-allows, a-devcontainer-source-names-any-allowed-folder, a-relay-container-is-owned-by-who-connected, connecting-to-a-dev-container-needs-a-grant, stopping-a-dev-container-needs-the-computers-grant, the-computer-form-offers-a-folder-as-a-flat-source-choice, the-name-a-create-gives-a-dev-container-is-a-label-on-it, the-relay-surface-is-the-reference-one, vscode-reaches-ahpd-through-a-dev-tunnel
---

A dev container is a [computer](computers.md) made from a folder's own `devcontainer.json`.
The `@ahpd/computer` plugin makes it with the Dev Container CLI, `devcontainer up`, and reaches it after that with `docker exec` against the container id.
The container carries the plugin's label and `ahpd.devcontainer.folder`, so it is listed, metered and destroyed like any other computer.
A session reaches one through the `devcontainer://<folder>` source, a person through the computer form, and VS Code through its own `vscode/devContainers/*` methods.
The code is in [`code://packages/computer/src/devcontainer.ts`](../../packages/computer/src/devcontainer.ts) and [`code://packages/sdk/src/host/vscodemethods.ts`](../../packages/sdk/src/host/vscodemethods.ts).

## Scenarios

### A folder makes a dev container

WHEN a session, a form or a relay asks for a dev container from a folder
AND the folder has `.devcontainer/devcontainer.json` or `.devcontainer.json`
AND the operator allows the folder
THEN the plugin runs `devcontainer up` with `--id-label` for its own label and for the folder
AND a second `up` for the same folder finds that container and makes no other.
A folder with no definition is refused, because there is no dev container to make.

### The operator allows folders

WHEN `devcontainer.folders` is set
THEN only those folders, compared after symbolic links are resolved, make a dev container.
WHEN the list is not set
AND the host has a users directory
THEN no folder makes a dev container.
The reason: a `devcontainer.json` can ask for `--privileged` and mounts, so an open list would give anybody with `computer:write` this host.
WHEN the list is not set on a host with one user
THEN any folder makes one.
A relative entry in `devcontainer.folders` stops the plugin at load.

### Dev containers are switched off

WHEN the plugin option `devcontainer` is false
THEN the plugin reads no folder, offers no picker row and no form field, and starts no launcher
AND the runtime still lists, reaches and stops the containers that are there.

### A session names a folder

WHEN a session sets `computer` to `devcontainer://<folder>`
THEN the folder can be any absolute folder that the operator allows
AND the session needs `computer:write`, as for every source.
The picker offers a `devcontainer://` row only for the session's own folder, and only when no listed computer has that folder already.

### The computer form offers a folder

WHEN a client draws the create form from the `computer:` manifest
THEN it gets a flat `source` choice of `image` or `devcontainer` and a flat `devcontainer` text field for the folder.
A body can also send the folder as `{"devcontainer": {"folder": "/path"}}`.
WHEN a body names a folder and an image that is not the host's default image
THEN the plugin refuses it as a body that names two sources.
The reason: a form sends the default image with every create, so that value is not a choice.

### A create gives the container a name

WHEN a create names a dev container computer
THEN the name is kept on the container as the `ahpd.name` label, and never as an `--id-label`.
WHEN a second create gives another name to a folder that has a computer already
THEN the plugin refuses it and tells the person to destroy the first one or choose another folder.
The reason: Docker sets labels only when it makes a container, so the first name stays.

### Commands reach the container by docker exec

WHEN the host runs a command in a dev container
THEN it runs `docker exec` with the user, the environment and the folder that the `devcontainer.metadata` label gives
AND the environment includes what one `userEnvProbe` run found, which `computers.json` keeps.
A container that no probe is kept for is probed again on its first reach.

### VS Code connects to a dev container

WHEN a client calls `vscode/devContainers/connect` with a connection id, a workspace folder and a name
AND the person has `container:connect`
THEN the plugin brings the folder's container up and starts `ahpd --stdio` inside it with `docker exec`
AND the answer carries `address` as `devcontainer:<containerId>`, `remoteWorkspaceFolder` and `hostWorkspaceFolder`.
The host inside loads the plugins in `devcontainer.plugins`, and a connect with an empty list is refused.
The host installs `ahpd` and those plugins in the container when they are not there, unless `devcontainer.install` is false.

### The relay carries frames

WHEN a client sends `vscode/devContainers/relaySend` with one frame
THEN the host writes it to the host inside as one line
AND each frame from inside comes back as `vscode/devContainers/relayMessage`, and other lines as `output`.
The connection ids are kept for each client connection, so one client cannot name another client's relay.
When the host inside ends, the host sends `relayClose` and `closeConnection`.
When the client connection closes, the host ends each of its relays.

### The surface is VS Code's own

WHEN a host has the launcher, Docker and the Dev Container CLI
THEN its `initialize` answer carries `_meta['vscode.devContainers']: true`
AND it serves VS Code's method and notification names, with no dialect of its own.
A host without them leaves the key out, so no client offers the flow there.

### A relay container has an owner

WHEN a signed-in person connects to a folder's container
THEN that person is kept as the owner in `computers.json`, unless the container has an owner already
AND the plugin opens an up-time stretch for it.
The owner is kept beside the configuration because a label on the container would change how `up` finds it.
A container that the CLI made before ahpd's labels is adopted on connect and recorded in the same file.

### VS Code stops or removes a container

WHEN a client calls `vscode/devContainers/stop` or `vscode/devContainers/remove` for a folder
AND the person has `container:stop` or `container:remove`, and `computer:write`
THEN the host ends this connection's relays for the folder and stops or removes its computer
AND it answers false when another connection holds a relay there or a session runs on that computer.
A folder with no computer answers true.

### VS Code reaches ahpd through a Dev Tunnel

WHEN the daemon runs with `@ahpd/tunnel-devtunnel`
THEN VS Code connects to it through "Connect to Remote Agent Host via Dev Tunnel"
AND VS Code offers its dev container flow on that tunnel entry.
VS Code does not offer the flow on an entry that is added by URL.
