---
title: An old plugin in the configuration directory hides the one in the plugin root
status: open
date: 2026-10-18
severity: major
refs:
  - "[code://packages/server/src/plugins.ts#L206-L218](../../packages/server/src/plugins.ts#L206-L218) - `rootsOf` puts the configuration directory before `AHPD_PLUGIN_ROOT`"
  - "[code://packages/server/src/plugins.ts#L252-L263](../../packages/server/src/plugins.ts#L252-L263) - a bare name stops at the first root that has it"
  - "[code://packages/server/src/plugins.ts#L505-L530](../../packages/server/src/plugins.ts#L505-L530) - `locate` refuses a plugin whose `@ahpd/sdk` range this daemon does not satisfy"
  - "[code://packages/server/src/install.ts#L453-L466](../../packages/server/src/install.ts#L453-L466) - `pluginRoot` installs into `AHPD_PLUGIN_ROOT` when it is set"
---

## Symptom

A server keeps an older ahpd's configuration in `~/.config/ahpd`, with its plugins in that folder's `node_modules`.
A newer ahpd starts with `AHPD_PLUGIN_ROOT` set to a root that holds current plugins.
It loads the old plugins, skips each one because its `@ahpd/sdk` range does not fit, and exits with no backend.

## Cause

`rootsOf` returns the configuration directory first and `AHPD_PLUGIN_ROOT` second.
`resolvePlugin` stops at the first root where the name resolves, so the plugin root is never tried.
`locate` then refuses that old copy, and nothing tries the next root.
The order was chosen for the ahpd part, where the configuration directory is not writable and holds no plugins.

## Impact

Major: an install onto a server with an old configuration fails, although the current plugins are on disk.
The desk cannot install there until the person updates or removes the old plugins by hand.

## Workaround

Update or remove the old plugins in `~/.config/ahpd/node_modules`, then start ahpd again.

## Fix

Candidates, none chosen: look in `AHPD_PLUGIN_ROOT` first; or, when one root's copy is refused for its range, try the next root.
