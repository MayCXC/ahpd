---
title: ahpd paths lists, adds and removes a folder
status: implemented
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/configure.ts#L309-L321](../../../../packages/server/src/commands/configure.ts#L309-L321) - `under`, and the read and write of `paths` to copy"
  - "[code://packages/server/src/commands/plugin.ts#L117-L174](../../../../packages/server/src/commands/plugin.ts#L117-L174) - the declaration shape, `oneAtATime` and the restart line"
  - "[code://packages/server/src/commands/config.ts#L168-L199](../../../../packages/server/src/commands/config.ts#L168-L199) - a read, and `loadConfig` for every layer"
---

## Objective

`ahpd paths list`, `ahpd paths add <folder>` and `ahpd paths remove <folder>` work at the terminal.
`remove` asks to continue, or takes `--yes`.
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

Implemented 2026-10-14. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/test/server-paths.test.ts` - created, with eleven cases for the terminal. Steps 1 to 10. It runs the commands two ways. `run` through `cliRegistry` answers what a command returns and says. `line` through `Program` with `programGlobals` is what a person reads, and what `--json` puts on stdout. The configuration is a temporary `$XDG_CONFIG_HOME`, so `paths` is written to and read from a file no other case touches. A record written to `daemon.json` with this process's own pid is what says a daemon is up. `running()` reads the record and checks the pid is alive. The ten cases came first and all eleven failed with `no paths.list`, `no paths.add` and `no paths.remove`.
- `packages/server/src/commands/configure.ts` - `under` is exported. Step 11, one word: `paths.ts` uses the same test `askToServe` does rather than a second one that would drift from it.
- `packages/server/src/commands/paths.ts` - created. Steps 12 to 15. `declarePaths(registry, served?)` returns the three commands. `paths list` reads `loadConfig(asked)` and answers the folders of every layer, the way `config` does. `paths add` and `paths remove` run their body in `oneAtATime`. They read the file with `readEntry`, and write it back with `writeEntry` and `{ ...held, paths }`. Every other key in the file is kept as it was found. `fileOf` is `plugin.ts`'s: the named file at the terminal, `served.configFile` served. A folder already in `paths` says `is already served.`; one under a folder that is says `is under <one>, which is served.`; both answer the list as it is and write nothing. The last folder is refused with the reason `configure.ts:219` gives for an empty `paths`. A daemon that names none serves the folder it is started in.
- `packages/server/src/commands/registry.ts` - `declarePaths(registry)` between `declareTeams` and `declarePlugin`, with the import beside theirs. Step 16.
- `packages/server/test/server-cli-start.test.ts` - one case, `serves a folder added with \`paths add\`, and the start line names it`. Not one of the task's Files.

Judgement calls the plan does not decide:

- The resource kind is `folder`: `read` with no key for `list`, `add` with no key, and `remove` with `key: 'folder'`. The plan names the verbs and the effect but not the kind.
- The HTTP routes are `GET /paths/list`, `POST /paths/add` and `POST /paths/remove`, with `folder` in the body as `plugin install` takes `name`. The plan's runtime path writes `POST /v1/paths/add`; the API's prefix is `/api`, and a command's `http.path` is relative to it, as `/plugin/install` and `/plugin/remove` are.
- `paths list` takes `--config-file` and nothing else, rather than the whole `flagFields` a run takes. It answers what the configuration says, so a `--path` typed beside it would name a folder the answer does not carry.
- The refusal texts: `No folder at <folder>.`, `<folder> is not a folder.`, `<folder> is already served.`, `<folder> is under <one>, which is served.`, `<folder> is not in "paths" in <file>.`, `The last folder in "paths" cannot be removed, because a daemon with no "paths" serves the folder it is started in.`, and `paths: none named` for an empty list, which is `plugin list`'s wording.
- The restart line names the served call as well as the restart: `Restart the daemon to apply the change: ahpd restart. To reach it now: ahpd --remote <url> paths add <folder>`. `plugin.ts`'s line is about loading a change and stops at `ahpd restart`. A folder is a setting a remote call applies at once, which is task 02. `restart.ts` already spells the remote half `ahpd --remote <url>`.
- A written answer is `{ paths }`, and the restart key beside it when a record says a daemon is up, which is `plugin install`'s `{ plugins, restart? }`.

What the plan did not know:

- The by-hand line is a case now. `ahpd start` in this mode is a separate process the suite drives through `packages/server/test/cli.ts`, so the line is run there rather than typed. `paths add` writes the file, and then a `start` with no `--path` logs `sessions in <folder>`. Against the code before step 12 it fails on `no paths.add`.
- `paths` reaches a run through `optionsFrom`'s `given('paths') ?? []`. A folder in the file is therefore served by a start that names none. That is what makes this case the by-hand line and not a second thing.
- The plan's `/v1/paths/add` is the only place it names a route. The API's routes hang off `/api`. No decision changes, only the spelling in the plan's runtime path.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root, in one command with `--maxWorkers=2 --testTimeout=10000`: 243 files and 4376 tests pass. The eleven new cases fail with `no paths.list`, `no paths.add` and `no paths.remove` before step 12, and pass after it. `server-cli-start.test.ts` on its own: 15 cases pass.
- The by-hand line is the case above, which passes.

Left:

- By hand, on a fresh configuration folder: `ahpd paths add <folder>` then `ahpd start` on a machine with a terminal. The case above runs both, so what is left of the line is only that it was not typed.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
