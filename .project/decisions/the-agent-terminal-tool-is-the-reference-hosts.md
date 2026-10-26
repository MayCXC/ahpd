---
title: The agent terminal tool is the reference host's, by its names and its words
status: proposed
date: 2026-10-26
refs:
  - "[code://packages/sdk/src/tools/shell.ts](../../packages/sdk/src/tools/shell.ts) - the six tools"
  - "[code://packages/sdk/src/host/shells.ts](../../packages/sdk/src/host/shells.ts) - the shells they run in"
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts - the reference's tools
  - https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/common/copilotCliConfig.ts - the reference's switch
---

## Context

An agent's own shell runs its commands where nobody can see them.
The reference host gives an agent shells whose commands run in terminals the session holds, and a client turns them on with `enableCustomTerminalTool`.
The reference's descriptions name things this host does not have, such as `mode=async`, `ask_user` and a 60KB cap, where the output cap is 80,000 characters.
Its key says "Copilot SDK sessions", and here it reaches every session.
A later reader would correct those words, or give the tools names of this host's own.

## Decision

The agent terminal tool is the reference host's, carried as it is: its names, its schemas, its descriptions and its answers, word for word.
It is behind the reference's own key, with the reference's property, and it reaches every backend that can take a host tool.
This host departs from the reference only where its own machinery differs, and its plan names each departure.

## Consequences

A skill, a prompt or a client written for the reference's shell works here.
A client draws the key from the property it already knows.
A model reads the reference's words, including the ones that name what this host does not have.
A change to the reference's words is copied, and not improved here.

## Options

- Four tools of this host's own, `ahp_terminal_*`, to open, write to, read and close a terminal. They lost: a skill or a client written for the reference would not reach them, and the reference already defines the surface.
- Claude's own `Bash`, moved to a terminal through a hook on its `run_in_background`. It lost: it reaches one backend, and a command that does not ask for the background stays out of sight.
- Words corrected to this host, such as no `mode=async` and an 80,000-character cap. They lost: the descriptions are the part a model reads, and a model trained on the reference's reads them as the reference's.
