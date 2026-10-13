---
title: The served plugin config does not know a plugin by its id
status: open
date: 2026-10-13
severity: minor
refs:
  - "[code://packages/server/src/commands/plugin.ts#L249-L252](../../packages/server/src/commands/plugin.ts#L249-L252) - the id lookup, which reads ids only when no daemon serves the verb"
  - "[code://packages/server/src/commands/plugin.ts#L330-L339](../../packages/server/src/commands/plugin.ts#L330-L339) - `overriddenBy`, which compares the recorded `--plugin-option` with the spec and the id"
  - "[code://packages/server/src/plugins.ts#L76-L77](../../packages/server/src/plugins.ts#L76-L77) - `pluginIdOf`, which answers the spec when this process read no id"
  - git://9d64f99 - daemon/19, which made the id the name of a plugin
---

## Symptom

On a daemon started with `--plugin ./packages/agent-claude`, `/api/plugin/config` refuses `@ahpd/agent-claude` and takes only the spec as written.
A `--plugin-option` on that daemon does not show as `overriddenBy` in the served answer.
`ahpd plugin list` shows the plugin twice, both as ready.
The CLI without a daemon names the plugin by its id, as daemon/19 intends.

## Cause

On the served path, `pluginIdsOf` does not run, so `pluginIdOf(entry)` answers the spec.
A plugin from `--plugin` is not in the config's `plugins`, so the id is not found there either.
The duplicate line in `plugin list` is the same plugin from the flag and from the config.

## Impact

A person who runs a daemon with `--plugin` must name the plugin by its path in the API, not by its id.
The answer does not say that a flag overrides the value.
Daemons from `ahpd start` with plugins in the config are not affected.

## Workaround

Name the plugin by the spec that loads it.

## Fix

- Give the served path the ids of the plugins the daemon loaded, from the loader's own map.
- Merge a `--plugin` and a config entry with one id into one line in `plugin list`.
