---
title: Setup finds the runtimes and agents
domain: daemon
status: draft
priority: medium
created: 2026-10-15
revalidated: 2026-10-15
refs:
  - "[code://packages/server/src/commands/configure.ts#L42-L49](../../../../packages/server/src/commands/configure.ts#L42-L49) - `BACKENDS`: configure asks about Claude, cofold and pi only"
  - "[code://packages/agent-acp/src/presets.ts#L85-L213](../../../../packages/agent-acp/src/presets.ts#L85-L213) - the ACP presets, each with the command it runs"
  - "[code://packages/server/src/plugins.ts#L106-L108](../../../../packages/server/src/plugins.ts#L106-L108) - the daemon already knows Deno's limits for plugins"
  - "[research: how one-line installers work](../../../research/one-line-installers.md) - what installers check before they install"
---

## Goal

`ahpd configure`, and the install script before it, report what this machine has: Node, Bun and Deno, and the agent CLIs that ahpd can run. Configure then offers each agent it found, so a person with Gemini or Codex on PATH gets it without reading the ACP page.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "BACKENDS" packages/server/src` - one list of three packages, in `configure.ts`.
- `rg -n "command:" packages/agent-acp/src/presets.ts` - 13 presets: codex, gemini, copilot, opencode, kilo, goose, pi, dsh, devin, cursor, amp, qwen, and the default.

### Runtime path

```
ahpd configure -> look up each command on PATH -> list what was found -> one question per agent found -> plugins and presets written to config.json
```

### Gaps

- Configure does not offer `@ahpd/agent-acp`, so an ACP agent is set up by hand.
- Nothing reports which runtimes are installed or their versions.
- `Not found: a list of the agent commands that the server can read - searched presets.ts exports in packages/server/src.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| The agent list comes from the ACP presets, not a second list | (defaulted: one list keeps the two from drifting) | - |
| Configure lists the agents that are not installed, with the command to install each, and asks no question for them | Softov, 2026-10-15, to "Does ahpd configure also list agents that are not installed?" - "List with install command" | - |

## Proposed architecture

- **Data flow** - `@ahpd/agent-acp` exports each preset's id and command. Configure looks up `claude`, `pi` and each preset command on PATH.
  It prints a table: found, the version where the CLI gives one, and the plugin that runs it.
- **Questions** - one per agent found, with Enter taking it. An ACP agent writes `@ahpd/agent-acp` with that preset under `presets`.
- **Missing agents** - a list after the questions, each with its install command.
- **Runtimes** - one line each for Node, Bun and Deno, with the version, and whether ahpd runs on it.
- **The install script** - it prints the same runtime lines before it installs, so a person sees why it stopped.
- **Source-of-truth files** - [`code://packages/server/src/commands/configure.ts`](../../../../packages/server/src/commands/configure.ts)

## Tasks

Tasks are written when the plan moves to `planned`. The proposal is:

1. `@ahpd/agent-acp` exports its preset commands.
2. Configure finds the runtimes and agents, and asks one question per agent found.
3. The install script prints the runtime lines.

## Risks and tradeoffs

- A command on PATH may not be the agent - Configure asks before it writes, and a wrong command fails that agent's turns only.
- The server imports a backend - It reads a list of names and commands, not the backend; `pnpm boundary` decides where the list lives.

## Resume state

- **Done so far:** the proposal, 2026-10-15.
- **Next action:** write the tasks and move the plan to `planned`.
- **Open questions:** none.
- **Watch out for:** [daemon/29](../29-ahpd-doctor-says-what-is-wrong/plan.md) uses the PATH lookup, so keep it a function of its own. `codex` has no ACP mode; its preset runs `codex-acp`. Look up the preset's command, not the product name.

## Final verification checklist

- [ ] On a machine with `gemini` on PATH, configure offers Gemini and writes the preset.
- [ ] `plans/index.md` updated.
