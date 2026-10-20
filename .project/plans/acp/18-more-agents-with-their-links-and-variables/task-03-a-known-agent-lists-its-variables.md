---
title: A known agent lists its variables
status: todo
depends: [task-02-a-known-agent-names-its-site-and-company.md]
layer: "sdk"
refs:
  - "[research/acp-agents-links-and-variables.md](../../../research/acp-agents-links-and-variables.md) - the variables of every row"
  - "[code://packages/sdk/src/agents.ts#L25-L50](../../../../packages/sdk/src/agents.ts#L25-L50) - `KnownAgent`, which gets `variables`"
---

## Objective

Every row in `knownAgents` has `variables`, the environment variables its vendor documents.
Each variable has a name, one line on what it does, and `secret`.

## Files

- `UPDATE: packages/sdk/src/agents.ts:25-50` - add `AgentVariable` and `variables` to `KnownAgent`.
- `UPDATE: packages/sdk/src/agents.ts:69-163` - fill `variables` on every row.

## Steps

1. Add `AgentVariable` with `name`, `description` and `secret`, each with a one-line comment.
2. Add `variables: AgentVariable[]` to `KnownAgent`.
3. Fill `variables` on every row from the variables table in the research file.
4. Leave out the generic provider keys; a person writes those as any other `env` name.
5. Add a test that no row names one variable twice.

## Validation

- An sdk test checks that every row has a `variables` list with no name twice.
- `pnpm test` passes.

## Resume
