---
title: Cline and omp are known agents
status: todo
depends: []
layer: "sdk, agent-acp, docs"
refs:
  - "[code://packages/sdk/src/agents.ts#L69-L163](../../../../packages/sdk/src/agents.ts#L69-L163) - the rows, which get two more"
  - "[code://packages/agent-acp/src/presets.ts#L105-L220](../../../../packages/agent-acp/src/presets.ts#L105-L220) - the presets, which get two more"
  - https://docs.cline.bot/usage/acp.md - `cline --acp`
  - https://docs.cline.bot/cli/cli-reference.md - the Cline install line and its variables
  - https://raw.githubusercontent.com/can1357/oh-my-pi/main/README.md - `omp acp` and the omp install lines
---

## Objective

`knownAgents` and the shipped presets have a `cline` row and an `omp` row.
`ahpd configure` finds them and prints how to install them.

## Files

- `UPDATE: packages/sdk/src/agents.ts:69-163` - add the `cline` and `omp` rows.
- `UPDATE: packages/agent-acp/src/presets.ts:105-220` - add the `cline` and `omp` presets.
- `UPDATE: packages/agent-acp/test/agent-acp-presets.test.ts` - test the two presets.
- `UPDATE: docs/plugins/PLUGINS.md:1232-1239` - add the two keys to the list of shipped presets.

## Steps

1. Add the `cline` row: command `cline`, install `npm install -g cline`, page `https://cline.bot/cli`.
2. Add the `omp` row: command `omp`, page `https://omp.sh`.
3. Give `omp` the line `curl -fsSL https://omp.sh/install | sh` for linux and darwin.
4. Give `omp` the line `irm https://omp.sh/install.ps1 | iex` for win32.
5. Add the `cline` preset with `rowOf('cline')` and `args: ['--acp']`.
6. Add the `omp` preset with `rowOf('omp')` and `args: ['acp']`.
7. Give `cline` `authenticate.fromEnv` with `CLINE_API_KEY` only if its handshake lists a method for it.
8. Add the two keys to the list in `PLUGINS.md`.

## Validation

- `agent-acp-presets.test.ts` checks the command and the arguments of `cline` and `omp`.
- `pnpm test` passes.
- By hand: run `cline --acp` and `omp acp` and read the `authMethods` of each handshake.

## Resume
