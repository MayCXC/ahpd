---
title: A late problem line goes to the log
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/plugins.ts#L856-L897](../../../../packages/server/src/plugins.ts#L856-L897) - `told` and the `problem` callback"
  - "[code://packages/server/test/plugin-load.test.ts](../../../../packages/server/test/plugin-load.test.ts) - the load cases to extend"
---

## Objective

A `problem` line that a plugin says after its load answered goes to the daemon log at once.
A line said during the load stays in the load's answer, as today.

## Files

- `UPDATE: packages/server/src/plugins.ts:856-941` - `problem` writes a line to the log after the load answered.
- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.

## Steps

1. Read the plan's *Decisions locked in* row.
2. Find where the daemon writes the problems of a load, and pass that writer to the load.
3. Mark the load as answered just before each of its three returns.
4. In `problem`, push to `told` before that mark, and write to the log after it.
5. Add the test cases below.

## Validation

- `plugin-load.test.ts`: a line said during `apply` is in the load's problems and is not logged twice.
- `plugin-load.test.ts`: a line said after `apply` returned goes to the log.
- By hand: a bot file edited by hand to a new owner gives a line in the daemon log.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

Done 2026-10-13. Every step is built.

`problem` writes its line to the log once the load it belongs to has answered. Before that it still goes to `told`, which the answer reads. So a line said while the load runs is carried in that answer, exactly as it was.

File by file:

- `packages/server/src/plugins.ts` - in `loadOne`, `told` gained a companion `let answered = false` (step 3). It is set just before each of the three returns that carry `told`: the failed one, the vault-skipped one, and the loaded one. The `problem` callback the loader hands `pluginHost` is now `(line) => { if (answered) options.log(line); else told.push(line); }` (step 4). So a line said after the answer is written where the daemon writes the load's problems. The comment on `told` and a new one on `answered` say why.
- `packages/server/test/plugin-load.test.ts` - a new describe, `a problem line a plugin says`, with the two cases the Validation asks for. 24 cases before, 26 after.
- `packages/server/test/fixtures/plugin-late-problem/index.ts` - new, and a file the task's Files list does not name. It is a plugin named `late-problem` that says one problem while it applies. Then it keeps the host on `globalThis.__pluginLateProblemHost`, as `plugin-after` does. So a case can say another after `apply` returned.

Step 2 needed nothing new. The writer the daemon uses for a load's problems is the `log` it passes to `loadPlugins`. That is `stamp` in `packages/server/src/commands/run.ts`, which loops the returned `problems` at `run.ts:881`. `loadPlugins` hands that same `options.log` to `loadOne` at `plugins.ts:1115`. So `options.log` inside `loadOne` is that writer, and no option was added.

Judgement calls the plan does not decide, each visible in the file it is made in:

- `answered` is set just before each `return`, not straight after `await apply` settles. That is step 3 read literally. It keeps a line said between `apply` returning and the answer being built inside the answer rather than the log. That window covers `seal()` and the vault check.
- The late line is written as the plugin said it, with no `plugin <name>` added in front. A plugin's own lines already name it, and the plan's row says the line is logged as the loader's own lines are rather than rewritten. The bot's closure writes `@ahpd/bot: <line>` at `packages/bot/src/plugin.ts:45`.
- The failure return is marked too, so a plugin whose `apply` threw and that says a line afterwards is logged rather than lost. Step 3 names all three returns.

Validation:

- `pnpm -s schema` runs first. Then `pnpm -s typecheck` and `pnpm -s boundary` exit 0. Then vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` in one command: 241 files and 4343 tests, all pass. Run with `--maxWorkers=2 --testTimeout=10000`.
- `plugin-load.test.ts` alone: 26 cases pass. `packages/bot` alone: 5 files and 78 tests pass, which is the reported case's own store suite still intact.
- The log case fails without the change, at `expect(lines).toContain(...)`: before it the line went to `told` and nowhere else. The carried case's `expect(lines).not.toContain(...)` is what holds the line out of the log twice, since the daemon writes a load's problems itself.

Left:

- The by-hand line of the Validation is not run here. It wants a daemon started with the bot plugin, and a bot record edited on disk under it. This box cannot do that from inside a worktree session. That path reaches the same closure the fixture stands for. A hand edit to a new owner calls `onProblem` from the collection's watch, at `packages/bot/src/store.ts:159`, which is `host.problem`, at `packages/bot/src/plugin.ts:45`. It is now the loader's late-line writer.
- `packages/sdk/test/fixtures/wire.jsonl` is modified by the suite, as for every task in this plan. 33 lines changed: the endpoint line and the `ahpd.` `_meta` lines, none of them about a plugin's problems. `git restore`, `git checkout --` and `git stash push` are all denied in this mode, so it is left as the suite wrote it. Run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
- Nothing is committed, as asked.
