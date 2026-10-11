---
title: The sdk depends on @cofold/yaml and re-exports it
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/package.json](../../packages/sdk/package.json) - the sdk's dependencies, the protocol package only before this"
  - "[code://packages/sdk/src/index.ts](../../packages/sdk/src/index.ts) - what the sdk exports"
  - npm://@cofold/yaml@^0.3.0 - `parseYaml`, and `stringifyYaml` from cofold plan commands/05
---

## Context

Bots and automations become Markdown files with YAML frontmatter.
Skills, `AGENTS.md` files and other agent files use YAML frontmatter too.
A plugin that reads one of those must find a YAML parser somewhere.

## Decision

`@ahpd/sdk` depends on `@cofold/yaml`.
It re-exports `parseYaml`, `stringifyYaml` and `YamlError`, so a plugin reads and writes YAML through the sdk, with no direct cofold dependency.

Source: Softov, 2026-10-11: "I think we will need this yaml since skills, AGENTS and a lot of things use yaml. also yaml from sdk could be reexported, so plugins can use without cofold direct".

## Consequences

The sdk keeps the automation folder itself, beside `migrateSessions`, and needs no storage port for it.
Every package and plugin uses one YAML subset.
The sdk has a second dependency, and a change to `@cofold/yaml` is tested against ahpd before a cofold release.

## Options

- **The sdk keeps the protocol package as its one dependency.** Rejected: each plugin that reads YAML would add cofold itself.
