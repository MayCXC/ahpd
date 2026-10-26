---
title: The daemon bundles no agent, and starts without one
status: accepted
date: 2026-10-26
supersedes: decisions/the-daemon-bundles-no-agent.md
refs:
  - "[code://packages/server/src/commands/run.ts#L952](../../packages/server/src/commands/run.ts#L952) - the `base` that names no backend"
  - "[code://packages/agent-claude/src/plugin.ts](../../packages/agent-claude/src/plugin.ts) - the entry that makes the Claude package loadable"
  - "[code://packages/server/src/plugins.ts](../../packages/server/src/plugins.ts) - the loader that resolves a named package and folds what it registers"
  - "[code://packages/server/src/pluginschannel.ts](../../packages/server/src/pluginschannel.ts) - the channel a client installs and updates plugins through"
  - "[code://.project/decisions/agent-package-only-when-it-brings-a-runtime.md](agent-package-only-when-it-brings-a-runtime.md) - which backends are packages at all"
  - git://c510711b - the last commit that holds `the-daemon-bundles-no-agent`
---

## Context

`@ahpd/server` was a thin wrapper over two libraries, and one of them was a backend. `base.agents` was the literal `[claude({ paths: options.paths })]`. `@ahpd/agent-claude` was a dependency of the daemon package.

Claude was the one backend compiled into the daemon. So it was the only one that could not be left out, upgraded on its own, or replaced without a fork. It also made the daemon's dependency tree the Claude Agent SDK's.

When the backend became a plugin, a daemon with none refused to start. A client could do nothing to fix a configuration, so a startup that stopped and named the fix was the better answer.

That reason has gone. A client now installs, updates, enables and configures plugins through `x-ahpd/plugins`, and adds agent records. And the refusal turned an update into an outage. A 0.14 daemon refuses a 0.13 plugin, finds no backend, and exits 1. The client that could fix it never connects.

## Decision

The daemon bundles no backend. `base.agents` is `[]`, `@ahpd/agent-claude` is not a dependency of `@ahpd/server`, and every agent a host serves is a plugin's.

A daemon whose configuration contributed no backend starts. It logs one line that names the fix, lists no agent, and refuses each `createSession` with `-32002`. `createHost` and a live fold take an empty agent list.

Softov, 2026-10-26: "I think ahpd should start without backend.. since now web can add one."

## Consequences

Installing the daemon is not installing an agent. The first run is the daemon, then a plugin, from the command line or from a client.

The Claude backend releases on its own. A harness change is an `@ahpd/agent-claude` version an operator installs, not an `@ahpd/server` version.

A daemon whose plugins all fail to load stays up. The plugins' alerts and the log say why, and a client updates or replaces them.

A client connected to a host with no agent sees an empty `agents` list. It has to say so, and offer the plugins, rather than show an empty picker.

The host inside a computer is the same build, so it starts with no backend too. `connect` still refuses an empty list before a container is built, because a host inside with nothing to run is a list nobody filled in.

## Options

- **Keep Claude compiled in and let a plugin add others.** Rejected: every deployment pays for a backend it cannot leave out. And the protocol package and the Claude harness stay in one release.
- **Bundle Claude but let a flag turn it off.** Rejected: the dependency stays, and the flag says again what `plugins` says.
- **Refuse to start with no backend.** Rejected: an update that leaves old plugins stops the daemon. The client that could fix it cannot connect.
- **Move each plugin to a fitting version on start.** Rejected: a start that runs npm is slow and needs the network. It changes code nobody asked to change. `ahpd update` and the install script already move the plugins.
