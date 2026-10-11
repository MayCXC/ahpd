---
title: A plugin's id is the name its module exports, not the spec that loads it
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/server/src/plugins.ts#L60](../../packages/server/src/plugins.ts#L60) - `nameOf`, the spec as written, which keys a plugin today"
  - "[code://packages/server/src/plugins.ts#L663-L682](../../packages/server/src/plugins.ts#L663-L682) - the loader's name: the module's `name` export wins over the manifest"
  - "[code://packages/sdk/src/types/plugin.ts#L674-L694](../../packages/sdk/src/types/plugin.ts#L674-L694) - `Plugin.name`, documented as the plugin's id"
---

## Context

Root config, `ahpd plugin` and `--plugin-option` name a plugin by its spec, so a plugin loaded from a path shows as `plugins../packages/agent-claude/src/index.ts`.
Moving the file, or changing a path to the npm package, gives the plugin a new key.
The loader already gives each plugin a name, and the SDK documents `Plugin.name` as the plugin's id.
When this was decided, four packages exported a name that differed from the package name: `@ahpd/computer`, `@ahpd/bot`, `@ahpd/push` and `@ahpd/tunnel-devtunnel`. Each now exports its package name.

## Decision

A plugin's id is the name the loader gives it today.
That is the module's `name` export, then the manifest's `name`, then the file name, then the spec.
Root config keys, the `ahpd plugin` verbs, the listing and `--plugin-option` use the id.
The daemon imports a disabled plugin, without `apply`, to read its `name`.
When that import fails, the id is the manifest's `name`, then the file name, then the spec.
A verb and `--plugin-option` also accept the spec as written, so a line that names the spec still works.

Source: Softov, 2026-10-10, asked "Which name becomes a plugin's id, the one root config, `ahpd plugin` and --plugin-option use?": "The module's exported name (Recommended)".

## Consequences

A plugin has one name, for its key, its route, its labels and its log lines.
A plugin keeps its key when it moves from a path to the npm package.
Two entries that give the same id are refused at start, such as a path and the npm package of one plugin.
A disabled plugin's module is imported at start and by the `plugin` verbs, so its top-level code runs.

## Options

- **The package name everywhere.** It needs no import. But bot, push, devtunnel and ahpw change their run-time name, and the ahpw route moves to `/plugins/@ahpd/web/`.
- **The package name for keys only.** It needs no import. But a plugin then has two names: one for the key, one for the route and the labels.
