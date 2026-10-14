---
title: ahpd paths lists, adds and removes a folder
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/configure.ts#L309-L321](../../../../packages/server/src/commands/configure.ts#L309-L321) - `under`, and the read and write of `paths` to copy"
  - "[code://packages/server/src/commands/plugin.ts#L117-L174](../../../../packages/server/src/commands/plugin.ts#L117-L174) - the declaration shape, `oneAtATime` and the restart line"
  - "[code://packages/server/src/commands/config.ts#L168-L199](../../../../packages/server/src/commands/config.ts#L168-L199) - a read, and `loadConfig` for every layer"
---

## Objective

`ahpd paths list`, `ahpd paths add <folder>` and `ahpd paths remove <folder>` work at the terminal and ask nothing.
`add` and `remove` write `paths` in `config.json`. Each verb takes `--json`.

## Files

- `CREATE: packages/server/src/commands/paths.ts` - `declarePaths(registry, served?)`, with the three verbs as cli and http surfaces.
- `UPDATE: packages/server/src/commands/registry.ts:52-69` - call `declarePaths` in `cliRegistry`.
- `UPDATE: packages/server/src/commands/configure.ts:290-294` - export `under`, so `paths.ts` uses the same test.
- `CREATE: packages/server/test/server-paths.test.ts` - cases for the three verbs at the terminal.

## Steps

1. Create `packages/server/test/server-paths.test.ts`, and run the commands through `cliRegistry` against a temporary `configFile`.
2. Add a case: `paths add <folder>` with no `config.json` writes the file, with `paths` set to the resolved folder.
3. Add a case: `paths add` of a missing folder, and of a file, each stop with a message and write nothing.
4. Add a case: `paths add` of a folder under a served one leaves the file as it is, and says so.
5. Add a case: `paths remove <folder>` removes it, and keeps every other key in `config.json`.
6. Add a case: `paths remove` of a folder not in `paths` stops with a message.
7. Add a case: `paths remove` of the last folder stops with a message, and the file keeps it.
8. Add a case: `paths list --json` answers the folders, and `paths add --json` answers `{ paths }`.
9. Add a case: with a daemon record present, `add` says a restart applies the change, or `--remote` applies it now.
10. Run the cases and see them fail.
11. Export `under` from `configure.ts`.
12. Create `paths.ts` with `declarePaths`, using `plugin install` and `remove` as the model.
13. Give `paths add` and `paths remove` a `folder` argument, the `configFile` field, `effect` and the `config:write` scope.
14. Run each write in `oneAtATime`, with `readEntry` and `writeEntry`.
15. Make `paths list` read every layer with `loadConfig`, as `config` does.
16. Call `declarePaths(registry)` in `cliRegistry`.
17. Run the cases again and see them pass.

## Validation

- The new cases pass, and they fail before step 12.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand: on a fresh configuration folder, `ahpd paths add <folder>`, then `ahpd start`. The start line names the folder.

## Resume

Not started.
