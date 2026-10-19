---
title: The sdk lists the known agents
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/agent-acp/src/presets.ts#L85-L213](../../../../packages/agent-acp/src/presets.ts#L85-L213) - `presets`: each row's `name` and `command` move to the shared list"
  - "[code://packages/sdk/src/index.ts#L34](../../../../packages/sdk/src/index.ts#L34) - the export lines that the new list joins"
  - "[code://packages/computer/images/versions.json](../../../../packages/computer/images/versions.json) - the npm packages of each machine part, which the install lines must match"
  - "[code://scripts/boundary.mjs](../../../../scripts/boundary.mjs) - the server may import `@ahpd/sdk` and not `@ahpd/agent-acp`"
  - "[code://packages/agent-acp/src/plugin.ts#L47-L101](../../../../packages/agent-acp/src/plugin.ts#L47-L101) - `optionsSchema`: the preset fields that a person writes, which gain `install` and `page`"
  - "[code://packages/agent-acp/test/agent-acp-presets.test.ts](../../../../packages/agent-acp/test/agent-acp-presets.test.ts) - the preset tests that the new cases join"
---

## Objective

`@ahpd/sdk` exports `knownAgents`: one row per ACP agent with its id, name, command, install lines and install page.
`presets.ts` takes each row's `name` and `command` from it, so the server and agent-acp read one list.
A person's preset in `config.json` can write `install` and `page`, and the value wins over the row.

## Files

- `CREATE: packages/sdk/src/agents.ts` - `KnownAgent` and `knownAgents`, keyed by the preset id.
- `UPDATE: packages/sdk/src/index.ts:34` - export `knownAgents` and the type `KnownAgent`.
- `UPDATE: packages/agent-acp/src/presets.ts:85-213` - each row spreads `name` and `command` from `knownAgents[id]`; the header names the new home of the commands.
- `UPDATE: packages/agent-acp/src/plugin.ts:47-101` - `install` and `page` in the schema of a preset, each with a description.
- `CREATE: packages/sdk/test/agents.test.ts` - the install lines against `versions.json`.
- `UPDATE: packages/agent-acp/test/agent-acp-presets.test.ts` - every preset key has a row in `knownAgents`, with the same command.

## Steps

1. Write the tests first.
2. Define `KnownAgent` with `id`, `name`, `command`, `install` and `page`, each field with a comment.
3. Give `install` the optional keys `all`, `linux`, `darwin` and `win32`, where a system key wins over `all`.
4. Make `page` the URL of the vendor's install page, for a system that has no line.
5. Export `installLine(agent, platform)`, which gives the line for that system, or nothing.
6. Fill `knownAgents` with one row for each of the 12 keys of `presets`.
7. Write `npm i -g <package>` under `all` for each part that `versions.json` installs with npm.
8. For opencode, goose, devin and cursor, copy each system's line from the vendor's docs.
9. Write only a line that the vendor's docs give, and leave out a system that has none.
10. Write the date of that check in the file header.
11. Keep the `args`, `env`, `authenticate` and `machine` fields in `presets.ts`, because the server does not need them.
12. In each row of `presets.ts`, take `name` and `command` from `knownAgents`, so each command has one source.
13. Add `install` and `page` to the preset schema in `plugin.ts`, with the same keys.
14. Make agent-acp accept the two fields and not use them when it runs an agent.
15. Run `pnpm boundary` and the agent-acp tests.
16. Set this task and the plan's Tasks list to `implemented`.

## Validation

- `packages/sdk/test/agents.test.ts`: for each npm part in `versions.json`, the install line names the first package.
- `packages/sdk/test/agents.test.ts`: each row has a command, and an install line or a page, that are not empty.
- `packages/sdk/test/agents.test.ts`: `installLine` gives the system's line over `all`, and nothing when the row has neither.
- `agent-acp-presets.test.ts`: a preset that writes `install` and `page` loads, and its agent runs as before.
- `agent-acp-presets.test.ts`: the keys of `presets` and `knownAgents` are the same set, and each command is the same.
- `pnpm boundary` passes with no new dependency in `@ahpd/server`.
- `pnpm test` passes in `packages/sdk` and `packages/agent-acp`.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** a vendor command copied wrong fails on a person's machine, so take each line from the vendor's docs and not from memory.
