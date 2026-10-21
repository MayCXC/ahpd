---
title: More agents, with their links and their variables
domain: acp
status: active
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/machines/agents.ts#L25-L50](../../../../packages/sdk/src/machines/agents.ts#L25-L50) - `KnownAgent`, which has a command, install lines and a page, and no site, company or variables"
  - "[code://packages/sdk/src/machines/agents.ts#L69-L163](../../../../packages/sdk/src/machines/agents.ts#L69-L163) - `knownAgents`, the twelve rows today"
  - "[code://packages/agent-acp/src/presets.ts#L105-L220](../../../../packages/agent-acp/src/presets.ts#L105-L220) - the presets, which add arguments, fixed variables and the sign-in variables to each row"
  - "[code://packages/agent-acp/src/plugin.ts#L36-L113](../../../../packages/agent-acp/src/plugin.ts#L36-L113) - `optionsSchema`, where `env` is any variable name, so a form cannot show which variables an agent reads"
  - "[code://packages/server/src/found.ts#L157-L169](../../../../packages/server/src/found.ts#L157-L169) - how `ahpd configure` lays a person's preset over a row"
  - "[code://docs/plugins/PLUGINS.md#L1232-L1239](../../../../docs/plugins/PLUGINS.md#L1232-L1239) - the list of shipped presets"
  - "[code://packages/agent-acp/test/agent-acp-presets.test.ts](../../../../packages/agent-acp/test/agent-acp-presets.test.ts) - the preset tests this plan adds to"
  - "[research/acp-agents-links-and-variables.md](../../../research/acp-agents-links-and-variables.md) - the links and the variables of every agent, read from the vendors' docs"
  - https://openrouter.ai/apps/category/coding - the ranking of coding agents, read on 2026-10-19
  - https://docs.cline.bot/usage/acp.md - `cline --acp` and `CLINE_API_KEY`
  - https://raw.githubusercontent.com/can1357/oh-my-pi/main/README.md - `omp acp` and the omp install lines
  - https://raw.githubusercontent.com/can1357/oh-my-pi/main/docs/environment-variables.md - the variables omp reads
  - https://docs.devin.ai/cli/reference/commands.md - `devin acp` reads `WINDSURF_API_KEY`
  - https://ampcode.com/docs/markdown/cli/settings - `AMP_SKIP_UPDATE_CHECK`
---

## Goal

A setup offers two more coding agents from the OpenRouter top 10: Cline and omp.
Every known agent names its own site and its company's site, so a client can link to them.
Every known agent lists the environment variables its vendor documents, with what each one does and whether it is a secret.
A client draws those variables as fields when a person configures an agent, so a person does not have to know the names.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "knownAgents" packages` - read by `found.ts` in the server and by `presets.ts` in agent-acp, and exported from the sdk.
- `rg "args: \['--acp'\]" packages/agent-acp/src` - gemini and copilot get `--acp` from their presets, not from their rows.
- `rg "fromEnv" packages/agent-acp/src/presets.ts` - only codex and cursor name their sign-in variables.

### Runtime path

```
knownAgents row -> presets.ts spreads it and adds args and env -> plugin.ts optionsSchema -> a client draws the form
knownAgents row -> found.ts -> ahpd configure prints what is installed and how to install the rest
```

### Gaps

- No row for Cline or omp.
- A row has no site and no company.
- A row has no list of the variables its agent reads; `env` in `optionsSchema` takes any name.
- devin has no sign-in variable, though `devin acp` reads `WINDSURF_API_KEY`.
- amp sets no update switch, though `AMP_SKIP_UPDATE_CHECK=1` exists.
- The pi package moved.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Add the agents in the OpenRouter top 10 that ship an ACP server | Softov, 2026-10-19: "top coding agent for acp ... claude, hermes, kilo code, pi, cline, omp, codex, openclaw, protoagent" | 01 |
| Leave out Proto Agent, because it ships no ACP server | Softov, 2026-10-19, to "What should the plan do with it?": "Leave it out" | 01 |
| Leave out Hermes and OpenClaw for now | Softov, 2026-10-19: "skip it for now", for both | 01 |
| A row links to the agent's site and the company's site | Softov, 2026-10-19: "also link for the agent site/company site?" | 02 |
| A row lists its variables, so a client can draw them | Softov, 2026-10-19: "we could put the envs as a list. so in ui or another place it could easy config" | 03, 04 |
| One plan with the agents first and the variable list after | Softov, 2026-10-19, to "Plan the 5 missing agents ... and the per-agent variable list together": "One plan, two parts" | - |
| A form reads the variables and the links from the plugin's options schema | (defaulted: a client draws only what the host sends, and it already draws a form from this schema) | 04 |
| The links are a schema keyword of their own, `links`, beside the preset's `title` | (defaulted: [code://packages/agent-acp/src/plugin.ts#L36](../../../../packages/agent-acp/src/plugin.ts#L36) already adds `secretAtUse`, a keyword of its own) | 04 |
| A variable that is not a secret is a plain string in the form, not `writeOnly` | (defaulted: a person must see a model name or a folder to check it) | 04 |
| `ahpd configure` prints the site of an agent that is not installed and has no install line | (defaulted: `page` is printed there today, and the site is the next place to look) | 02 |
| devin sends `devin-browser` when `WINDSURF_API_KEY` is set | Softov, 2026-10-20, to "What should the devin preset do?": "Send devin-browser" | 05 |
| amp skips its update check, pi installs a pi that pi-acp can run | (defaulted: each is what the vendor's docs say today) | 05 |

## Proposed architecture

- **Data flow** - A row in `knownAgents` gets `site`, `company` and `variables`. Each variable has a name, one line on what it does, and `secret`. The preset spreads the row as it does now.
- **State flow** - Nothing is stored. The rows are code.
- **Layer responsibilities** - sdk: the rows and their fields · agent-acp: the presets, and an options schema entry for each shipped preset · server: `ahpd configure` prints the site.
- **Source-of-truth files** - [`code://packages/sdk/src/machines/agents.ts`](../../../../packages/sdk/src/machines/agents.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Cline and omp are known agents](task-01-cline-and-omp-are-known-agents.md) | implemented | - |
| [02 - A known agent names its site and its company](task-02-a-known-agent-names-its-site-and-company.md) | implemented | 01 |
| [03 - A known agent lists its variables](task-03-a-known-agent-lists-its-variables.md) | implemented | 02 |
| [04 - A form draws the variables of a shipped preset](task-04-a-form-draws-the-variables-of-a-preset.md) | implemented | 03 |
| [05 - The presets match the vendors' docs](task-05-the-presets-match-the-vendors-docs.md) | implemented | 03 |

## Risks and tradeoffs

- A vendor changes a variable or a URL - every fact cites the vendor page it came from, and the weekly check reads the ranking again.
- A secret variable in a form - a variable marked `secret` is `writeOnly` in the schema, as `env` values are now.

## Resume state

- **Done so far:** tasks 01 to 05 are implemented. `knownAgents` has `cline` and `omp`, and every row has `site`, `company` and `variables`. `missingLines` prints the site as a fallback. `optionsSchema` has an entry per shipped preset, with its title, its links and one `env` field per variable. In task 05, devin sends `devin-browser` when `WINDSURF_API_KEY` is set. Amp skips its update check, the pi row and part install pi 1.3.0, and qwen keeps `--acp` alone.
- **Next action:** review tasks 01 to 05.
- **Open questions:**
  - `cline` and `omp` are not installed here, so neither handshake was read. The `cline` preset has no `authenticate` until someone reads `authMethods` from `cline --acp` and finds a method for `CLINE_API_KEY`.
  - Kilo is a launcher for a native binary, with no source on this host. Whether it reads `OPENCODE_DISABLE_AUTOUPDATE` is still unconfirmed, so the comment in `presets.ts` stays.
  - The by-hand check of a client form was not run, because there is no client here.
- **Watch out for:** claude is not a row here; the `agent-claude` plugin drives it. Kilo, pi and codex are rows already. The arguments of an agent stay in `presets.ts`, not in its row. A third-party page gives `omp --mode acp`; the omp README gives `omp acp`, and the README wins. `cline` and `omp` carry no `machine`, so a session of either in a machine has no part-installed CLI.

## Final verification checklist

- [ ] `pnpm test` passes, Windows included.
- [ ] `ahpd configure` lists Cline and omp, and prints a site for an agent that is not installed.
- [ ] A form from `optionsSchema` shows the variables of a shipped preset.
- [ ] `plans/index.md` updated.
