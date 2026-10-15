---
title: On a host with a users directory, no dev container is made until `devcontainer.folders` is set
status: accepted
date: 2026-10-06
refs:
  - "[code://packages/computer/src/plugin.ts#L443-L454](../../packages/computer/src/plugin.ts#L443-L454) - `devcontainer.folders`, where absent allows any folder"
  - "[code://packages/computer/src/plugin.ts#L481-L490](../../packages/computer/src/plugin.ts#L481-L490) - `folderFor`, which every dev container route asks"
  - "[code://docs/plugins/COMPUTERS.md#L537-L547](../../docs/plugins/COMPUTERS.md#L537-L547) - `computer:write` and a `devcontainer.json`, and the allowed folders"
  - git://52f98f6 - container/03, which made a dev container a computer
  - "git://63a25e0b - the merged decision: a dev container is made only from a folder the operator allows, and `devcontainer: false` turns every route off"
---

## Context

With `devcontainer.folders` unset, any folder with a `devcontainer.json` may be built from.
A `devcontainer.json` can ask for `--privileged`, mounts and run arguments, and the Dev Container CLI applies them, so on a host where several people sign in, anybody who holds `computer:write` can get a privileged container on the host by pointing at a folder they wrote.
On a host with one person on it that person already holds the host, and "absent allows any" asks nothing of them.
The deployment limits a machine made from an image with the `images` allowlist.
It limits the host paths a body may name with `bodyMounts`.
A `devcontainer` source reaches neither: a folder's `devcontainer.json` decides its image, its mounts, its `runArgs` and its `initializeCommand`, which runs on this host.

## Decision

On a host with a users directory, every dev container route (the create body, the `devcontainer://<folder>` setting, the picker's row and the relay's `connect`) refuses until `devcontainer.folders` is set, with a sentence naming the option.
On a host without one, an unset `devcontainer.folders` still allows any folder.
`devcontainer: false` turns off every route on both: the launcher, the session-time create and the picker row, not only the relay.
A picker row is never offered when dev containers are off.
With no allowlist configured, any folder is allowed, as an unset `images` allows any image; `devcontainer: false` is how an operator turns them off.

Source: Softov, 2026-10-06, asked "With devcontainer.folders unset, anyone with computer:write can run a devcontainer.json with --privileged. What should happen?" and chose "Required with users".
Source: Softov, 2026-09-26, asked "Should dev containers respect the operator's limits?": "an allowlist of folders, and `devcontainer: false` turns off every route".
The options offered were: gate by `bodyMounts` or a new `devcontainers` allowlist of folders; `devcontainer: false` disabling every route; or keeping the ungated behaviour.

## Consequences

- A host that adds a users file stops making dev containers until its operator names the folders; the refusal and `docs/plugins/COMPUTERS.md` say so.
- The computer plugin has to know whether the host has a users directory, which its context does not tell it today.

## Options

- **Absent allows any, everywhere.** Lost: `computer:write` would be root on a shared host by way of a file anybody can write.
- **Required everywhere.** Lost: a single-person host would have to configure what it gains nothing from.
- **Gate a dev container by `bodyMounts`.** Rejected: `bodyMounts` names paths, and a folder's definition is a recipe rather than a path.
- **Leave dev containers ungated.** Rejected: it lets a body reach whatever a folder's definition declares, around every limit the operator set.
