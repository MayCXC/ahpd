---
title: The server depends on @cofold/yaml, and the sdk does not
status: accepted
date: 2026-10-11
supersedes: decisions/the-sdk-re-exports-yaml.md
refs:
  - "[code://packages/sdk/package.json](../../packages/sdk/package.json) - the sdk's dependencies, the protocol package only"
  - "[code://packages/server/package.json](../../packages/server/package.json) - the server, which already depends on four cofold packages"
  - npm://@cofold/yaml@^0.3.0 - `parseYaml`, and `stringifyYaml` from cofold plan commands/05
---

## Context

The default record store and the automation store write Markdown files with YAML frontmatter.
Skills, `AGENTS.md` files and other agent files use YAML frontmatter too.
The sdk depends only on the protocol package.

## Decision

`@ahpd/server` depends on `@cofold/yaml`.
`@ahpd/sdk` keeps the protocol package as its one dependency, and it does not re-export YAML.

Source: Softov, 2026-10-11, to the sdk dependency on `@cofold/yaml`: "But I dont wanted ont the sdk, maybe on server?".

## Consequences

The sdk declares types and ports, and the server gives the implementations that read and write YAML.
A plugin gets YAML from the host, as [a plugin gets YAML from the host](a-plugin-gets-yaml-from-the-host.md) says.

## Options

- **The sdk depends on `@cofold/yaml` and re-exports it.** Rejected: the sdk gets a second dependency.
