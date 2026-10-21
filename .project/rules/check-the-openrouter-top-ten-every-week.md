---
title: "Check the OpenRouter top 10 every week, and add a missing ACP agent"
applies:
  - packages/sdk/src/machines/agents.ts
  - packages/agent-acp/src/presets.ts
refs:
  - "[code://packages/sdk/src/machines/agents.ts](../../packages/sdk/src/machines/agents.ts) - `knownAgents`, the list a setup offers"
  - "[code://packages/agent-acp/src/presets.ts](../../packages/agent-acp/src/presets.ts) - the arguments and variables of each agent"
  - https://openrouter.ai/apps/category/coding - the ranking of coding agents, which a plain `curl` reads
---

Every week, compare the 10 coding agents at the top of the OpenRouter ranking with `knownAgents`.
An agent in the top 10 that ships an ACP server and has no row gets a row in `knownAgents` and a preset in `agent-acp`.

Take the command, the arguments and the install line from the vendor's own docs, as the comment on `knownAgents` says.
An agent with no ACP server is not added, and the weekly report names it.

How to check: read the top 10 at https://openrouter.ai/apps/category/coding and find each one in `knownAgents`.

Known exception: none.
