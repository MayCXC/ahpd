---
title: A known agent names its site and its company
status: implemented
depends: [task-01-cline-and-omp-are-known-agents.md]
layer: "sdk, server"
refs:
  - "[research/acp-agents-links-and-variables.md](../../../research/acp-agents-links-and-variables.md) - the site and the company of every row"
  - "[code://packages/sdk/src/agents.ts#L25-L50](../../../../packages/sdk/src/agents.ts#L25-L50) - `KnownAgent`, which gets `site` and `company`"
  - "[code://packages/server/src/found.ts#L157-L169](../../../../packages/server/src/found.ts#L157-L169) - `withPreset`, which keeps the row's fields"
---

## Objective

Every row in `knownAgents` has `site`, the agent's own page, and `company`, the site of the company behind it.
`ahpd configure` prints the site of an agent that is not installed and has no install line and no page.

## Files

- `UPDATE: packages/sdk/src/agents.ts:25-50` - add `site` and `company` to `KnownAgent`.
- `UPDATE: packages/sdk/src/agents.ts:69-163` - fill both on every row.
- `UPDATE: packages/server/src/found.ts` - print the site where neither a line nor a page is there.

## Steps

1. Add `site: string` and `company: string` to `KnownAgent`, each with a one-line comment.
2. Fill both on every row from the links table in the research file.
3. In `found.ts`, print the site for an agent that has no install line and no page.
4. Add a test that every row has both fields as `https://` URLs.

## Validation

- An sdk test checks that every row has a `site` and a `company` that start with `https://`.
- `pnpm test` passes.

## Resume

- **Done so far:** `KnownAgent` has a required `site` and `company`, each with a one-line comment. Every one of the fourteen rows fills both from the links table in the research file. `missingLines` in `found.ts` prints `installLine(agent, platform) ?? agent.page ?? agent.site`, so an agent with neither a line for this system nor a page is shown its site. `agents.test.ts` checks that every row has both as `https://` URLs, and `server-configure.test.ts` checks both the page and the site fallback.
- **Next action:** none for this task.
- **Open questions:** none.
- **Watch out for:** `page` stays ahead of `site`, because it is the install page. `site` is the fallback only when neither a line for the system nor a page exists.
