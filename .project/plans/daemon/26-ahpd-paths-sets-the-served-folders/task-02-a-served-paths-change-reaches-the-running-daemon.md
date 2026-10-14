---
title: a served paths change reaches the running daemon
status: implemented
depends: [task-01-ahpd-paths-lists-adds-and-removes-a-folder.md]
layer: server
refs:
  - "[code://packages/server/src/commands/served.ts#L76-L87](../../../../packages/server/src/commands/served.ts#L76-L87) - the served registry"
  - "[code://packages/server/src/commands/configure.ts#L319](../../../../packages/server/src/commands/configure.ts#L319) - the push to the running list"
  - "[code://packages/server/src/commands/plugin.ts#L134](../../../../packages/server/src/commands/plugin.ts#L134) - `deploymentTokenOnly` on a write"
---

## Objective

The daemon serves `paths list`, `paths add` and `paths remove` over HTTP.
A served `add` or `remove` writes the daemon's own `config.json` and changes `served.options.paths`, so `ahpd status` shows the change at once.

## Files

- `UPDATE: packages/server/src/commands/paths.ts` - the served form: the daemon's file, no `configFile` field, the live list, and `deploymentTokenOnly`.
- `UPDATE: packages/server/src/commands/served.ts:76-87` - call `declarePaths(registry, facts)`.
- `UPDATE: packages/server/test/server-paths.test.ts` - cases for the served form.

## Steps

1. Add a case: a served `paths add` writes the daemon's `config.json` and adds the folder to `served.options.paths`.
2. Add a case: after a served `add`, `running().paths` holds the new folder.
3. Add a case: a served `paths remove` removes the folder from the file and from `served.options.paths`.
4. Add a case: a served `add` refuses a person's token, and accepts the deployment's token.
5. Add a case: a served `add` answers no restart line.
6. Run the cases and see them fail.
7. In `paths.ts`, use `served.configFile` as the file of the served form, and drop the `configFile` field.
8. After a served write, change `served.options.paths` in place, as `askToServe` does.
9. Set `meta: { deploymentTokenOnly: 'add or remove a served folder' }` on `add` and `remove`.
10. Call `declarePaths(registry, facts)` in `servedRegistry`.
11. Run the cases again and see them pass.

## Validation

- The new cases pass, and they fail before step 8.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand: with a daemon running, `ahpd --remote <url> paths add <folder>`, then `ahpd status`. The status names the folder.

## Resume

Implemented 2026-10-14. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/commands/paths.ts` - the served form. Steps 7 to 9. Served, `fileOf` answers `served.configFile` and never the request's `configFile`. The field is left out of the served declaration, and so out of the manifest a `--remote` client reads. After `writeEntry`, the same folder is pushed onto or spliced out of `served.options.paths` in place. That array is the one `run.ts`'s `running()` returns per request. It is therefore the one `ahpd status` reads, because the daemon's own `running()` says `paths: options.paths`. `restarting()` is `served === undefined && running() !== undefined`. A served write therefore says nothing about a restart, and carries no `restart` key. `meta: { deploymentTokenOnly: 'add or remove a served folder' }` is on `add` and `remove`. `scopes.ts` builds the refusal from `deploymentOnly(actor.id, ...)`, so the sentence names the person who was refused.
- `packages/server/src/commands/served.ts:83` - `declarePaths(registry, facts)` between `declareTeams` and `declarePlugin`, with the import beside theirs. Step 10.
- `packages/server/test/server-paths.test.ts` - six served cases, steps 1 to 5, against the handler `apiHandler` builds over `servedRegistry(facts)`. The facts carry an `Options` of their own. Its `paths` is the array the daemon was started with. Its `running()` reads that array per call, which is what `run.ts` does. The cases run one by one. An `add` writes the daemon's file and reaches `own.paths`. `GET /paths/list` answers the daemon's own file. `running().paths` shows the add with no restart. A `remove` takes the folder out of both. An administrator's token is refused with `ada may not add or remove a served folder here; only the deployment token may`, while the deployment token is taken. The whole answer is `{ paths: [one] }`, with no restart key. All six failed with a 404 before step 10. Three of them failed again with the in-place change taken out.
- `packages/server/test/server-http.test.ts` - the Validation's by-hand line as a case, `adds a folder to the daemon it reaches, and the daemon serves it with no restart`. A real daemon runs on `{ http: true, paths: [serving], plugins: [BACKEND] }` with `--connection-token root-secret`. A second process runs `ahpd --remote <url> --token root-secret paths add <added>`. Its `XDG_CONFIG_HOME` is the client's own, not the daemon's. A write that read the wrong file would land where the case sees it. The daemon's `config.json` holds the added folder. The answer names no restart, and the `status` after it reports both folders. Not one of the task's Files.

Judgement calls the plan does not decide:

- The by-hand line is a case rather than a note, following task 01. What a remote answer reads is not the daemon's `say` lines. `@cofold/remote`'s `serve` answers `result?.data ?? null`, so the client renders the fields of the data one per line. A remote `status` therefore reads `paths: <folders>`, where a local one reads `sessions in <folders>`. The case reads that `paths` line with a small `foldersIn` helper. That is the whole remote surface's rendering, and not something this task chose. What the line promises - the daemon serves the folder, and `status` names it - is what the case checks.
- What a served write answers is `output({ paths }, '')`: the data, and no plain text. The `say` lines a terminal reads go to the daemon's log, and are not what a client is shown.
- The refusal is on the deployment's own token rather than on a scope. Which folders a host's agents may reach is a grant over every session's reach, which is `plugin install`'s reasoning. No decision changes.

What the plan did not know:

- The task's Files list names `packages/server/test/server-paths.test.ts` alone among the tests. It does not name `packages/server/test/server-http.test.ts`, where the `--remote` cases and the daemon helper live. That is where the by-hand line was written.
- It does not name `packages/server/test/server-commands.test.ts` either. That file's pinned manifest table, grants and served-input rows gained the three `paths.*` entries in task 01. Task 02 adds nothing to it.
- `docs/DAEMON.md`'s `## Commands` block (line 163) lists every verb and gains none from this plan, because the plan names no doc file. `ahpd paths list`, `add` and `remove` are missing there.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite on every run and is left dirty. `git restore packages/sdk/test/fixtures/wire.jsonl` is denied in this mode, so Softov has to run it before a commit.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0. The schema was generated before the suite was run, as `pnpm -s schema` did here.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root, in one command with `--maxWorkers=2 --testTimeout=10000`: 243 files and 4383 tests pass. The seven new cases are the six served ones and the `--remote` one.
- The new cases fail before step 8. With `const live = served?.options.paths;` replaced by an undefined value, three served cases and the `--remote` case fail. They pass again with the line put back.
- The new cases fail before step 10. With `declarePaths(registry, facts)` commented out of `servedRegistry`, every served case answers 404, and the `--remote` case exits 2.
- By hand: the line is the case above, which passes. Both processes are real, and the client's configuration directory is its own.

Left:

- By hand, typed on a machine with a terminal and a daemon already up: `ahpd --remote <url> paths add <folder>`, then `ahpd status`. The case above runs both, so what is left of the line is only that it was not typed.
- The plan's Final verification checklist and the review, which are not a task's.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten and not restored, because every command that would put it back is denied in this mode.
