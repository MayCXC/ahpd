---
title: Cline and omp are known agents
status: implemented
depends: []
layer: "sdk, agent-acp, docs"
refs:
  - "[code://packages/sdk/src/machines/agents.ts#L69-L163](../../../../packages/sdk/src/machines/agents.ts#L69-L163) - the rows, which get two more"
  - "[code://packages/agent-acp/src/presets.ts#L105-L220](../../../../packages/agent-acp/src/presets.ts#L105-L220) - the presets, which get two more"
  - https://docs.cline.bot/usage/acp.md - `cline --acp`
  - https://docs.cline.bot/cli/cli-reference.md - the Cline install line and its variables
  - https://raw.githubusercontent.com/can1357/oh-my-pi/main/README.md - `omp acp` and the omp install lines
---

## Objective

`knownAgents` and the shipped presets have a `cline` row and an `omp` row.
`ahpd configure` finds them and prints how to install them.

## Files

- `UPDATE: packages/sdk/src/machines/agents.ts:69-163` - add the `cline` and `omp` rows.
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

- **Done so far:** `knownAgents` has a `cline` row: `cline`, `npm install -g cline`, page `https://cline.bot/cli`. It also has an `omp` row: `omp`, the `curl` line for linux and darwin, the `irm` line for win32, page `https://omp.sh`. Both carry the `site`, `company` and `variables` that tasks 02 and 03 make required. `presets.ts` has `cline` with `args: ['--acp']` and `omp` with `args: ['acp']`, each spreading its row. `PLUGINS.md` and `packages/agent-acp/README.md` list both keys. `agent-acp-presets.test.ts` checks the command and the arguments of each, and `agents.test.ts` checks every npm part has a row whose line names its package.
- **Next action:** none for this task.
- **Open questions:** step 7, and the by-hand check, are for Softov. Neither `cline` nor `omp` is installed on this host, so their handshakes were not read. The `cline` preset has no `authenticate` until someone reads `authMethods` from `cline --acp`. If it lists no method for `CLINE_API_KEY`, the preset stays as it is. `node scripts/acp-info-test.mjs -- cline --acp` answers it without a client, as does the same with `omp acp`.
- **Watch out for:** a row now needs `site`, `company` and `variables`, so task 01 could not compile alone: all three tasks landed together. Neither preset has a `machine`, because neither row names a part, so a session in a machine gets no part-installed CLI for these two.
