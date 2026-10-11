---
title: A plugin gets parseYaml and stringifyYaml from the host
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L292-L360](../../packages/sdk/src/types/plugin.ts#L292-L360) - `PluginContext`, what a plugin may read"
  - "[code://packages/server/src/plugins.ts#L864-L874](../../packages/server/src/plugins.ts#L864-L874) - where the daemon makes each plugin's context"
---

## Context

A plugin that reads a skill or a frontmatter file needs a YAML parser.
The sdk does not depend on `@cofold/yaml`.

## Decision

`PluginContext` has `parseYaml(text)` and `stringifyYaml(value)`.
The sdk declares them, and the server gives the `@cofold/yaml` functions.

Source: Softov, 2026-10-11, to "How does a plugin such as bot read and write YAML, now that the sdk will not re-export it?" - "Host hand".

## Consequences

A plugin reads YAML with no cofold dependency, and with the same subset as the host.
The plugin API has two more members.
A loader in a test that gives no YAML functions gives functions that throw.

## Options

- **Each plugin depends on `@cofold/yaml`.** Rejected: each plugin names its own version, and it can read a file another way than the host.
